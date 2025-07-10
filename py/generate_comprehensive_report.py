#!/usr/bin/env python3
"""
Comprehensive Report Generator for V2 Plugin
===========================================

Generate comprehensive analysis reports combining multiple visualizations,
statistics, and formatted output from knowledge graph data.
"""

import sys
import json
import os
import base64
from pathlib import Path
from typing import Dict, List, Optional, Union, Any, Tuple
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
from matplotlib.patches import Rectangle
import matplotlib.patches as mpatches

# Set up matplotlib style
plt.style.use('default')
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.grid'] = True
plt.rcParams['grid.alpha'] = 0.3

def create_comprehensive_report(data: Dict[str, Any], output_dir: str) -> Dict[str, Any]:
    """Generate a comprehensive report with multiple visualizations and analysis"""
    
    # Extract data components
    stats = data.get('stats', {})
    energy_data = data.get('energyData', {})
    molecular_data = data.get('molecularData', {})
    file_data = data.get('fileData', {})
    
    # Create timestamp for report
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Generate main dashboard figure
    dashboard_path = create_dashboard_report(stats, energy_data, molecular_data, output_dir, timestamp)
    
    # Generate detailed analysis figures
    analysis_paths = []
    
    # Energy analysis if available
    if energy_data:
        energy_path = create_detailed_energy_analysis(energy_data, output_dir)
        if energy_path:
            analysis_paths.append(energy_path)
    
    # Molecular analysis if available
    if molecular_data:
        molecular_path = create_detailed_molecular_analysis(molecular_data, output_dir)
        if molecular_path:
            analysis_paths.append(molecular_path)
    
    # File comparison analysis if multiple files
    if len(file_data) > 1:
        comparison_path = create_file_comparison_analysis(file_data, output_dir)
        if comparison_path:
            analysis_paths.append(comparison_path)
    
    # Generate summary report
    summary = generate_text_summary(stats, energy_data, molecular_data, file_data, timestamp)
    
    return {
        'success': True,
        'dashboard_path': dashboard_path,
        'analysis_paths': analysis_paths,
        'summary': summary,
        'total_files': len(analysis_paths) + 1,
        'timestamp': timestamp
    }

def create_dashboard_report(stats: Dict, energy_data: Dict, molecular_data: Dict, 
                          output_dir: str, timestamp: str) -> str:
    """Create main dashboard with overview of all data"""
    
    # Create figure with subplots
    fig = plt.figure(figsize=(16, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # Title
    fig.suptitle(f'Computational Chemistry Analysis Dashboard\nGenerated: {timestamp}', 
                fontsize=16, fontweight='bold', y=0.95)
    
    # 1. Overview Statistics (top-left)
    ax1 = fig.add_subplot(gs[0, 0])
    create_stats_overview(ax1, stats)
    
    # 2. Energy Summary (top-center)
    ax2 = fig.add_subplot(gs[0, 1])
    create_energy_summary(ax2, energy_data)
    
    # 3. Molecular Summary (top-right)
    ax3 = fig.add_subplot(gs[0, 2])
    create_molecular_summary(ax3, molecular_data)
    
    # 4. Energy Trends (middle, spanning 2 columns)
    ax4 = fig.add_subplot(gs[1, :2])
    create_energy_trends(ax4, energy_data)
    
    # 5. Atom Distribution (middle-right)
    ax5 = fig.add_subplot(gs[1, 2])
    create_atom_distribution(ax5, molecular_data)
    
    # 6. File Overview Table (bottom, spanning all columns)
    ax6 = fig.add_subplot(gs[2, :])
    create_file_overview_table(ax6, energy_data, molecular_data)
    
    # Save dashboard
    dashboard_path = os.path.join(output_dir, 'comprehensive_dashboard.png')
    fig.savefig(dashboard_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    
    return dashboard_path

def create_stats_overview(ax, stats: Dict):
    """Create overview statistics pie chart"""
    ax.set_title('Data Overview', fontweight='bold', fontsize=12)
    
    # Prepare data
    data_items = [
        ('Molecules', stats.get('molecules', 0), '#ff6b6b'),
        ('SCF Energies', stats.get('scfEnergies', 0), '#4ecdc4'),
        ('Frequencies', stats.get('frequencies', 0), '#ffe66d'),
        ('Atoms', stats.get('atoms', 0), '#95e1d3')
    ]
    
    # Filter out zero values
    data_items = [(label, value, color) for label, value, color in data_items if value > 0]
    
    if data_items:
        labels, values, colors = zip(*data_items)
        wedges, texts, autotexts = ax.pie(values, labels=labels, colors=colors, 
                                         autopct='%1.1f%%', startangle=90)
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')
    else:
        ax.text(0.5, 0.5, 'No data available', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')

def create_energy_summary(ax, energy_data: Dict):
    """Create energy summary statistics"""
    ax.set_title('Energy Statistics', fontweight='bold', fontsize=12)
    
    if not energy_data:
        ax.text(0.5, 0.5, 'No energy data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        ax.set_xticks([])
        ax.set_yticks([])
        return
    
    # Collect all energy values
    all_energies = []
    for filename, energies in energy_data.items():
        if energies and isinstance(energies, list):
            for energy in energies:
                if isinstance(energy, dict) and 'hartree' in energy:
                    all_energies.append(energy['hartree'])
                elif isinstance(energy, (int, float)):
                    all_energies.append(energy)
    
    if all_energies:
        # Calculate statistics
        mean_energy = np.mean(all_energies)
        std_energy = np.std(all_energies)
        min_energy = np.min(all_energies)
        max_energy = np.max(all_energies)
        
        # Create box plot
        box = ax.boxplot([all_energies], patch_artist=True, labels=['SCF Energies'])
        box['boxes'][0].set_facecolor('#4ecdc4')
        box['boxes'][0].set_alpha(0.7)
        
        # Add statistics text
        stats_text = f'Mean: {mean_energy:.4f}\nStd: {std_energy:.4f}\nRange: {max_energy-min_energy:.4f}'
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, 
               verticalalignment='top', fontsize=9, 
               bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    else:
        ax.text(0.5, 0.5, 'No valid energies', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        ax.set_xticks([])
        ax.set_yticks([])

def create_molecular_summary(ax, molecular_data: Dict):
    """Create molecular properties summary"""
    ax.set_title('Molecular Properties', fontweight='bold', fontsize=12)
    
    if not molecular_data:
        ax.text(0.5, 0.5, 'No molecular data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        ax.set_xticks([])
        ax.set_yticks([])
        return
    
    # Collect atom counts and formulas
    atom_counts = []
    formulas = set()
    
    for filename, props in molecular_data.items():
        if props and isinstance(props, dict):
            atom_count = props.get('nAtoms', 0)
            formula = props.get('formula', '')
            if atom_count > 0:
                atom_counts.append(atom_count)
            if formula:
                formulas.add(formula)
    
    if atom_counts:
        # Create histogram of atom counts
        bins = max(5, min(len(set(atom_counts)), 10))
        ax.hist(atom_counts, bins=bins, alpha=0.7, color='#95e1d3', edgecolor='black')
        ax.set_xlabel('Number of Atoms')
        ax.set_ylabel('Frequency')
        
        # Add summary text
        summary_text = f'Molecules: {len(atom_counts)}\nUnique Formulas: {len(formulas)}\nAtom Range: {min(atom_counts)}-{max(atom_counts)}'
        ax.text(0.98, 0.98, summary_text, transform=ax.transAxes, 
               verticalalignment='top', horizontalalignment='right', fontsize=9,
               bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.5))
    else:
        ax.text(0.5, 0.5, 'No valid molecular data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        ax.set_xticks([])
        ax.set_yticks([])

def create_energy_trends(ax, energy_data: Dict):
    """Create energy trends across files"""
    ax.set_title('SCF Energy Trends by File', fontweight='bold', fontsize=12)
    
    if not energy_data:
        ax.text(0.5, 0.5, 'No energy data available', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        return
    
    # Prepare data for plotting
    file_names = []
    energies_by_file = []
    colors = plt.cm.Set3(np.linspace(0, 1, len(energy_data)))
    
    for i, (filename, energies) in enumerate(energy_data.items()):
        if energies and isinstance(energies, list):
            energy_values = []
            for energy in energies:
                if isinstance(energy, dict) and 'hartree' in energy:
                    energy_values.append(energy['hartree'])
                elif isinstance(energy, (int, float)):
                    energy_values.append(energy)
            
            if energy_values:
                file_names.append(Path(filename).stem)
                energies_by_file.append(energy_values)
    
    if energies_by_file:
        # Create violin plot or box plot for multiple energies per file
        if any(len(energies) > 1 for energies in energies_by_file):
            # Use violin plot for files with multiple energies
            parts = ax.violinplot(energies_by_file, positions=range(len(file_names)), 
                                showmeans=True, showmedians=True)
            for pc, color in zip(parts['bodies'], colors):
                pc.set_facecolor(color)
                pc.set_alpha(0.7)
        else:
            # Use bar plot for single energies
            single_energies = [energies[0] for energies in energies_by_file]
            bars = ax.bar(range(len(file_names)), single_energies, color=colors, alpha=0.7)
            
            # Add value labels
            for i, (bar, energy) in enumerate(zip(bars, single_energies)):
                ax.text(bar.get_x() + bar.get_width()/2., energy, 
                       f'{energy:.4f}', ha='center', va='bottom', fontsize=8)
        
        ax.set_xticks(range(len(file_names)))
        ax.set_xticklabels(file_names, rotation=45, ha='right')
        ax.set_ylabel('Energy (Hartree)')
        ax.grid(True, alpha=0.3)
    else:
        ax.text(0.5, 0.5, 'No valid energy data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')

def create_atom_distribution(ax, molecular_data: Dict):
    """Create atom count distribution"""
    ax.set_title('Atom Count Distribution', fontweight='bold', fontsize=12)
    
    if not molecular_data:
        ax.text(0.5, 0.5, 'No molecular data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        return
    
    atom_counts = []
    for filename, props in molecular_data.items():
        if props and isinstance(props, dict):
            atom_count = props.get('nAtoms', 0)
            if atom_count > 0:
                atom_counts.append(atom_count)
    
    if atom_counts:
        unique_counts = list(set(atom_counts))
        frequencies = [atom_counts.count(count) for count in unique_counts]
        
        bars = ax.bar(unique_counts, frequencies, color='#95e1d3', alpha=0.7, edgecolor='black')
        ax.set_xlabel('Number of Atoms')
        ax.set_ylabel('Number of Molecules')
        
        # Add frequency labels
        for bar, freq in zip(bars, frequencies):
            if freq > 0:
                ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.05,
                       str(freq), ha='center', va='bottom', fontweight='bold')
    else:
        ax.text(0.5, 0.5, 'No atom data', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')

def create_file_overview_table(ax, energy_data: Dict, molecular_data: Dict):
    """Create overview table of all files"""
    ax.set_title('File Analysis Summary', fontweight='bold', fontsize=12, pad=20)
    ax.axis('off')
    
    # Collect file information
    all_files = set(energy_data.keys()) | set(molecular_data.keys())
    
    if not all_files:
        ax.text(0.5, 0.5, 'No files analyzed', ha='center', va='center', 
               transform=ax.transAxes, fontsize=12, color='gray')
        return
    
    # Prepare table data
    table_data = []
    headers = ['File', 'Energies', 'Formula', 'Atoms', 'Status']
    
    for filename in sorted(all_files):
        file_stem = Path(filename).stem
        
        # Energy info
        energy_info = "None"
        if filename in energy_data and energy_data[filename]:
            energy_count = len(energy_data[filename])
            energy_info = f"{energy_count} energies"
        
        # Molecular info
        formula = "Unknown"
        atoms = "0"
        if filename in molecular_data and molecular_data[filename]:
            mol_data = molecular_data[filename]
            formula = mol_data.get('formula', 'Unknown')
            atoms = str(mol_data.get('nAtoms', 0))
        
        # Status
        status = "✓ Complete" if (filename in energy_data and filename in molecular_data) else "⚠ Partial"
        
        table_data.append([file_stem, energy_info, formula, atoms, status])
    
    # Create table
    if table_data:
        table = ax.table(cellText=table_data,
                        colLabels=headers,
                        cellLoc='center',
                        loc='center',
                        bbox=[0, 0, 1, 0.8])
        
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1, 2)
        
        # Style the table
        for i in range(len(table_data) + 1):
            for j in range(len(headers)):
                cell = table[(i, j)]
                if i == 0:  # Header
                    cell.set_facecolor('#4ecdc4')
                    cell.set_text_props(weight='bold', color='white')
                else:
                    if j == 4:  # Status column
                        if '✓' in table_data[i-1][j]:
                            cell.set_facecolor('#d4edda')
                        else:
                            cell.set_facecolor('#fff3cd')
                    else:
                        cell.set_facecolor('#f8f9fa')

def create_detailed_energy_analysis(energy_data: Dict, output_dir: str) -> Optional[str]:
    """Create detailed energy analysis figure"""
    
    if not energy_data:
        return None
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Detailed Energy Analysis', fontsize=16, fontweight='bold')
    
    # Collect all energies with file info
    all_energies = []
    file_labels = []
    
    for filename, energies in energy_data.items():
        if energies and isinstance(energies, list):
            for energy in energies:
                if isinstance(energy, dict) and 'hartree' in energy:
                    all_energies.append(energy['hartree'])
                    file_labels.append(Path(filename).stem)
                elif isinstance(energy, (int, float)):
                    all_energies.append(energy)
                    file_labels.append(Path(filename).stem)
    
    if not all_energies:
        plt.close(fig)
        return None
    
    # 1. Energy distribution histogram
    ax1.hist(all_energies, bins=20, alpha=0.7, color='#4ecdc4', edgecolor='black')
    ax1.set_title('Energy Distribution')
    ax1.set_xlabel('Energy (Hartree)')
    ax1.set_ylabel('Frequency')
    ax1.grid(True, alpha=0.3)
    
    # 2. Energy by file (if multiple files)
    unique_files = list(set(file_labels))
    if len(unique_files) > 1:
        file_energies = []
        for file in unique_files:
            file_e = [e for e, f in zip(all_energies, file_labels) if f == file]
            file_energies.append(file_e)
        
        bp = ax2.boxplot(file_energies, labels=unique_files, patch_artist=True)
        colors = plt.cm.Set3(np.linspace(0, 1, len(unique_files)))
        for patch, color in zip(bp['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        ax2.set_title('Energy Comparison by File')
        ax2.set_ylabel('Energy (Hartree)')
        ax2.tick_params(axis='x', rotation=45)
    else:
        ax2.text(0.5, 0.5, 'Single file analysis', ha='center', va='center', 
                transform=ax2.transAxes, fontsize=12)
        ax2.set_title('Energy Comparison')
    
    # 3. Energy statistics
    ax3.axis('off')
    stats_text = f"""Energy Statistics:
    
    Count: {len(all_energies)}
    Mean: {np.mean(all_energies):.6f} Hartree
    Std Dev: {np.std(all_energies):.6f} Hartree
    Min: {np.min(all_energies):.6f} Hartree
    Max: {np.max(all_energies):.6f} Hartree
    Range: {np.max(all_energies) - np.min(all_energies):.6f} Hartree
    
    Files Analyzed: {len(unique_files)}
    """
    ax3.text(0.1, 0.9, stats_text, transform=ax3.transAxes, fontsize=11,
            verticalalignment='top', fontfamily='monospace',
            bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.3))
    ax3.set_title('Statistical Summary')
    
    # 4. Energy scatter plot (index vs energy)
    scatter = ax4.scatter(range(len(all_energies)), all_energies, 
                         c=[unique_files.index(f) for f in file_labels], 
                         alpha=0.7, cmap='Set3')
    ax4.set_title('Energy Values by Index')
    ax4.set_xlabel('Calculation Index')
    ax4.set_ylabel('Energy (Hartree)')
    ax4.grid(True, alpha=0.3)
    
    # Add colorbar if multiple files
    if len(unique_files) > 1:
        cbar = plt.colorbar(scatter, ax=ax4)
        cbar.set_ticks(range(len(unique_files)))
        cbar.set_ticklabels(unique_files)
    
    plt.tight_layout()
    
    # Save figure
    energy_path = os.path.join(output_dir, 'detailed_energy_analysis.png')
    fig.savefig(energy_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    
    return energy_path

def create_detailed_molecular_analysis(molecular_data: Dict, output_dir: str) -> Optional[str]:
    """Create detailed molecular analysis figure"""
    
    if not molecular_data:
        return None
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Detailed Molecular Analysis', fontsize=16, fontweight='bold')
    
    # Extract molecular properties
    atom_counts = []
    formulas = []
    file_names = []
    
    for filename, props in molecular_data.items():
        if props and isinstance(props, dict):
            atom_counts.append(props.get('nAtoms', 0))
            formulas.append(props.get('formula', 'Unknown'))
            file_names.append(Path(filename).stem)
    
    if not atom_counts:
        plt.close(fig)
        return None
    
    # 1. Atom count distribution
    ax1.hist(atom_counts, bins=max(3, min(len(set(atom_counts)), 10)), 
             alpha=0.7, color='#95e1d3', edgecolor='black')
    ax1.set_title('Atom Count Distribution')
    ax1.set_xlabel('Number of Atoms')
    ax1.set_ylabel('Number of Molecules')
    ax1.grid(True, alpha=0.3)
    
    # 2. Atom counts by file
    bars = ax2.bar(range(len(file_names)), atom_counts, 
                   color=plt.cm.Set2(np.linspace(0, 1, len(file_names))), alpha=0.7)
    ax2.set_title('Atom Count by File')
    ax2.set_xlabel('Files')
    ax2.set_ylabel('Number of Atoms')
    ax2.set_xticks(range(len(file_names)))
    ax2.set_xticklabels(file_names, rotation=45, ha='right')
    
    # Add value labels
    for bar, count in zip(bars, atom_counts):
        ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                str(count), ha='center', va='bottom', fontweight='bold')
    
    # 3. Formula frequency
    formula_counts = {}
    for formula in formulas:
        formula_counts[formula] = formula_counts.get(formula, 0) + 1
    
    if len(formula_counts) > 1:
        sorted_formulas = sorted(formula_counts.items(), key=lambda x: x[1], reverse=True)
        top_formulas = sorted_formulas[:10]  # Top 10 most common
        
        formula_names, counts = zip(*top_formulas)
        ax3.barh(range(len(formula_names)), counts, color='#ffe66d', alpha=0.7)
        ax3.set_title('Most Common Molecular Formulas')
        ax3.set_xlabel('Frequency')
        ax3.set_yticks(range(len(formula_names)))
        ax3.set_yticklabels(formula_names)
    else:
        ax3.text(0.5, 0.5, f'Single formula type:\n{formulas[0]}', 
                ha='center', va='center', transform=ax3.transAxes, fontsize=12)
        ax3.set_title('Molecular Formulas')
    
    # 4. Molecular statistics summary
    ax4.axis('off')
    unique_formulas = len(set(formulas))
    avg_atoms = np.mean(atom_counts)
    min_atoms = min(atom_counts)
    max_atoms = max(atom_counts)
    
    stats_text = f"""Molecular Statistics:
    
    Total Molecules: {len(file_names)}
    Unique Formulas: {unique_formulas}
    
    Atom Count Statistics:
    Average: {avg_atoms:.1f} atoms
    Minimum: {min_atoms} atoms
    Maximum: {max_atoms} atoms
    Range: {max_atoms - min_atoms} atoms
    
    Most Common Formula: {max(formula_counts, key=formula_counts.get)}
    """
    
    ax4.text(0.1, 0.9, stats_text, transform=ax4.transAxes, fontsize=11,
            verticalalignment='top', fontfamily='monospace',
            bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.3))
    ax4.set_title('Statistical Summary')
    
    plt.tight_layout()
    
    # Save figure
    molecular_path = os.path.join(output_dir, 'detailed_molecular_analysis.png')
    fig.savefig(molecular_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    
    return molecular_path

def create_file_comparison_analysis(file_data: Dict, output_dir: str) -> Optional[str]:
    """Create file-by-file comparison analysis"""
    
    if len(file_data) < 2:
        return None
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('File Comparison Analysis', fontsize=16, fontweight='bold')
    
    file_names = list(file_data.keys())
    colors = plt.cm.Set3(np.linspace(0, 1, len(file_names)))
    
    # 1. Energy comparison
    ax1.set_title('Energy Comparison Across Files')
    energy_comparison = []
    valid_files = []
    
    for filename, data in file_data.items():
        energies = data.get('energyData', [])
        if energies:
            energy_comparison.append(energies)
            valid_files.append(Path(filename).stem)
    
    if energy_comparison:
        bp = ax1.boxplot(energy_comparison, labels=valid_files, patch_artist=True)
        for patch, color in zip(bp['boxes'], colors[:len(valid_files)]):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        ax1.set_ylabel('Energy (Hartree)')
        ax1.tick_params(axis='x', rotation=45)
    else:
        ax1.text(0.5, 0.5, 'No energy data for comparison', ha='center', va='center', 
                transform=ax1.transAxes)
    
    # 2. Molecular size comparison
    ax2.set_title('Molecular Size Comparison')
    mol_sizes = []
    mol_files = []
    
    for filename, data in file_data.items():
        mol_data = data.get('molecularData', {})
        if mol_data and 'nAtoms' in mol_data:
            mol_sizes.append(mol_data['nAtoms'])
            mol_files.append(Path(filename).stem)
    
    if mol_sizes:
        bars = ax2.bar(range(len(mol_files)), mol_sizes, 
                      color=colors[:len(mol_files)], alpha=0.7)
        ax2.set_xticks(range(len(mol_files)))
        ax2.set_xticklabels(mol_files, rotation=45, ha='right')
        ax2.set_ylabel('Number of Atoms')
        
        for bar, size in zip(bars, mol_sizes):
            ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                    str(size), ha='center', va='bottom', fontweight='bold')
    else:
        ax2.text(0.5, 0.5, 'No molecular data for comparison', ha='center', va='center', 
                transform=ax2.transAxes)
    
    # 3. Data completeness matrix
    ax3.set_title('Data Completeness Matrix')
    
    data_types = ['Energy', 'Molecular', 'HOMO-LUMO', 'Frequencies']
    completeness_matrix = []
    
    for filename in file_names:
        data = file_data[filename]
        row = []
        row.append(1 if data.get('energyData') else 0)
        row.append(1 if data.get('molecularData') else 0)
        row.append(1 if data.get('homoLumoData') else 0)
        row.append(1 if data.get('frequencyData') else 0)
        completeness_matrix.append(row)
    
    im = ax3.imshow(completeness_matrix, cmap='RdYlGn', aspect='auto')
    ax3.set_xticks(range(len(data_types)))
    ax3.set_xticklabels(data_types, rotation=45, ha='right')
    ax3.set_yticks(range(len(file_names)))
    ax3.set_yticklabels([Path(f).stem for f in file_names])
    
    # Add text annotations
    for i in range(len(file_names)):
        for j in range(len(data_types)):
            text = '✓' if completeness_matrix[i][j] else '✗'
            ax3.text(j, i, text, ha='center', va='center', 
                    color='white' if completeness_matrix[i][j] else 'black',
                    fontweight='bold', fontsize=12)
    
    # 4. Summary statistics table
    ax4.axis('off')
    ax4.set_title('Comparison Summary', pad=20)
    
    summary_data = []
    for filename in file_names:
        file_stem = Path(filename).stem
        data = file_data[filename]
        
        energy_count = len(data.get('energyData', []))
        has_molecular = '✓' if data.get('molecularData') else '✗'
        atoms = data.get('molecularData', {}).get('nAtoms', 0) if data.get('molecularData') else 0
        
        summary_data.append([file_stem, str(energy_count), has_molecular, str(atoms)])
    
    table = ax4.table(cellText=summary_data,
                     colLabels=['File', 'Energies', 'Molecular', 'Atoms'],
                     cellLoc='center',
                     loc='center',
                     bbox=[0, 0.2, 1, 0.6])
    
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 2)
    
    # Style table
    for i in range(len(summary_data) + 1):
        for j in range(4):
            cell = table[(i, j)]
            if i == 0:
                cell.set_facecolor('#4ecdc4')
                cell.set_text_props(weight='bold', color='white')
            else:
                cell.set_facecolor('#f8f9fa')
    
    plt.tight_layout()
    
    # Save figure
    comparison_path = os.path.join(output_dir, 'file_comparison_analysis.png')
    fig.savefig(comparison_path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    
    return comparison_path

def generate_text_summary(stats: Dict, energy_data: Dict, molecular_data: Dict, 
                         file_data: Dict, timestamp: str) -> str:
    """Generate comprehensive text summary"""
    
    summary_lines = [
        f"# Computational Chemistry Analysis Report",
        f"Generated: {timestamp}",
        f"",
        f"## Overview",
        f"- Total files analyzed: {len(file_data)}",
        f"- Molecules found: {stats.get('molecules', 0)}",
        f"- SCF energies: {stats.get('scfEnergies', 0)}",
        f"- Total atoms: {stats.get('atoms', 0)}",
        f"",
    ]
    
    # Energy analysis
    if energy_data:
        all_energies = []
        for energies in energy_data.values():
            if energies and isinstance(energies, list):
                for energy in energies:
                    if isinstance(energy, dict) and 'hartree' in energy:
                        all_energies.append(energy['hartree'])
                    elif isinstance(energy, (int, float)):
                        all_energies.append(energy)
        
        if all_energies:
            summary_lines.extend([
                f"## Energy Analysis",
                f"- Total energy calculations: {len(all_energies)}",
                f"- Energy range: {min(all_energies):.6f} to {max(all_energies):.6f} Hartree",
                f"- Average energy: {np.mean(all_energies):.6f} Hartree",
                f"- Standard deviation: {np.std(all_energies):.6f} Hartree",
                f"",
            ])
    
    # Molecular analysis
    if molecular_data:
        atom_counts = [props.get('nAtoms', 0) for props in molecular_data.values() 
                      if props and isinstance(props, dict)]
        formulas = [props.get('formula', 'Unknown') for props in molecular_data.values() 
                   if props and isinstance(props, dict)]
        
        if atom_counts:
            unique_formulas = len(set(formulas))
            summary_lines.extend([
                f"## Molecular Analysis",
                f"- Unique molecular formulas: {unique_formulas}",
                f"- Atom count range: {min(atom_counts)} to {max(atom_counts)} atoms",
                f"- Average molecule size: {np.mean(atom_counts):.1f} atoms",
                f"",
            ])
    
    # File-by-file summary
    summary_lines.extend([
        f"## File Summary",
    ])
    
    for filename, data in file_data.items():
        file_stem = Path(filename).stem
        energy_count = len(data.get('energyData', []))
        mol_data = data.get('molecularData', {})
        atoms = mol_data.get('nAtoms', 0) if mol_data else 0
        formula = mol_data.get('formula', 'Unknown') if mol_data else 'Unknown'
        
        summary_lines.extend([
            f"### {file_stem}",
            f"- Energies: {energy_count}",
            f"- Formula: {formula}",
            f"- Atoms: {atoms}",
            f"",
        ])
    
    return "\n".join(summary_lines)

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print("Usage: python generate_comprehensive_report.py <data_json> <output_dir>")
        sys.exit(1)
    
    data_json = sys.argv[1]
    output_dir = sys.argv[2]
    
    try:
        data = json.loads(data_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        result = create_comprehensive_report(data, output_dir)
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error generating comprehensive report: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 