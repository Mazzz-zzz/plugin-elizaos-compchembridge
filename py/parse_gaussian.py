#!/usr/bin/env python3
"""
Gaussian 16 logfile parser for Eliza OS knowledge graphs.
Converts quantum chemistry calculations to RDF using standard ontologies.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

import numpy as np
from cclib import io as ccio
from rdflib import Graph, Namespace, URIRef, Literal, BNode
from rdflib.namespace import RDF, RDFS, XSD, DCTERMS, FOAF
from pydantic import BaseModel, Field


# Define ontology namespaces
ONTOCOMPCHEM = Namespace("http://www.theworldavatar.com/ontology/ontocompchem/")
CHEMINF = Namespace("http://semanticscience.org/resource/")
PROV = Namespace("http://www.w3.org/ns/prov#")
EX = Namespace("https://example.org/gaussian#")


class CalculationMetadata(BaseModel):
    """Metadata for a quantum chemistry calculation."""
    filename: Optional[str] = None
    timestamp: Optional[str] = None
    software_version: Optional[str] = None
    parser_version: str = "0.1.0"


class GaussianData(BaseModel):
    """Structured representation of Gaussian calculation data."""
    method: Optional[str] = None
    basis: Optional[str] = None
    scf_energy: Optional[float] = None
    frequencies: List[float] = Field(default_factory=list)
    atoms: List[int] = Field(default_factory=list)
    coordinates: List[List[float]] = Field(default_factory=list)
    converged: bool = False
    charge: Optional[int] = None
    multiplicity: Optional[int] = None
    homo_lumo_gap: Optional[float] = None
    dipole_moment: Optional[float] = None


def gaussian_to_dict(file_path: str) -> Dict[str, Any]:
    """
    Extract raw data from Gaussian logfile using cclib.
    
    Args:
        file_path: Path to the Gaussian logfile
        
    Returns:
        Dictionary containing parsed calculation data
    """
    try:
        data = ccio.ccread(file_path)
        if data is None:
            raise ValueError(f"Could not parse file: {file_path}")
        
        result = {}
        
        # Basic calculation info
        if hasattr(data, 'metadata') and data.metadata:
            if 'methods' in data.metadata and data.metadata['methods']:
                result['method'] = data.metadata['methods'][0]
            if 'basis_set' in data.metadata:
                result['basis'] = data.metadata['basis_set']
            if 'finished' in data.metadata:
                result['converged'] = data.metadata['finished']
        
        # Energies
        if hasattr(data, 'scfenergies') and len(data.scfenergies) > 0:
            result['scf_energy'] = float(data.scfenergies[-1])  # Final SCF energy
            
        # Molecular structure
        if hasattr(data, 'atomnos'):
            result['atoms'] = [int(a) for a in data.atomnos]
            
        if hasattr(data, 'atomcoords') and len(data.atomcoords) > 0:
            result['coordinates'] = data.atomcoords[-1].tolist()  # Final geometry
            
        # Vibrational frequencies
        if hasattr(data, 'vibfreqs'):
            result['frequencies'] = [float(f) for f in data.vibfreqs]
            
        # Electronic properties
        if hasattr(data, 'charge'):
            result['charge'] = int(data.charge)
            
        if hasattr(data, 'mult'):
            result['multiplicity'] = int(data.mult)
            
        # HOMO-LUMO gap
        if hasattr(data, 'moenergies') and len(data.moenergies) > 0:
            homo_lumo = data.moenergies[0]  # Alpha orbitals
            if hasattr(data, 'homos') and len(data.homos) > 0:
                homo_idx = data.homos[0]
                if homo_idx + 1 < len(homo_lumo):
                    gap = homo_lumo[homo_idx + 1] - homo_lumo[homo_idx]
                    result['homo_lumo_gap'] = float(gap)
        
        # Dipole moment
        if hasattr(data, 'moments') and len(data.moments) > 0:
            if len(data.moments[0]) >= 3:  # x, y, z components
                dipole_vec = data.moments[0][:3]
                result['dipole_moment'] = float(np.linalg.norm(dipole_vec))
        
        return result
        
    except Exception as e:
        raise RuntimeError(f"Error parsing Gaussian file {file_path}: {str(e)}")


def dict_to_graph(
    calc_data: Dict[str, Any], 
    file_uri: str, 
    metadata: CalculationMetadata
) -> Graph:
    """
    Convert parsed calculation data to RDF graph using standard ontologies.
    
    Args:
        calc_data: Parsed calculation data
        file_uri: URI identifier for this calculation
        metadata: Additional metadata about the calculation
        
    Returns:
        RDF Graph containing the calculation data
    """
    g = Graph()
    
    # Bind namespaces
    g.bind("ontocompchem", ONTOCOMPCHEM)
    g.bind("cheminf", CHEMINF)
    g.bind("prov", PROV)
    g.bind("ex", EX)
    g.bind("dcterms", DCTERMS)
    
    # Main calculation node
    calc_uri = URIRef(file_uri)
    g.add((calc_uri, RDF.type, ONTOCOMPCHEM.QuantumCalculation))
    
    # Basic metadata
    if metadata.filename:
        g.add((calc_uri, DCTERMS.title, Literal(metadata.filename)))
    
    timestamp = metadata.timestamp or datetime.now().isoformat()
    g.add((calc_uri, DCTERMS.created, Literal(timestamp, datatype=XSD.dateTime)))
    
    g.add((calc_uri, EX.schemaVersion, Literal("0.1.0")))
    g.add((calc_uri, EX.parserVersion, Literal(metadata.parser_version)))
    
    # Computational method
    if calc_data.get('method'):
        method_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasComputationalMethod, method_node))
        g.add((method_node, RDF.type, ONTOCOMPCHEM.ComputationalMethod))
        g.add((method_node, RDFS.label, Literal(calc_data['method'])))
    
    # Basis set
    if calc_data.get('basis'):
        basis_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasBasisSet, basis_node))
        g.add((basis_node, RDF.type, ONTOCOMPCHEM.BasisSet))
        g.add((basis_node, RDFS.label, Literal(calc_data['basis'])))
    
    # SCF Energy
    if calc_data.get('scf_energy') is not None:
        energy_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasSCFEnergy, energy_node))
        g.add((energy_node, RDF.type, ONTOCOMPCHEM.SCFEnergy))
        g.add((energy_node, ONTOCOMPCHEM.hasValue, Literal(calc_data['scf_energy'])))
        g.add((energy_node, ONTOCOMPCHEM.hasUnit, Literal("eV")))
    
    # Molecular structure
    if calc_data.get('atoms') and calc_data.get('coordinates'):
        mol_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasMolecularStructure, mol_node))
        g.add((mol_node, RDF.type, CHEMINF.MolecularStructure))
        
        # Add atoms and coordinates
        for i, (atom_num, coords) in enumerate(zip(calc_data['atoms'], calc_data['coordinates'])):
            atom_node = BNode()
            g.add((mol_node, CHEMINF.hasAtom, atom_node))
            g.add((atom_node, RDF.type, CHEMINF.Atom))
            g.add((atom_node, CHEMINF.hasAtomicNumber, Literal(atom_num)))
            g.add((atom_node, EX.hasXCoordinate, Literal(coords[0])))
            g.add((atom_node, EX.hasYCoordinate, Literal(coords[1])))
            g.add((atom_node, EX.hasZCoordinate, Literal(coords[2])))
    
    # Vibrational frequencies
    if calc_data.get('frequencies'):
        freq_collection = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasVibrationalFrequencies, freq_collection))
        g.add((freq_collection, RDF.type, ONTOCOMPCHEM.VibrationalFrequencyCollection))
        
        for i, freq in enumerate(calc_data['frequencies']):
            freq_node = BNode()
            g.add((freq_collection, ONTOCOMPCHEM.hasFrequency, freq_node))
            g.add((freq_node, RDF.type, ONTOCOMPCHEM.VibrationalFrequency))
            g.add((freq_node, ONTOCOMPCHEM.hasValue, Literal(freq)))
            g.add((freq_node, ONTOCOMPCHEM.hasUnit, Literal("cm^-1")))
    
    # Electronic properties
    if calc_data.get('charge') is not None:
        g.add((calc_uri, CHEMINF.hasCharge, Literal(calc_data['charge'])))
    
    if calc_data.get('multiplicity') is not None:
        g.add((calc_uri, CHEMINF.hasMultiplicity, Literal(calc_data['multiplicity'])))
    
    if calc_data.get('homo_lumo_gap') is not None:
        gap_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasHOMOLUMOGap, gap_node))
        g.add((gap_node, RDF.type, ONTOCOMPCHEM.HOMOLUMOGap))
        g.add((gap_node, ONTOCOMPCHEM.hasValue, Literal(calc_data['homo_lumo_gap'])))
        g.add((gap_node, ONTOCOMPCHEM.hasUnit, Literal("eV")))
    
    if calc_data.get('dipole_moment') is not None:
        dipole_node = BNode()
        g.add((calc_uri, ONTOCOMPCHEM.hasDipoleMoment, dipole_node))
        g.add((dipole_node, RDF.type, ONTOCOMPCHEM.DipoleMoment))
        g.add((dipole_node, ONTOCOMPCHEM.hasValue, Literal(calc_data['dipole_moment'])))
        g.add((dipole_node, ONTOCOMPCHEM.hasUnit, Literal("Debye")))
    
    # Convergence status
    g.add((calc_uri, ONTOCOMPCHEM.hasConverged, Literal(calc_data.get('converged', False))))
    
    # Provenance - link to Gaussian software
    gaussian_software = BNode()
    g.add((calc_uri, PROV.wasGeneratedBy, gaussian_software))
    g.add((gaussian_software, RDF.type, PROV.Activity))
    g.add((gaussian_software, RDF.type, EX.GaussianRun))
    g.add((gaussian_software, RDFS.label, Literal("Gaussian 16 Calculation")))
    
    if metadata.software_version:
        g.add((gaussian_software, PROV.used, Literal(f"Gaussian {metadata.software_version}")))
    
    return g


def main():
    """Main entry point for the parser."""
    parser = argparse.ArgumentParser(description="Parse Gaussian logfile to RDF")
    parser.add_argument("file_path", help="Path to Gaussian logfile")
    parser.add_argument("metadata_json", nargs="?", default="{}", 
                       help="JSON metadata string")
    parser.add_argument("--output", "-o", help="Output file for RDF (default: stdout)")
    parser.add_argument("--format", "-f", default="turtle", 
                       choices=["turtle", "xml", "n3", "json-ld"],
                       help="RDF output format")
    
    args = parser.parse_args()
    
    try:
        # Parse metadata
        metadata_dict = json.loads(args.metadata_json)
        metadata = CalculationMetadata(**metadata_dict)
        
        # Generate URI for this calculation
        file_path = Path(args.file_path)
        if metadata.filename:
            file_uri = f"https://example.org/gaussian/{metadata.filename}"
        else:
            file_uri = f"https://example.org/gaussian/{file_path.stem}"
        
        # Parse Gaussian file
        calc_data = gaussian_to_dict(args.file_path)
        
        # Convert to RDF graph
        graph = dict_to_graph(calc_data, file_uri, metadata)
        
        # Output RDF
        rdf_output = graph.serialize(format=args.format)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(rdf_output)
        else:
            print(rdf_output)
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main() 