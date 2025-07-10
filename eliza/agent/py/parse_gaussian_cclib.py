#!/usr/bin/env python3
"""
Comprehensive Gaussian file parser using cclib
Extracts all available molecular data and converts to RDF format
"""

import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
import numpy as np

try:
    import cclib
except ImportError:
    print("Error: cclib not installed. Install with: pip install cclib")
    sys.exit(1)

def safe_extract_attribute(data, attr_name):
    """Safely extract an attribute from cclib data object"""
    try:
        return getattr(data, attr_name, None)
    except AttributeError:
        return None

def numpy_to_python(obj):
    """Convert numpy arrays and types to Python native types"""
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: numpy_to_python(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [numpy_to_python(item) for item in obj]
    return obj

def generate_rdf_triples(data, metadata, output_format="turtle"):
    """Generate RDF triples from cclib parsed data"""
    
    # RDF prefixes
    prefixes = {
        'cheminf': 'http://semanticscience.org/resource/',
        'dcterms': 'http://purl.org/dc/terms/',
        'ex': 'https://example.org/gaussian#',
        'ontocompchem': 'http://www.theworldavatar.com/ontology/ontocompchem/',
        'prov': 'http://www.w3.org/ns/prov#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
        'qudt': 'http://qudt.org/schema/qudt/',
        'unit': 'http://qudt.org/vocab/unit/'
    }
    
    # Start RDF document
    rdf_lines = []
    
    # Add prefixes
    for prefix, uri in prefixes.items():
        rdf_lines.append(f"@prefix {prefix}: <{uri}> .")
    rdf_lines.append("")
    
    # Create unique calculation ID
    calc_id = f"calc_{metadata['timestamp'].replace('-', '').replace(':', '')}"
    molecule_id = f"mol_{calc_id}"
    
    # Main calculation entity
    rdf_lines.append(f"ex:{calc_id} a ontocompchem:QuantumCalculation ;")
    rdf_lines.append(f'    dcterms:created "{metadata["timestamp"]}"^^xsd:dateTime ;')
    rdf_lines.append(f'    dcterms:source "{metadata["filename"]}" ;')
    rdf_lines.append(f"    ontocompchem:hasMolecule ex:{molecule_id} .")
    rdf_lines.append("")
    
    # Molecule entity
    rdf_lines.append(f"ex:{molecule_id} a cheminf:Molecule ;")
    
    # Basic molecular properties
    if hasattr(data, 'natom') and data.natom is not None:
        rdf_lines.append(f"    cheminf:hasAtomCount {data.natom} ;")
    
    if hasattr(data, 'charge') and data.charge is not None:
        rdf_lines.append(f"    cheminf:hasCharge {data.charge} ;")
    
    if hasattr(data, 'mult') and data.mult is not None:
        rdf_lines.append(f"    cheminf:hasMultiplicity {data.mult} ;")
    
    # Molecular formula and mass
    if hasattr(data, 'atommasses') and data.atommasses is not None:
        total_mass = float(np.sum(data.atommasses))
        rdf_lines.append(f"    cheminf:hasMolecularWeight {total_mass:.6f} ;")
    
    rdf_lines[-1] = rdf_lines[-1].rstrip(' ;') + " ."
    rdf_lines.append("")
    
    # Atomic coordinates and properties
    if hasattr(data, 'atomcoords') and data.atomcoords is not None and len(data.atomcoords) > 0:
        coords = data.atomcoords[-1]  # Get final geometry
        atomnos = data.atomnos if hasattr(data, 'atomnos') else None
        
        for i, coord in enumerate(coords):
            atom_id = f"atom_{molecule_id}_{i+1}"
            rdf_lines.append(f"ex:{atom_id} a cheminf:Atom ;")
            rdf_lines.append(f"    cheminf:isPartOf ex:{molecule_id} ;")
            
            if atomnos is not None:
                rdf_lines.append(f"    cheminf:hasAtomicNumber {atomnos[i]} ;")
            
            rdf_lines.append(f"    cheminf:hasXCoordinate {coord[0]:.6f} ;")
            rdf_lines.append(f"    cheminf:hasYCoordinate {coord[1]:.6f} ;")
            rdf_lines.append(f"    cheminf:hasZCoordinate {coord[2]:.6f} .")
            rdf_lines.append("")
    
    # SCF Energies
    if hasattr(data, 'scfenergies') and data.scfenergies is not None:
        for i, energy in enumerate(data.scfenergies):
            energy_hartree = energy / 27.211386024367243  # Convert eV to Hartree
            rdf_lines.append(f"ex:{calc_id} ontocompchem:hasSCFEnergy {energy_hartree:.10f} .")
    
    # HOMO-LUMO information
    if hasattr(data, 'homos') and data.homos is not None and hasattr(data, 'moenergies'):
        for spin, homo_idx in enumerate(data.homos):
            if homo_idx is not None and homo_idx >= 0:
                if len(data.moenergies) > spin and len(data.moenergies[spin]) > homo_idx:
                    homo_energy = data.moenergies[spin][homo_idx]
                    rdf_lines.append(f"ex:{calc_id} ontocompchem:hasHOMOEnergy {homo_energy:.6f} .")
                    
                    # LUMO energy
                    if len(data.moenergies[spin]) > homo_idx + 1:
                        lumo_energy = data.moenergies[spin][homo_idx + 1]
                        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasLUMOEnergy {lumo_energy:.6f} .")
                        
                        # HOMO-LUMO gap
                        gap = lumo_energy - homo_energy
                        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasHOMOLUMOGap {gap:.6f} .")
    
    # Vibrational frequencies
    if hasattr(data, 'vibfreqs') and data.vibfreqs is not None:
        for i, freq in enumerate(data.vibfreqs):
            freq_id = f"freq_{calc_id}_{i+1}"
            rdf_lines.append(f"ex:{freq_id} a ontocompchem:VibrationalFrequency ;")
            rdf_lines.append(f"    ontocompchem:belongsTo ex:{calc_id} ;")
            rdf_lines.append(f"    ontocompchem:hasFrequency {freq:.2f} ;")
            rdf_lines.append(f"    qudt:hasUnit unit:PER-CM .")
            
            # IR intensities
            if hasattr(data, 'vibirs') and data.vibirs is not None and i < len(data.vibirs):
                rdf_lines.append(f"ex:{freq_id} ontocompchem:hasIRIntensity {data.vibirs[i]:.4f} .")
            
            # Raman activities
            if hasattr(data, 'vibramans') and data.vibramans is not None and i < len(data.vibramans):
                rdf_lines.append(f"ex:{freq_id} ontocompchem:hasRamanActivity {data.vibramans[i]:.4f} .")
            
            rdf_lines.append("")
    
    # Thermodynamic properties
    if hasattr(data, 'enthalpy') and data.enthalpy is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasEnthalpy {data.enthalpy:.10f} .")
    
    if hasattr(data, 'freeenergy') and data.freeenergy is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasFreeEnergy {data.freeenergy:.10f} .")
    
    if hasattr(data, 'entropy') and data.entropy is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasEntropy {data.entropy:.10f} .")
    
    if hasattr(data, 'zpve') and data.zpve is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasZPVE {data.zpve:.10f} .")
    
    # Electronic transition data
    if hasattr(data, 'etenergies') and data.etenergies is not None:
        for i, energy in enumerate(data.etenergies):
            trans_id = f"trans_{calc_id}_{i+1}"
            rdf_lines.append(f"ex:{trans_id} a ontocompchem:ElectronicTransition ;")
            rdf_lines.append(f"    ontocompchem:belongsTo ex:{calc_id} ;")
            rdf_lines.append(f"    ontocompchem:hasTransitionEnergy {energy:.2f} ;")
            rdf_lines.append(f"    qudt:hasUnit unit:PER-CM .")
            
            # Oscillator strengths
            if hasattr(data, 'etoscs') and data.etoscs is not None and i < len(data.etoscs):
                rdf_lines.append(f"ex:{trans_id} ontocompchem:hasOscillatorStrength {data.etoscs[i]:.6f} .")
            
            rdf_lines.append("")
    
    # Atomic charges
    if hasattr(data, 'atomcharges') and data.atomcharges is not None:
        for charge_type, charges in data.atomcharges.items():
            for i, charge in enumerate(charges):
                atom_id = f"atom_{molecule_id}_{i+1}"
                rdf_lines.append(f"ex:{atom_id} ontocompchem:has{charge_type}Charge {charge:.6f} .")
    
    # Molecular orbital information
    if hasattr(data, 'moenergies') and data.moenergies is not None:
        for spin, energies in enumerate(data.moenergies):
            for i, energy in enumerate(energies):
                mo_id = f"mo_{calc_id}_spin{spin}_{i+1}"
                rdf_lines.append(f"ex:{mo_id} a ontocompchem:MolecularOrbital ;")
                rdf_lines.append(f"    ontocompchem:belongsTo ex:{calc_id} ;")
                rdf_lines.append(f"    ontocompchem:hasSpin {spin} ;")
                rdf_lines.append(f"    ontocompchem:hasOrbitalIndex {i+1} ;")
                rdf_lines.append(f"    ontocompchem:hasOrbitalEnergy {energy:.6f} .")
    
    # Dipole moments
    if hasattr(data, 'moments') and data.moments is not None:
        for i, moment_set in enumerate(data.moments):
            if len(moment_set) >= 4:  # Has dipole moment
                dipole_magnitude = np.sqrt(sum(moment_set[1:4]**2))
                rdf_lines.append(f"ex:{calc_id} ontocompchem:hasDipoleMoment {dipole_magnitude:.6f} .")
    
    # Basis set information
    if hasattr(data, 'nbasis') and data.nbasis is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:hasBasisFunctions {data.nbasis} .")
    
    # Optimization information
    if hasattr(data, 'optdone') and data.optdone is not None:
        rdf_lines.append(f"ex:{calc_id} ontocompchem:isOptimizationConverged {str(data.optdone).lower()} .")
    
    # Polarizabilities
    if hasattr(data, 'polarizabilities') and data.polarizabilities is not None:
        for i, pol_tensor in enumerate(data.polarizabilities):
            if pol_tensor.shape == (3, 3):
                # Average polarizability (trace/3)
                avg_pol = np.trace(pol_tensor) / 3.0
                rdf_lines.append(f"ex:{calc_id} ontocompchem:hasAveragePolarizability {avg_pol:.6f} .")
    
    # Add metadata
    rdf_lines.append("")
    rdf_lines.append(f"# Parsed using cclib version: {cclib.__version__}")
    rdf_lines.append(f"# Generated on: {datetime.now().isoformat()}")
    rdf_lines.append(f"# Source file: {metadata['filename']}")
    
    return "\n".join(rdf_lines)

def extract_all_cclib_data(data):
    """Extract all available cclib data into a comprehensive dictionary"""
    
    # List of all cclib attributes from the documentation
    cclib_attributes = [
        'aonames', 'aooverlaps', 'atombasis', 'atomcharges', 'atomcoords', 
        'atommasses', 'atomnos', 'atomspins', 'ccenergies', 'charge', 
        'coreelectrons', 'dispersionenergies', 'enthalpy', 'entropy', 
        'etenergies', 'etoscs', 'etdips', 'etveldips', 'etmagdips', 'etrotats', 
        'etsecs', 'etsyms', 'freeenergy', 'fonames', 'fooverlaps', 'fragnames', 
        'frags', 'gbasis', 'geotargets', 'geovalues', 'grads', 'hessian', 
        'homos', 'metadata', 'mocoeffs', 'moenergies', 'moments', 'mosyms', 
        'mpenergies', 'mult', 'natom', 'nbasis', 'nmo', 'nmrtensors', 
        'nmrcouplingtensors', 'nocoeffs', 'nooccnos', 'nsocoeffs', 'nsooccnos', 
        'optdone', 'optstatus', 'polarizabilities', 'pressure', 'rotconsts', 
        'scancoords', 'scanenergies', 'scannames', 'scanparm', 'scfenergies', 
        'scftargets', 'scfvalues', 'temperature', 'time', 'transprop', 
        'vibanharms', 'vibdisps', 'vibfreqs', 'vibfconsts', 'vibirs', 
        'vibramans', 'vibrmasses', 'vibsyms', 'zpve'
    ]
    
    extracted_data = {}
    
    for attr in cclib_attributes:
        value = safe_extract_attribute(data, attr)
        if value is not None:
            # Convert numpy arrays to Python lists for JSON serialization
            extracted_data[attr] = numpy_to_python(value)
    
    return extracted_data

def main():
    parser = argparse.ArgumentParser(description='Parse Gaussian files using cclib')
    parser.add_argument('input_file', help='Path to Gaussian output file')
    parser.add_argument('metadata', help='Metadata JSON string')
    parser.add_argument('--format', choices=['turtle', 'json'], default='turtle',
                       help='Output format (default: turtle)')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    try:
        # Parse metadata
        metadata = json.loads(args.metadata)
        
        if args.verbose:
            print(f"Parsing file: {args.input_file}")
            print(f"Using cclib version: {cclib.__version__}")
        
        # Parse the Gaussian file using cclib
        data = cclib.io.ccread(args.input_file)
        
        if data is None:
            print(f"Error: Could not parse file {args.input_file}", file=sys.stderr)
            sys.exit(1)
        
        if args.verbose:
            print(f"Successfully parsed file with {data.natom if hasattr(data, 'natom') else 'unknown'} atoms")
        
        if args.format == 'turtle':
            # Generate RDF output
            rdf_output = generate_rdf_triples(data, metadata)
            
            if args.output:
                with open(args.output, 'w') as f:
                    f.write(rdf_output)
                print(f"RDF output written to {args.output}")
            else:
                print(rdf_output)
        
        elif args.format == 'json':
            # Extract all available data
            extracted_data = extract_all_cclib_data(data)
            extracted_data['metadata'] = metadata
            extracted_data['cclib_version'] = cclib.__version__
            
            json_output = json.dumps(extracted_data, indent=2, default=str)
            
            if args.output:
                with open(args.output, 'w') as f:
                    f.write(json_output)
                print(f"JSON output written to {args.output}")
            else:
                print(json_output)
        
        if args.verbose:
            # Print summary of extracted data
            print("\nExtracted data summary:")
            all_data = extract_all_cclib_data(data)
            for attr, value in all_data.items():
                if value is not None:
                    if isinstance(value, (list, np.ndarray)) and len(value) > 0:
                        print(f"  {attr}: {type(value).__name__} with {len(value)} elements")
                    elif isinstance(value, dict):
                        print(f"  {attr}: dict with keys: {list(value.keys())}")
                    else:
                        print(f"  {attr}: {type(value).__name__} = {value}")
    
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 