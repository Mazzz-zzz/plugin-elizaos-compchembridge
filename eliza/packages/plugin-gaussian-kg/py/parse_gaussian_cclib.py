#!/usr/bin/env python3
"""
Gaussian file parser using cclib for comprehensive data extraction
Generates RDF/Turtle knowledge graph data with full molecular properties
"""

import sys
import json
import os
from pathlib import Path
import numpy as np
from datetime import datetime

try:
    import cclib
    from cclib.io import ccread
    from cclib.parser.utils import PeriodicTable
except ImportError:
    print("Error: cclib is required. Install with: pip install cclib", file=sys.stderr)
    sys.exit(1)

def safe_array_to_list(arr):
    """Safely convert numpy arrays to lists, handling various data types"""
    if arr is None:
        return None
    if isinstance(arr, (list, tuple)):
        return list(arr)
    if isinstance(arr, np.ndarray):
        if arr.dtype.kind in ['i', 'f']:  # integer or float
            return arr.tolist()
        elif arr.dtype.kind == 'U':  # unicode string
            return arr.tolist()
        else:
            return [str(x) for x in arr.flatten()]
    return arr

def extract_cclib_data(filepath):
    """Extract comprehensive molecular data using cclib"""
    try:
        # Parse the file using cclib
        parsed_data = ccread(filepath)
        
        if parsed_data is None:
            return {"error": f"Failed to parse file: {filepath}"}
        
        # Initialize data dictionary
        data = {
            "metadata": {
                "filepath": str(filepath),
                "filename": os.path.basename(filepath),
                "parser": "cclib",
                "cclib_version": cclib.__version__,
                "parsed_at": datetime.now().isoformat()
            }
        }
        
        # Extract all available cclib attributes
        cclib_attrs = [
            # Basic molecular information
            'atomnos', 'atomcoords', 'charge', 'mult', 'natom',
            
            # Core energies
            'scfenergies',
            
            # Basic vibrational data
            'vibfreqs',
            
            # Thermochemistry
            'enthalpy', 'entropy', 'freeenergy', 'zpve', 'temperature', 'pressure',
       


            
            # Other properties
            'rotconsts', 'time', 'transprop', 'coreelectrons', 'hessian'
        ]
        
        # Extract available attributes
        for attr in cclib_attrs:
            if hasattr(parsed_data, attr):
                value = getattr(parsed_data, attr)
                if value is not None:
                    # Convert numpy arrays to lists for JSON serialization
                    data[attr] = safe_array_to_list(value)
        
        # Add derived properties
        if hasattr(parsed_data, 'atomnos') and parsed_data.atomnos is not None:
            pt = PeriodicTable()
            data['atomsymbols'] = [pt.element[int(num)] for num in parsed_data.atomnos]
        
        # Calculate HOMO-LUMO gaps if possible
        if hasattr(parsed_data, 'moenergies') and hasattr(parsed_data, 'homos'):
            homo_lumo_gaps = []
            for i, (energies, homo_idx) in enumerate(zip(parsed_data.moenergies, parsed_data.homos)):
                if len(energies) > homo_idx + 1:
                    gap_ev = energies[homo_idx + 1] - energies[homo_idx]
                    homo_lumo_gaps.append({
                        'spin': i,
                        'homo_energy_ev': energies[homo_idx],
                        'lumo_energy_ev': energies[homo_idx + 1],
                        'gap_ev': gap_ev,
                        'gap_hartree': gap_ev / 27.211  # Convert to hartree
                    })
            if homo_lumo_gaps:
                data['homo_lumo_gaps'] = homo_lumo_gaps
        
        # Extract final geometry (last set of coordinates)
        if hasattr(parsed_data, 'atomcoords') and parsed_data.atomcoords is not None:
            data['final_geometry'] = safe_array_to_list(parsed_data.atomcoords[-1])
        
        # Calculate molecular formula if possible
        if hasattr(parsed_data, 'atomnos') and parsed_data.atomnos is not None:
            from collections import Counter
            pt = PeriodicTable()
            formula_dict = Counter([pt.element[int(num)] for num in parsed_data.atomnos])
            formula = ''.join([f"{elem}{count if count > 1 else ''}" 
                              for elem, count in sorted(formula_dict.items())])
            data['molecular_formula'] = formula
        
        # Add calculation type information if available
        if hasattr(parsed_data, 'metadata') and parsed_data.metadata is not None:
            data['calculation_metadata'] = parsed_data.metadata
        
        return data
        
    except Exception as e:
        return {"error": f"Error parsing {filepath}: {str(e)}"}

def generate_rdf_from_cclib(data, metadata=None):
    """Generate RDF/Turtle representation from cclib data"""
    
    if "error" in data:
        return f"# Error: {data['error']}\n"
    
    filename = data['metadata']['filename']
    base_name = os.path.splitext(filename)[0]
    
    # RDF prefixes and header
    rdf_content = f"""@prefix cheminf: <http://semanticscience.org/resource/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix ex: <https://example.org/gaussian#> .
@prefix ontocompchem: <http://www.theworldavatar.com/ontology/ontocompchem/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix units: <http://www.ontology-of-units-of-measure.org/resource/om-2/> .

# Gaussian calculation data parsed with cclib v{data['metadata']['cclib_version']}
# Generated: {data['metadata']['parsed_at']}
# Source: {filename}

ex:{base_name} a ontocompchem:QuantumCalculation ;
    dcterms:source "{filename}" ;
    prov:generatedAtTime "{data['metadata']['parsed_at']}"^^xsd:dateTime ;
    ontocompchem:hasParser "cclib" ;
    ontocompchem:hasParserVersion "{data['metadata']['cclib_version']}" .

"""
    
    # Basic molecular properties
    if 'natom' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasNAtoms {data['natom']} .\n"
    
    if 'charge' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasCharge {data['charge']} .\n"
    
    if 'mult' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasMultiplicity {data['mult']} .\n"
    
    if 'molecular_formula' in data:
        rdf_content += f'ex:{base_name} ontocompchem:hasMolecularFormula "{data["molecular_formula"]}" .\n'
    
    # SCF energies
    if 'scfenergies' in data:
        for i, energy in enumerate(data['scfenergies']):
            energy_hartree = energy / 27.211  # Convert eV to Hartree
            rdf_content += f"ex:{base_name} ontocompchem:hasSCFEnergy {energy_hartree:.8f} .\n"
            rdf_content += f"ex:{base_name} ontocompchem:hasSCFEnergyEV {energy:.6f} .\n"
    
    # HOMO-LUMO gaps
    if 'homo_lumo_gaps' in data:
        for gap_data in data['homo_lumo_gaps']:
            rdf_content += f"ex:{base_name} ontocompchem:hasHOMOEnergy {gap_data['homo_energy_ev']:.6f} .\n"
            rdf_content += f"ex:{base_name} ontocompchem:hasLUMOEnergy {gap_data['lumo_energy_ev']:.6f} .\n"
            rdf_content += f"ex:{base_name} ontocompchem:hasHOMOLUMOGap {gap_data['gap_ev']:.6f} .\n"
    
    # Vibrational frequencies (basic)
    if 'vibfreqs' in data:
        for i, freq in enumerate(data['vibfreqs']):
            freq_id = f"{base_name}_freq_{i+1}"
            rdf_content += f"ex:{freq_id} a ontocompchem:VibrationalFrequency ;\n"
            rdf_content += f"    ontocompchem:hasFrequency {freq:.2f} ;\n"
            rdf_content += f"    ontocompchem:belongsTo ex:{base_name} .\n"
    
    # Atoms and coordinates
    if 'atomnos' in data and 'final_geometry' in data:
        for i, (atomic_num, coords) in enumerate(zip(data['atomnos'], data['final_geometry'])):
            atom_id = f"{base_name}_atom_{i+1}"
            element = data.get('atomsymbols', [str(atomic_num)])[i] if i < len(data.get('atomsymbols', [])) else str(atomic_num)
            
            rdf_content += f"ex:{atom_id} a cheminf:Atom ;\n"
            rdf_content += f"    cheminf:hasAtomicNumber {atomic_num} ;\n"
            rdf_content += f"    cheminf:hasElement \"{element}\" ;\n"
            rdf_content += f"    cheminf:hasXCoordinate {coords[0]:.6f} ;\n"
            rdf_content += f"    cheminf:hasYCoordinate {coords[1]:.6f} ;\n"
            rdf_content += f"    cheminf:hasZCoordinate {coords[2]:.6f} ;\n"
            rdf_content += f"    cheminf:belongsTo ex:{base_name} .\n"
    
    # Molecular orbitals summary
    if 'nmo' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasNumberOfMOs {data['nmo']} .\n"
    
    if 'nbasis' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasNumberOfBasisFunctions {data['nbasis']} .\n"
    
    # Basis set information
    if 'aonames' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasAOCount {len(data['aonames'])} .\n"
    
    # Geometry optimization status
    if 'optdone' in data:
        rdf_content += f"ex:{base_name} ontocompchem:hasOptimizationConverged {str(data['optdone']).lower()} .\n"
    
    # Additional metadata
    if 'calculation_metadata' in data:
        for key, value in data['calculation_metadata'].items():
            if isinstance(value, (str, int, float)):
                rdf_content += f"ex:{base_name} ontocompchem:has{key.title()} \"{value}\" .\n"
    
    rdf_content += "\n"
    return rdf_content

def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_gaussian_cclib.py <gaussian_file> [metadata_json] [--format turtle|json]")
        sys.exit(1)
    
    filepath = sys.argv[1]
    metadata_json = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else "{}"
    
    # Parse format option
    output_format = "turtle"
    if "--format" in sys.argv:
        format_idx = sys.argv.index("--format")
        if format_idx + 1 < len(sys.argv):
            output_format = sys.argv[format_idx + 1]
    
    try:
        metadata = json.loads(metadata_json)
    except json.JSONDecodeError:
        metadata = {}
    
    # Extract data using cclib
    data = extract_cclib_data(filepath)
    
    if output_format == "json":
        # Output raw JSON data
        print(json.dumps(data, indent=2))
    else:
        # Output RDF/Turtle (default)
        rdf_output = generate_rdf_from_cclib(data, metadata)
        print(rdf_output)

if __name__ == "__main__":
    main() 