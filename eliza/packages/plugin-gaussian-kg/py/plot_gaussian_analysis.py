#!/usr/bin/env python3
"""
Gaussian Analysis Plotting Module
Generates matplotlib visualizations for comprehensive reports
"""

import sys
import json
import os
import base64
from pathlib import Path
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import re

# Set matplotlib style
plt.style.use('seaborn-v0_8' if 'seaborn-v0_8' in plt.style.available else 'default')

def create_overview_chart(stats, output_path=None):
    """Generate overview statistics pie chart"""
    
    # Prepare data
    data = [
        {'label': 'Molecules', 'value': stats.get('molecules', 0), 'color': '#ff6b6b'},
        {'label': 'SCF Energies', 'value': stats.get('scfEnergies', 0), 'color': '#4ecdc4'},
        {'label': 'Frequencies', 'value': stats.get('frequencies', 0), 'color': '#ffe66d'},
        {'label': 'Atoms', 'value': stats.get('atoms', 0), 'color': '#95e1d3'},
        {'label': 'HOMO-LUMO', 'value': stats.get('homoLumoGaps', 0), 'color': '#a8e6cf'}
    ]
    
    # Filter out zero values
    data = [item for item in data if item['value'] > 0]
    
    if not data:
        return create_empty_chart("No data available")
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
    fig.suptitle('Knowledge Graph Data Overview', fontsize=16, fontweight='bold')
    
    # Pie chart
    labels = [item['label'] for item in data]
    values = [item['value'] for item in data]
    colors = [item['color'] for item in data]
    
    wedges, texts, autotexts = ax1.pie(values, labels=labels, colors=colors, 
                                       autopct='%1.1f%%', startangle=90)
    ax1.set_title('Data Distribution')
    
    # Statistics table
    ax2.axis('off')
    stats_data = [
        ['Property', 'Count'],
        ['Total Items', sum(values)],
        ['Parser', stats.get('parser', 'basic')],
        ['Enhanced', 'Yes' if stats.get('enhanced', False) else 'No'],
        ['Files', stats.get('processedFiles', 0)]
    ]
    
    table = ax2.table(cellText=stats_data[1:], colLabels=stats_data[0],
                     cellLoc='center', loc='center', bbox=[0.1, 0.3, 0.8, 0.4])
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 2)
    
    # Style the table
    for i in range(len(stats_data)):
        for j in range(len(stats_data[0])):
            cell = table[(i, j)]
            if i == 0:  # Header
                cell.set_facecolor('#3498db')
                cell.set_text_props(weight='bold', color='white')
            else:
                cell.set_facecolor('#f8f9fa')
    
    plt.tight_layout()
    
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        return output_path
    else:
        return figure_to_base64(fig)

def create_energy_trend_chart(energy_data, output_path=None):
    """Generate energy trends line chart"""
    
    if not energy_data or len(energy_data) < 2:
        return create_empty_chart("Insufficient energy data for trends")
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    x = range(len(energy_data))
    ax.plot(x, energy_data, 'o-', color='#4ecdc4', linewidth=2, markersize=6, 
            markerfacecolor='#ff6b6b', markeredgecolor='white', markeredgewidth=1)
    
    ax.set_title('SCF Energy Trends', fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel('Calculation Index')
    ax.set_ylabel('Energy (Hartree)')
    ax.grid(True, alpha=0.3)
    
    # Add statistics text box
    min_energy = min(energy_data)
    max_energy = max(energy_data)
    avg_energy = sum(energy_data) / len(energy_data)
    
    stats_text = f'Min: {min_energy:.6f}\nMax: {max_energy:.6f}\nAvg: {avg_energy:.6f}\nRange: {max_energy - min_energy:.6f}'
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        return output_path
    else:
        return figure_to_base64(fig)

def create_molecular_comparison_chart(homo_lumo_data, output_path=None):
    """Generate HOMO-LUMO comparison chart"""
    
    if not homo_lumo_data or len(homo_lumo_data) < 1:
        return create_empty_chart("No HOMO-LUMO data available")
    
    # Limit to first 10 molecules for readability
    display_data = homo_lumo_data[:10]
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    x = range(len(display_data))
    gaps = [item['gap'] for item in display_data]
    molecules = [item.get('molecule', f'Mol {i+1}') for i, item in enumerate(display_data)]
    
    # Create bars
    bars = ax.bar(x, gaps, color='#4ecdc4', alpha=0.7, edgecolor='#2c3e50', linewidth=1)
    
    # Add value labels on bars
    for i, (bar, gap) in enumerate(zip(bars, gaps)):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{gap:.2f} eV', ha='center', va='bottom', fontsize=9)
    
    ax.set_title('HOMO-LUMO Energy Gaps', fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel('Molecular Systems')
    ax.set_ylabel('Energy Gap (eV)')
    ax.set_xticks(x)
    ax.set_xticklabels(molecules, rotation=45, ha='right')
    ax.grid(True, alpha=0.3, axis='y')
    
    # Add average line
    avg_gap = sum(gaps) / len(gaps)
    ax.axhline(y=avg_gap, color='#ff6b6b', linestyle='--', alpha=0.8, 
               label=f'Average: {avg_gap:.2f} eV')
    ax.legend()
    
    # Add reactivity interpretation
    reactivity = "Stable (large gaps)" if avg_gap > 4 else "Potentially reactive (small gaps)"
    ax.text(0.98, 0.98, f'Electronic character: {reactivity}', 
            transform=ax.transAxes, ha='right', va='top',
            bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7))
    
    plt.tight_layout()
    
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        return output_path
    else:
        return figure_to_base64(fig)

def create_enhanced_properties_chart(stats, output_path=None):
    """Generate enhanced cclib properties summary chart"""
    
    categories = [
        {
            'name': 'Thermochemistry',
            'count': (stats.get('thermochemistry', {}).get('enthalpy', 0) + 
                     stats.get('thermochemistry', {}).get('entropy', 0) +
                     stats.get('thermochemistry', {}).get('freeEnergy', 0)),
            'color': '#ff6b6b'
        },
        {
            'name': 'Spectroscopy',
            'count': (stats.get('spectroscopy', {}).get('electronicTransitions', 0) + 
                     stats.get('spectroscopy', {}).get('irIntensities', 0) +
                     stats.get('spectroscopy', {}).get('ramanActivities', 0)),
            'color': '#4ecdc4'
        },
        {
            'name': 'Basis Sets',
            'count': (stats.get('basisSet', {}).get('molecularOrbitals', 0) + 
                     stats.get('basisSet', {}).get('basisFunctions', 0)),
            'color': '#ffe66d'
        },
        {
            'name': 'Optimization',
            'count': (stats.get('optimization', {}).get('convergedCalculations', 0) + 
                     stats.get('optimization', {}).get('failedOptimizations', 0)),
            'color': '#95e1d3'
        }
    ]
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))
    fig.suptitle('Enhanced cclib Properties Summary', fontsize=16, fontweight='bold')
    
    axes = [ax1, ax2, ax3, ax4]
    
    for i, (ax, category) in enumerate(zip(axes, categories)):
        # Create circular progress-like visualization
        count = category['count']
        max_possible = 50  # Approximate max for scaling
        
        # Create a pie chart with progress
        if count > 0:
            remainder = max(0, max_possible - count)
            sizes = [count, remainder] if remainder > 0 else [count]
            colors = [category['color'], '#e0e0e0'] if remainder > 0 else [category['color']]
            
            wedges, texts = ax.pie(sizes, colors=colors, startangle=90,
                                  counterclock=False)
            
            # Add center text
            ax.text(0, 0, f"{count}\nproperties", ha='center', va='center',
                   fontsize=12, fontweight='bold')
        else:
            # Empty circle for no data
            ax.pie([1], colors=['#e0e0e0'], startangle=90)
            ax.text(0, 0, "No data", ha='center', va='center',
                   fontsize=10, color='gray')
        
        ax.set_title(category['name'], fontsize=12, fontweight='bold', pad=10)
    
    plt.tight_layout()
    
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        return output_path
    else:
        return figure_to_base64(fig)

def create_frequency_analysis_chart(frequency_data, output_path=None):
    """Generate vibrational frequency analysis chart"""
    
    if not frequency_data:
        return create_empty_chart("No frequency data available")
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle('Vibrational Frequency Analysis', fontsize=16, fontweight='bold')
    
    # Histogram of frequencies
    real_freqs = [f for f in frequency_data if f >= 0]
    imaginary_freqs = [abs(f) for f in frequency_data if f < 0]
    
    # Plot real frequencies
    if real_freqs:
        ax1.hist(real_freqs, bins=20, alpha=0.7, color='#4ecdc4', 
                label=f'Real frequencies ({len(real_freqs)})')
    
    # Plot imaginary frequencies
    if imaginary_freqs:
        ax1.hist(imaginary_freqs, bins=10, alpha=0.7, color='#ff6b6b',
                label=f'Imaginary frequencies ({len(imaginary_freqs)})')
    
    ax1.set_xlabel('Frequency (cm⁻¹)')
    ax1.set_ylabel('Count')
    ax1.set_title('Frequency Distribution')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Frequency range plot
    sorted_freqs = sorted(frequency_data)
    ax2.plot(range(len(sorted_freqs)), sorted_freqs, 'o-', 
            color='#4ecdc4', markersize=4, linewidth=1)
    
    # Highlight imaginary frequencies
    if imaginary_freqs:
        imag_indices = [i for i, f in enumerate(sorted_freqs) if f < 0]
        imag_values = [sorted_freqs[i] for i in imag_indices]
        ax2.scatter(imag_indices, imag_values, color='#ff6b6b', s=50, 
                   label='Imaginary', zorder=5)
    
    ax2.axhline(y=0, color='red', linestyle='--', alpha=0.5)
    ax2.set_xlabel('Mode Index')
    ax2.set_ylabel('Frequency (cm⁻¹)')
    ax2.set_title('Frequency Spectrum')
    ax2.grid(True, alpha=0.3)
    
    if imaginary_freqs:
        ax2.legend()
    
    plt.tight_layout()
    
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        return output_path
    else:
        return figure_to_base64(fig)

def create_empty_chart(message):
    """Create an empty chart with a message"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.text(0.5, 0.5, message, ha='center', va='center', 
           fontsize=14, color='gray', transform=ax.transAxes)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    plt.tight_layout()
    return figure_to_base64(fig)

def figure_to_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buffer = BytesIO()
    fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
    buffer.seek(0)
    
    # Convert to base64
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close(fig)
    return image_base64

def parse_rdf_for_plotting(rdf_content):
    """Parse RDF content to extract data for plotting"""
    
    energy_data = []
    homo_lumo_data = []
    frequency_data = []
    
    lines = rdf_content.split('\n')
    current_molecule = ''
    
    for line in lines:
        # Extract molecule name
        molecule_match = re.search(r'ex:(\w+)\s+a\s+ontocompchem:QuantumCalculation', line)
        if molecule_match:
            current_molecule = molecule_match.group(1)
        
        # Extract SCF energies
        energy_match = re.search(r'ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)', line)
        if energy_match:
            energy_data.append(float(energy_match.group(1)))
        
        # Extract HOMO-LUMO gaps
        gap_match = re.search(r'ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)', line)
        if gap_match:
            homo_lumo_data.append({
                'gap': float(gap_match.group(1)),
                'molecule': current_molecule
            })
        
        # Extract frequencies
        freq_match = re.search(r'ontocompchem:hasFrequency\s+(-?\d+\.?\d*)', line)
        if freq_match:
            frequency_data.append(float(freq_match.group(1)))
    
    return {
        'energyData': energy_data,
        'homoLumoData': homo_lumo_data,
        'frequencyData': frequency_data
    }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python plot_gaussian_analysis.py <chart_type> <data_json> [output_path]")
        print("Chart types: overview, energy_trend, molecular_comparison, enhanced_properties, frequency_analysis")
        sys.exit(1)
    
    chart_type = sys.argv[1]
    data_json = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        data = json.loads(data_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}", file=sys.stderr)
        sys.exit(1)
    
    result = None
    
    if chart_type == "overview":
        result = create_overview_chart(data.get('stats', {}), output_path)
    elif chart_type == "energy_trend":
        result = create_energy_trend_chart(data.get('energyData', []), output_path)
    elif chart_type == "molecular_comparison":
        result = create_molecular_comparison_chart(data.get('homoLumoData', []), output_path)
    elif chart_type == "enhanced_properties":
        result = create_enhanced_properties_chart(data.get('stats', {}), output_path)
    elif chart_type == "frequency_analysis":
        result = create_frequency_analysis_chart(data.get('frequencyData', []), output_path)
    else:
        print(f"Unknown chart type: {chart_type}", file=sys.stderr)
        sys.exit(1)
    
    if output_path:
        print(f"Chart saved to: {result}")
    else:
        # Output base64 for direct embedding
        print(result)

if __name__ == "__main__":
    main() 