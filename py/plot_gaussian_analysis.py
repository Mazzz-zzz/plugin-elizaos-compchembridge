#!/usr/bin/env python3
"""
Gaussian Analysis Plotting for V2 Plugin
========================================

Simplified matplotlib visualization for V2 plugin knowledge graph data.
Adapted from V1 plugin to work with V2's RDF knowledge graph format.
"""

import sys
import json
import os
import base64
from pathlib import Path
from typing import Dict, List, Optional, Union, Any, Tuple
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO

# Set up matplotlib style
plt.style.use('default')
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'
plt.rcParams['font.size'] = 10

def create_empty_chart(message: str, output_path: str = None) -> str:
    """Create an empty chart with a message"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.text(0.5, 0.5, message, ha='center', va='center', 
           fontsize=14, color='gray', transform=ax.transAxes)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    plt.tight_layout()
    
    if output_path:
        fig.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return output_path
    else:
        buffer = BytesIO()
        fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        return image_base64

def create_overview_chart(stats: Dict[str, Any], output_path: str = None) -> str:
    """Generate overview statistics chart"""
    
    # Prepare data
    data_items = [
        {'label': 'Molecules', 'value': stats.get('molecules', 0), 'color': '#ff6b6b'},
        {'label': 'SCF Energies', 'value': stats.get('scfEnergies', 0), 'color': '#4ecdc4'},
        {'label': 'Frequencies', 'value': stats.get('frequencies', 0), 'color': '#ffe66d'},
        {'label': 'Atoms', 'value': stats.get('atoms', 0), 'color': '#95e1d3'}
    ]
    
    # Filter out zero values
    data_items = [item for item in data_items if item['value'] > 0]
    
    if not data_items:
        return create_empty_chart("No data available for overview", output_path)
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    fig.suptitle('Knowledge Graph Data Overview (All Files)', fontsize=16, fontweight='bold')
    
    # Pie chart
    labels = [item['label'] for item in data_items]
    values = [item['value'] for item in data_items]
    colors = [item['color'] for item in data_items]
    
    wedges, texts, autotexts = ax1.pie(values, labels=labels, colors=colors, 
                                       autopct='%1.1f%%', startangle=90)
    ax1.set_title('Data Distribution')
    
    # Bar chart
    bars = ax2.bar(labels, values, color=colors, alpha=0.8)
    ax2.set_title('Count by Type')
    ax2.set_ylabel('Count')
    ax2.tick_params(axis='x', rotation=45)
    
    # Add value labels on bars
    for bar, value in zip(bars, values):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                f'{value}', ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    
    if output_path:
        fig.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return output_path
    else:
        buffer = BytesIO()
        fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        return image_base64

def create_energy_chart(energy_data: Dict[str, List], output_path: str = None) -> str:
    """Generate energy trends chart by file"""
    
    if not energy_data:
        return create_empty_chart("No energy data available", output_path)
    
    # Filter files with energy data
    valid_files = {fname: energies for fname, energies in energy_data.items() 
                   if energies and len(energies) > 0}
    
    if not valid_files:
        return create_empty_chart("No valid energy data found", output_path)
    
    # Create chart
    n_files = len(valid_files)
    fig_width = max(10, n_files * 3)
    fig, ax = plt.subplots(figsize=(fig_width, 6))
    
    # Colors for different files
    colors = plt.cm.Set3(np.linspace(0, 1, n_files))
    
    bar_width = 0.8 / n_files
    file_names = list(valid_files.keys())
    
    for i, (filename, energies) in enumerate(valid_files.items()):
        if isinstance(energies, list) and len(energies) > 0:
            # Convert energy objects to values if needed
            energy_values = []
            for energy in energies:
                if isinstance(energy, dict) and 'hartree' in energy:
                    energy_values.append(energy['hartree'])
                elif isinstance(energy, (int, float)):
                    energy_values.append(energy)
            
            if energy_values:
                avg_energy = sum(energy_values) / len(energy_values)
                x_pos = i
                
                # Create bar
                bar = ax.bar(x_pos, avg_energy, bar_width, 
                           color=colors[i], alpha=0.8, 
                           label=Path(filename).stem)
                
                # Add value label
                ax.text(x_pos, avg_energy + abs(avg_energy) * 0.01, 
                       f'{avg_energy:.4f}', ha='center', va='bottom',
                       fontsize=9, fontweight='bold')
                
                # Add range if multiple values
                if len(energy_values) > 1:
                    min_e, max_e = min(energy_values), max(energy_values)
                    ax.plot([x_pos, x_pos], [min_e, max_e], 'k-', alpha=0.6, linewidth=2)
    
    ax.set_title('SCF Energies by File', fontsize=14, fontweight='bold')
    ax.set_xlabel('Files')
    ax.set_ylabel('Energy (Hartree)')
    ax.set_xticks(range(n_files))
    ax.set_xticklabels([Path(fname).stem for fname in file_names], rotation=45, ha='right')
    ax.grid(True, alpha=0.3, axis='y')
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.tight_layout()
    
    if output_path:
        fig.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return output_path
    else:
        buffer = BytesIO()
        fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        return image_base64

def create_molecular_chart(molecular_data: Dict[str, Dict], output_path: str = None) -> str:
    """Generate molecular properties chart"""
    
    if not molecular_data:
        return create_empty_chart("No molecular data available", output_path)
    
    # Extract properties
    file_names = []
    atom_counts = []
    formulas = []
    
    for filename, props in molecular_data.items():
        if props and isinstance(props, dict):
            file_names.append(Path(filename).stem)
            atom_counts.append(props.get('nAtoms', 0))
            formulas.append(props.get('formula', 'Unknown'))
    
    if not file_names:
        return create_empty_chart("No valid molecular properties found", output_path)
    
    # Create chart
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(max(8, len(file_names) * 1.5), 8))
    fig.suptitle('Molecular Properties by File', fontsize=16, fontweight='bold')
    
    # Atom count chart
    colors = plt.cm.Set2(np.linspace(0, 1, len(file_names)))
    bars = ax1.bar(file_names, atom_counts, color=colors, alpha=0.8)
    ax1.set_title('Number of Atoms')
    ax1.set_ylabel('Atom Count')
    ax1.tick_params(axis='x', rotation=45)
    
    # Add value labels
    for bar, count in zip(bars, atom_counts):
        if count > 0:
            ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                    f'{count}', ha='center', va='bottom', fontweight='bold')
    
    # Molecular formulas table
    ax2.axis('off')
    table_data = []
    for i, (name, formula) in enumerate(zip(file_names, formulas)):
        table_data.append([name, formula, f'{atom_counts[i]} atoms'])
    
    if table_data:
        table = ax2.table(cellText=table_data,
                         colLabels=['File', 'Formula', 'Size'],
                         cellLoc='center',
                         loc='center',
                         bbox=[0.1, 0.2, 0.8, 0.6])
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
        # Style the table
        for i in range(len(table_data) + 1):
            for j in range(3):
                cell = table[(i, j)]
                if i == 0:  # Header
                    cell.set_facecolor('#4ecdc4')
                    cell.set_text_props(weight='bold', color='white')
                else:
                    cell.set_facecolor('#f8f9fa')
    
    ax2.set_title('Molecular Formulas', fontsize=12, pad=20)
    
    plt.tight_layout()
    
    if output_path:
        fig.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return output_path
    else:
        buffer = BytesIO()
        fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        return image_base64

def create_frequency_chart(frequency_data: Dict[str, List], output_path: str = None) -> str:
    """Generate frequency analysis chart (placeholder - V2 doesn't have frequency data yet)"""
    return create_empty_chart("Frequency analysis not available in V2 basic parsing", output_path)

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python plot_gaussian_analysis.py <chart_type> <data_json> [output_path]")
        print("Chart types: overview, energy, molecular, frequency")
        sys.exit(1)
    
    chart_type = sys.argv[1]
    data_json = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        data = json.loads(data_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}", file=sys.stderr)
        sys.exit(1)
    
    try:
        if chart_type == "overview":
            result = create_overview_chart(data.get('stats', {}), output_path)
        elif chart_type == "energy":
            result = create_energy_chart(data.get('energyData', {}), output_path)
        elif chart_type == "molecular":
            result = create_molecular_chart(data.get('molecularData', {}), output_path)
        elif chart_type == "frequency":
            result = create_frequency_chart(data.get('frequencyData', {}), output_path)
        else:
            print(f"Unknown chart type: {chart_type}", file=sys.stderr)
            print("Available types: overview, energy, molecular, frequency", file=sys.stderr)
            sys.exit(1)
            
        if output_path:
            print(f"Chart saved to: {result}")
        else:
            print(result)  # Base64 output
            
    except Exception as e:
        print(f"Error generating chart: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 