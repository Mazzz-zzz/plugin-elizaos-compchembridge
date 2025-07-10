#!/usr/bin/env python3
"""
Molecular analysis script for computational chemistry plugin.
Migrated from v1 plugin with enhanced Python integration.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
import numpy as np

def analyze_molecule(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze molecular data and return computed properties.
    
    Args:
        data: Dictionary containing molecular information
        
    Returns:
        Dictionary with analysis results
    """
    
    # Extract molecular properties
    formula = data.get('formula', 'Unknown')
    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    
    # Perform basic calculations
    atom_count = len(atoms) if atoms else 0
    bond_count = len(bonds) if bonds else 0
    
    # Calculate molecular weight (simplified - assumes basic elements)
    atomic_weights = {
        'H': 1.008, 'C': 12.011, 'N': 14.007, 'O': 15.999,
        'F': 18.998, 'P': 30.974, 'S': 32.065, 'Cl': 35.453
    }
    
    molecular_weight = 0.0
    if atoms:
        for atom in atoms:
            element = atom.get('element', 'H')
            molecular_weight += atomic_weights.get(element, 12.011)
    
    # Generate analysis results
    results = {
        'formula': formula,
        'atom_count': atom_count,
        'bond_count': bond_count,
        'molecular_weight': round(molecular_weight, 3),
        'analysis_type': 'basic_molecular_analysis',
        'timestamp': data.get('timestamp', 'unknown'),
        'success': True,
        'properties': {
            'density_estimate': round(molecular_weight / max(atom_count, 1) * 1.2, 2),
            'complexity_score': min(atom_count + bond_count, 100),
            'stability_estimate': 'stable' if bond_count >= atom_count * 0.8 else 'potentially_unstable'
        }
    }
    
    return results

def calculate_energy_properties(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate energy-related properties from computational data.
    """
    
    scf_energy = data.get('scf_energy', None)
    homo_lumo_gap = data.get('homo_lumo_gap', None)
    
    results = {
        'analysis_type': 'energy_analysis',
        'scf_energy': scf_energy,
        'homo_lumo_gap': homo_lumo_gap,
        'success': True
    }
    
    if scf_energy is not None:
        results['energy_classification'] = (
            'very_stable' if scf_energy < -100 else
            'stable' if scf_energy < -50 else
            'moderate' if scf_energy < 0 else
            'unstable'
        )
    
    if homo_lumo_gap is not None:
        results['conductivity_prediction'] = (
            'conductor' if homo_lumo_gap < 1.0 else
            'semiconductor' if homo_lumo_gap < 4.0 else
            'insulator'
        )
    
    return results

def generate_visualization_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate data for molecular visualization.
    """
    
    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    
    # Generate simple 2D coordinates if not provided
    viz_data = {
        'atoms': [],
        'bonds': [],
        'center': [0, 0],
        'bounds': {'min_x': 0, 'max_x': 0, 'min_y': 0, 'max_y': 0}
    }
    
    if atoms:
        for i, atom in enumerate(atoms):
            # Simple circular layout for demonstration
            angle = 2 * np.pi * i / len(atoms)
            radius = max(2, len(atoms) * 0.5)
            
            x = radius * np.cos(angle)
            y = radius * np.sin(angle)
            
            viz_data['atoms'].append({
                'id': atom.get('id', i),
                'element': atom.get('element', 'C'),
                'x': round(x, 2),
                'y': round(y, 2),
                'color': get_element_color(atom.get('element', 'C'))
            })
    
    viz_data['bonds'] = bonds
    return viz_data

def get_element_color(element: str) -> str:
    """Get standard CPK color for element."""
    colors = {
        'H': '#FFFFFF', 'C': '#909090', 'N': '#3050F8', 'O': '#FF0D0D',
        'F': '#90E050', 'P': '#FF8000', 'S': '#FFFF30', 'Cl': '#1FF01F'
    }
    return colors.get(element, '#FF1493')

def main():
    """Main function to handle command line execution."""
    parser = argparse.ArgumentParser(description='Molecular Analysis Tool')
    parser.add_argument('input_data', help='JSON string with molecular data')
    parser.add_argument('--analysis_type', default='molecular', 
                       choices=['molecular', 'energy', 'visualization'],
                       help='Type of analysis to perform')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    try:
        # Parse input data
        input_data = json.loads(args.input_data)
        
        # Perform requested analysis
        if args.analysis_type == 'molecular':
            results = analyze_molecule(input_data)
        elif args.analysis_type == 'energy':
            results = calculate_energy_properties(input_data)
        elif args.analysis_type == 'visualization':
            results = generate_visualization_data(input_data)
        else:
            results = {'error': 'Unknown analysis type', 'success': False}
        
        # Output results
        output_json = json.dumps(results, indent=2)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output_json)
        else:
            print(output_json)
            
    except json.JSONDecodeError as e:
        error_result = {'error': f'Invalid JSON input: {str(e)}', 'success': False}
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        error_result = {'error': f'Analysis failed: {str(e)}', 'success': False}
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main() 