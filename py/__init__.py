"""
Computational Chemistry Python Package for ElizaOS Plugin
========================================================

This package contains Python modules for computational chemistry analysis,
visualization, and comprehensive reporting.

Available modules:
- parse_gaussian_cclib: Enhanced Gaussian log file parser using cclib
- plot_gaussian_analysis: Matplotlib-based visualization generator
- generate_comprehensive_report: Advanced comprehensive report generator
- molecular_analyzer: Molecular data analysis and property calculations
"""

__version__ = "2.0.0"
__author__ = "ElizaOS Computational Chemistry Plugin"

# Import main functions for easier access
try:
    from .parse_gaussian_cclib import main as parse_gaussian
    from .plot_gaussian_analysis import main as plot_analysis
    from .generate_comprehensive_report import main as generate_report
    from .molecular_analyzer import main as analyze_molecular
except ImportError:
    # Graceful fallback if modules aren't available
    pass

__all__ = [
    'parse_gaussian',
    'plot_analysis', 
    'generate_report',
    'analyze_molecular'
] 