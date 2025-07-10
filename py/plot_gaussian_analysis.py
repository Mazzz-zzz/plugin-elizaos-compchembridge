#!/usr/bin/env python3
"""
Gaussian Analysis Plotting Module
=========================================

**Purpose**
-----------
Generates matplotlib visualizations for comprehensive reports, with proper 
file-based data separation for practicing chemists. Each source file's data
is kept separate throughout the analysis pipeline.

Key features:
* **File-separated analysis** – each source file analyzed independently
* **SCF energy trends** – per-file convergence analysis
* **HOMO-LUMO gaps** – per-file stability/reactivity screening  
* **Vibrational frequency spectra** – per-file minima / transition state validation
* **Enhanced properties** – per-file cclib-based advanced analysis
* **Aggregate summaries** – optional cross-file comparisons

Supports both base64 output for web embedding and file output for reports.
"""

from __future__ import annotations

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
import re

# ---------------------------------------------------------------------------
#  Styling - lazy load to avoid seaborn dependency issues
# ---------------------------------------------------------------------------

def _ensure_style():
    """Lazy-load matplotlib style to avoid import issues"""
    if 'seaborn-v0_8' in plt.style.available:
        plt.style.use('seaborn-v0_8')
    else:
        plt.style.use('default')

_ensure_style()

# ---------------------------------------------------------------------------
#  Core helper functions
# ---------------------------------------------------------------------------

def figure_to_base64(fig) -> str:
    """Convert matplotlib figure to base64 string"""
    buffer = BytesIO()
    fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
    buffer.seek(0)
    
    # Convert to base64
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close(fig)
    return image_base64

def create_empty_chart(message: str) -> str:
    """Create an empty chart with a message"""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.text(0.5, 0.5, message, ha='center', va='center', 
           fontsize=14, color='gray', transform=ax.transAxes)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    plt.tight_layout()
    return figure_to_base64(fig)

def _save_or_encode(fig, output_path: Optional[str] = None) -> str:
    """Save figure to file or return base64 encoded string"""
    if output_path:
        fig.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)
        return output_path
    else:
        return figure_to_base64(fig)

# ---------------------------------------------------------------------------
#  File-separated plotting functions (main interface)
# ---------------------------------------------------------------------------

def create_file_separated_energy_chart(file_data: Dict[str, List[float]], output_path: Optional[str] = None) -> str:
    """Generate energy trends chart with proper file separation"""
    
    if not file_data:
        return create_empty_chart("No energy data available")
    
    # Filter files with sufficient data
    valid_files = {fname: data for fname, data in file_data.items() 
                   if data and len(data) >= 2}
    
    if not valid_files:
        return create_empty_chart("Insufficient energy data for trends")
    
    # Create subplots - one per file
    n_files = len(valid_files)
    if n_files == 1:
        fig, ax = plt.subplots(figsize=(10, 6))
        axes = [ax]
    else:
        cols = min(2, n_files)
        rows = (n_files + cols - 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(12, 4 * rows))
        if n_files > 1:
            axes = axes.flatten() if isinstance(axes, np.ndarray) else [axes]
    
    fig.suptitle('SCF Energy Trends by File', fontsize=16, fontweight='bold')
    
    for i, (fname, energies) in enumerate(valid_files.items()):
        ax = axes[i]
        stem = Path(fname).stem
        
        x = range(len(energies))
        ax.plot(x, energies, 'o-', color='#4ecdc4', linewidth=1.8, markersize=4)
        
        ax.set_title(f'{stem}', fontsize=12, fontweight='bold')
        ax.set_xlabel('Step')
        ax.set_ylabel('Energy (Ha)')
        ax.grid(True, alpha=0.3)
        
        # Add convergence info
        if len(energies) > 1:
            final_change = abs(energies[-1] - energies[-2])
            ax.text(0.02, 0.98, f'Final Δ: {final_change:.2e}', 
                   transform=ax.transAxes, va='top',
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
    
    # Hide unused subplots
    for i in range(n_files, len(axes)):
        axes[i].set_visible(False)
    
    plt.tight_layout()
    return _save_or_encode(fig, output_path)

def create_file_separated_gap_chart(file_data: Dict[str, List[Dict[str, Any]]], output_path: Optional[str] = None) -> str:
    """Generate HOMO-LUMO gaps chart with proper file separation"""
    
    if not file_data:
        return create_empty_chart("No HOMO-LUMO data available")
    
    # Prepare data per file
    valid_files = {fname: [item['gap'] for item in data] 
                   for fname, data in file_data.items() if data}
    
    if not valid_files:
        return create_empty_chart("No valid HOMO-LUMO data")
    
    fig, ax = plt.subplots(figsize=(max(8, len(valid_files) * 1.5), 6))
    
    # Create grouped bar chart
    file_names = list(valid_files.keys())
    file_stems = [Path(fname).stem for fname in file_names]
    
    x_pos = 0
    bar_width = 0.8
    colors = plt.cm.Set3(np.linspace(0, 1, len(file_names)))
    
    for i, (fname, gaps) in enumerate(valid_files.items()):
        stem = Path(fname).stem
        avg_gap = sum(gaps) / len(gaps) if gaps else 0
        
        bar = ax.bar(x_pos, avg_gap, bar_width, alpha=0.8, 
                    color=colors[i], label=stem, edgecolor='black', linewidth=0.5)
        
        # Add value label
        ax.text(x_pos, avg_gap + 0.1, f'{avg_gap:.2f} eV', 
               ha='center', va='bottom', fontsize=9, fontweight='bold')
        
        # Add range info if multiple values
        if len(gaps) > 1:
            min_gap, max_gap = min(gaps), max(gaps)
            ax.plot([x_pos, x_pos], [min_gap, max_gap], 'k-', alpha=0.6, linewidth=2)
            ax.plot([x_pos-0.1, x_pos+0.1], [min_gap, min_gap], 'k-', alpha=0.6, linewidth=1)
            ax.plot([x_pos-0.1, x_pos+0.1], [max_gap, max_gap], 'k-', alpha=0.6, linewidth=1)
        
        x_pos += 1
    
    ax.set_title('HOMO-LUMO Energy Gaps by File', fontsize=14, fontweight='bold')
    ax.set_xlabel('Files')
    ax.set_ylabel('Energy Gap (eV)')
    ax.set_xticks(range(len(file_stems)))
    ax.set_xticklabels(file_stems, rotation=45, ha='right')
    ax.grid(True, alpha=0.3, axis='y')
    
    # Add reactivity threshold line
    ax.axhline(y=4.0, color='red', linestyle='--', alpha=0.7, 
               label='Reactivity threshold (~4 eV)')
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.tight_layout()
    return _save_or_encode(fig, output_path)

def create_file_separated_frequency_chart(file_data: Dict[str, List[float]], output_path: Optional[str] = None) -> str:
    """Generate frequency analysis chart with proper file separation"""
    
    if not file_data:
        return create_empty_chart("No frequency data available")
    
    valid_files = {fname: data for fname, data in file_data.items() if data}
    
    if not valid_files:
        return create_empty_chart("No valid frequency data")
    
    n_files = len(valid_files)
    if n_files == 1:
        fig, ax = plt.subplots(figsize=(10, 6))
        axes = [ax]
    else:
        cols = min(2, n_files)
        rows = (n_files + cols - 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(12, 4 * rows))
        if n_files > 1:
            axes = axes.flatten() if isinstance(axes, np.ndarray) else [axes]
    
    fig.suptitle('Vibrational Frequency Analysis by File', fontsize=16, fontweight='bold')
    
    for i, (fname, freqs) in enumerate(valid_files.items()):
        ax = axes[i]
        stem = Path(fname).stem
        
        real_freqs = [f for f in freqs if f >= 0]
        imag_freqs = [abs(f) for f in freqs if f < 0]
        
        # Plot histogram
        if real_freqs:
            ax.hist(real_freqs, bins=max(10, len(real_freqs)//3), alpha=0.7, 
                   color='#4ecdc4', label=f'Real ({len(real_freqs)})')
        
        if imag_freqs:
            ax.hist(imag_freqs, bins=max(5, len(imag_freqs)//2), alpha=0.7, 
                   color='#ff6b6b', label=f'Imaginary ({len(imag_freqs)})')
        
        ax.axvline(0, color='red', linestyle='--', alpha=0.6)
        ax.set_xlabel('Frequency (cm⁻¹)')
        ax.set_ylabel('Count')
        ax.set_title(f'{stem}', fontsize=12, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Add interpretation
        interpretation = "Minimum" if not imag_freqs else f"Saddle point ({len(imag_freqs)} imag)"
        ax.text(0.98, 0.98, interpretation, transform=ax.transAxes, 
               ha='right', va='top', fontsize=9,
               bbox=dict(boxstyle='round,pad=0.3', 
                        facecolor='lightgreen' if not imag_freqs else 'orange', alpha=0.7))
    
    # Hide unused subplots
    for i in range(n_files, len(axes)):
        axes[i].set_visible(False)
    
    plt.tight_layout()
    return _save_or_encode(fig, output_path)

def create_overview_chart(stats: Dict[str, Any], output_path: Optional[str] = None) -> str:
    """Generate overview statistics chart (aggregated summary)"""
    
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
    fig.suptitle('Knowledge Graph Data Overview (All Files)', fontsize=16, fontweight='bold')
    
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
        ['Files Processed', stats.get('processedFiles', 0)]
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
    return _save_or_encode(fig, output_path)

def create_enhanced_properties_chart(stats: Dict[str, Any], output_path: Optional[str] = None) -> str:
    """Generate enhanced cclib properties summary chart (aggregated)"""
    
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
    fig.suptitle('Enhanced cclib Properties Summary (All Files)', fontsize=16, fontweight='bold')
    
    axes = [ax1, ax2, ax3, ax4]
    
    for ax, category in zip(axes, categories):
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
    return _save_or_encode(fig, output_path)

# ---------------------------------------------------------------------------
#  Individual file plotting (detailed analysis)
# ---------------------------------------------------------------------------

def plot_single_file(filename: str, data: Dict[str, List], output_dir: Optional[Path] = None) -> Dict[str, Optional[str]]:
    """
    Generate detailed plots for a single file
    
    Args:
        filename: Name of the source file
        data: Dictionary containing energyData, homoLumoData, frequencyData
        output_dir: Optional directory to save plots, otherwise returns base64
        
    Returns:
        Dictionary with plot results for energy, gap, and frequency charts
    """
    stem = Path(filename).stem.replace(" ", "_")
    
    def _save_plot(fig, suffix: str) -> Optional[str]:
        if fig is None:
            return None
        if output_dir:
            output_dir.mkdir(parents=True, exist_ok=True)
            path = output_dir / f"{stem}{suffix}.png"
            fig.savefig(path, dpi=300, bbox_inches='tight')
            plt.close(fig)
            return str(path)
        else:
            return figure_to_base64(fig)

    # Generate individual charts
    energy_fig = None
    if data.get('energyData') and len(data['energyData']) >= 2:
        fig, ax = plt.subplots(figsize=(8, 5))
        energies = data['energyData']
        ax.plot(range(len(energies)), energies, 'o-', linewidth=1.8, markersize=6)
        ax.set_xlabel('Step')
        ax.set_ylabel('Energy (Ha)')
        ax.set_title(f'SCF Energy Trend – {stem}')
        ax.grid(alpha=0.3)
        
        # Add convergence analysis
        if len(energies) > 1:
            changes = [abs(energies[i] - energies[i-1]) for i in range(1, len(energies))]
            final_change = changes[-1] if changes else 0
            avg_change = sum(changes) / len(changes) if changes else 0
            
            ax.text(0.02, 0.98, f'Final Δ: {final_change:.2e}\nAvg Δ: {avg_change:.2e}', 
                   transform=ax.transAxes, va='top',
                   bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        energy_fig = fig
    
    gap_fig = None
    homo_lumo_gaps = [item['gap'] for item in data.get('homoLumoData', [])]
    if homo_lumo_gaps:
        fig, ax = plt.subplots(figsize=(8, 5))
        bars = ax.bar(range(len(homo_lumo_gaps)), homo_lumo_gaps, alpha=0.8)
        ax.set_xticks([])
        ax.set_ylabel('Gap (eV)')
        ax.set_title(f'HOMO–LUMO Gap – {stem}')
        
        for bar, gap in zip(bars, homo_lumo_gaps):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                    f'{gap:.2f}', ha='center', va='bottom', fontsize=10)
        
        # Add interpretation
        avg_gap = sum(homo_lumo_gaps) / len(homo_lumo_gaps)
        interpretation = "Stable" if avg_gap > 4 else "Reactive"
        ax.text(0.98, 0.98, f'{interpretation}\n(avg: {avg_gap:.2f} eV)', 
               transform=ax.transAxes, ha='right', va='top',
               bbox=dict(boxstyle='round', 
                        facecolor='lightgreen' if avg_gap > 4 else 'orange', alpha=0.7))
        
        gap_fig = fig
    
    freq_fig = None
    if data.get('frequencyData'):
        freqs = data['frequencyData']
        real = [f for f in freqs if f >= 0]
        imag = [abs(f) for f in freqs if f < 0]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Histogram
        if real:
            ax1.hist(real, bins=max(10, len(real)//3), alpha=0.7, label=f'Real ({len(real)})')
        if imag:
            ax1.hist(imag, bins=max(5, len(imag)//2), alpha=0.7, label=f'Imaginary ({len(imag)})')
        
        ax1.axvline(0, ls='--', color='red', alpha=0.6)
        ax1.set_xlabel('Frequency (cm⁻¹)')
        ax1.set_ylabel('Count')
        ax1.set_title('Frequency Distribution')
        ax1.legend()
        ax1.grid(alpha=0.3)
        
        # Spectrum plot
        sorted_freqs = sorted(freqs)
        ax2.plot(range(len(sorted_freqs)), sorted_freqs, 'o-', markersize=3)
        ax2.axhline(0, ls='--', color='red', alpha=0.6)
        ax2.set_xlabel('Mode Index')
        ax2.set_ylabel('Frequency (cm⁻¹)')
        ax2.set_title('Full Spectrum')
        ax2.grid(alpha=0.3)
        
        # Highlight imaginary frequencies
        if imag:
            imag_indices = [i for i, f in enumerate(sorted_freqs) if f < 0]
            imag_values = [sorted_freqs[i] for i in imag_indices]
            ax2.scatter(imag_indices, imag_values, color='red', s=30, zorder=5)
        
        fig.suptitle(f'Vibrational Analysis – {stem}')
        freq_fig = fig
    
    return {
        'energy': _save_plot(energy_fig, '_energy'),
        'gap': _save_plot(gap_fig, '_gap'),
        'frequency': _save_plot(freq_fig, '_freq'),
    }

def plot_all_files(dataset: Dict[str, Dict[str, List]], output_dir: Optional[Path] = None) -> Dict[str, Dict[str, Optional[str]]]:
    """
    Generate detailed plots for all files in dataset
    
    Args:
        dataset: Dictionary mapping filenames to their data
        output_dir: Optional directory to save plots
        
    Returns:
        Dictionary mapping filenames to their plot results
    """
    results = {}
    for filename, file_data in dataset.items():
        results[filename] = plot_single_file(filename, file_data, output_dir)
    return results

# ---------------------------------------------------------------------------
#  Data processing helpers
# ---------------------------------------------------------------------------

def separate_data_by_file(dataset: Dict[str, Dict[str, List]]) -> Tuple[Dict[str, List[float]], Dict[str, List[Dict[str, Any]]], Dict[str, List[float]]]:
    """
    Separate combined dataset into file-organized data structures
    
    Returns:
        Tuple of (energy_by_file, homo_lumo_by_file, frequency_by_file)
    """
    energy_by_file = {}
    homo_lumo_by_file = {}
    frequency_by_file = {}
    
    for filename, data in dataset.items():
        if 'energyData' in data:
            energy_by_file[filename] = data['energyData']
        if 'homoLumoData' in data:
            homo_lumo_by_file[filename] = data['homoLumoData']
        if 'frequencyData' in data:
            frequency_by_file[filename] = data['frequencyData']
    
    return energy_by_file, homo_lumo_by_file, frequency_by_file

# ---------------------------------------------------------------------------
#  Legacy parsing and main function
# ---------------------------------------------------------------------------

def parse_rdf_for_plotting(rdf_content: str) -> Dict[str, List]:
    """Parse RDF content to extract data for plotting (legacy function)"""
    
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
        print("Chart types:")
        print("  - overview: aggregated statistics overview")
        print("  - enhanced_properties: aggregated cclib properties") 
        print("  - file_separated_energy: energy trends by file")
        print("  - file_separated_gaps: HOMO-LUMO gaps by file")
        print("  - file_separated_frequency: frequency analysis by file")
        print("  - single_file: detailed analysis for individual files")
        print("  - all_files: batch processing for all files")
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
    
    try:
        if chart_type == "overview":
            result = create_overview_chart(data.get('stats', {}), output_path)
        elif chart_type == "enhanced_properties":
            result = create_enhanced_properties_chart(data.get('stats', {}), output_path)
        elif chart_type == "file_separated_energy":
            # Expect data to be organized by file
            energy_by_file, _, _ = separate_data_by_file(data)
            result = create_file_separated_energy_chart(energy_by_file, output_path)
        elif chart_type == "file_separated_gaps":
            _, homo_lumo_by_file, _ = separate_data_by_file(data)
            result = create_file_separated_gap_chart(homo_lumo_by_file, output_path)
        elif chart_type == "file_separated_frequency":
            _, _, frequency_by_file = separate_data_by_file(data)
            result = create_file_separated_frequency_chart(frequency_by_file, output_path)
        elif chart_type == "single_file":
            # Handle single file detailed analysis
            if len(data) != 1:
                print("Error: single_file mode requires exactly one file in the dataset", file=sys.stderr)
                sys.exit(1)
            filename, file_data = next(iter(data.items()))
            output_dir = Path(output_path) if output_path else None
            result = plot_single_file(filename, file_data, output_dir)
            result = json.dumps(result)
        elif chart_type == "all_files":
            # Handle batch processing
            output_dir = Path(output_path) if output_path else None
            result = plot_all_files(data, output_dir)
            result = json.dumps(result)
        else:
            print(f"Unknown chart type: {chart_type}", file=sys.stderr)
            print("Run with no arguments to see available chart types.", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error generating chart: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    if output_path and chart_type not in ["single_file", "all_files"]:
        print(f"Chart saved to: {result}")
    else:
        # Output base64 for direct embedding or JSON for file-based results
        print(result)

if __name__ == "__main__":
    main() 