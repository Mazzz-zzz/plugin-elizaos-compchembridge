# Computational Chemistry Python Scripts

This directory contains Python scripts for computational chemistry analysis, visualization, and comprehensive reporting.

## Available Scripts

### 1. `parse_gaussian_cclib.py`
Enhanced Gaussian log file parser using cclib with comprehensive data extraction.

**Features:**
- Full molecular geometry parsing
- SCF energy extraction with metadata
- Frequency analysis
- HOMO-LUMO gap calculations
- Electronic properties extraction
- RDF/Turtle output for knowledge graphs

**Usage:**
```bash
python parse_gaussian_cclib.py input.log metadata.json --format json
```

### 2. `plot_gaussian_analysis.py`
Matplotlib-based visualization generator for computational chemistry data.

**Features:**
- Overview statistics charts
- SCF energy trend analysis
- Molecular property visualization
- Multi-file comparison plots
- High-resolution output (300 DPI)

**Usage:**
```bash
python plot_gaussian_analysis.py overview data.json output.png
```

### 3. `generate_comprehensive_report.py` ⭐ **NEW**
Advanced comprehensive report generator that combines multiple analysis types into publication-ready reports.

**Features:**
- **Main Dashboard:** 6-panel overview with key statistics, energy summaries, and molecular properties
- **Detailed Energy Analysis:** Energy distribution, file comparison, statistical summaries, and scatter plots
- **Molecular Analysis:** Atom count distributions, formula frequencies, and property summaries
- **File Comparison:** Cross-file analysis with data completeness matrices
- **Text Summary:** Formatted markdown summary with key findings
- **Professional Quality:** Publication-ready charts with proper styling

**Usage:**
```bash
python generate_comprehensive_report.py data.json output_directory/
```

**Output Files:**
- `comprehensive_dashboard.png` - Main overview dashboard
- `detailed_energy_analysis.png` - Energy analysis report
- `detailed_molecular_analysis.png` - Molecular properties report  
- `file_comparison_analysis.png` - File comparison report
- Text summary with key findings and statistics

**Dashboard Components:**
1. **Overview Statistics** - Pie chart of data distribution
2. **Energy Summary** - Box plots and statistical annotations
3. **Molecular Summary** - Atom count histograms with summary stats
4. **Energy Trends** - Violin/bar plots across files
5. **Atom Distribution** - Frequency distribution of molecular sizes
6. **File Overview Table** - Complete analysis summary table

### 4. `molecular_analyzer.py`
Molecular data analysis and property calculation engine.

**Features:**
- Molecular property calculations
- Statistical analysis
- Data validation and quality checks
- Integration with knowledge graph data

## Installation

Install all required dependencies:

```bash
pip install -r requirements.txt
```

### Required Packages
- `cclib>=1.8.1` - Computational chemistry parser
- `numpy>=1.21.0` - Numerical computing
- `scipy>=1.7.0` - Scientific computing
- `matplotlib>=3.4.0` - Plotting and visualization
- `seaborn>=0.11.0` - Statistical visualization
- `pandas>=1.3.0` - Data manipulation
- `networkx>=2.6` - Graph analysis

## Integration with ElizaOS

These scripts are designed to integrate seamlessly with the ElizaOS computational chemistry plugin:

### Actions Available:
- `GENERATE_COMPREHENSIVE_REPORT` - Generate full analysis reports
- `GENERATE_VISUALIZATION` - Create individual charts
- `PARSE_GAUSSIAN_FILE` - Parse new Gaussian files
- `ANALYZE_MOLECULAR_DATA` - Run molecular analysis

### Example Usage in Chat:
```
"Generate a comprehensive report"
"Create a full analysis report of all the data"
"I need a detailed summary report with charts"
```

## Output Quality

All visualizations are generated with:
- **High Resolution:** 300 DPI for publication quality
- **Professional Styling:** Clean, modern appearance
- **Color Coding:** Consistent color schemes across charts
- **Statistical Annotations:** Automatic calculation and display of key metrics
- **Responsive Layout:** Adaptive sizing based on data complexity

## Data Flow

```
Gaussian Files → cclib Parser → Knowledge Graph → Comprehensive Reports
     ↓                ↓               ↓                    ↓
   .log files    JSON/RDF data    ElizaOS Memory    Multi-panel PDFs
```

## Advanced Features

### Comprehensive Report Generation
The `generate_comprehensive_report.py` script provides the most advanced analysis capabilities:

- **Automatic Chart Type Detection:** Based on available data
- **Multi-file Analysis:** Comparative analysis across multiple Gaussian calculations
- **Statistical Summaries:** Comprehensive statistics with confidence intervals
- **Publication Ready:** Professional formatting suitable for research papers
- **Modular Design:** Easy to extend with new analysis types

### Performance Optimization
- **Efficient Memory Usage:** Streaming data processing for large files
- **Parallel Processing:** Multi-threaded chart generation
- **Caching:** Intelligent caching of intermediate results
- **Error Handling:** Robust error recovery and reporting

## Troubleshooting

### Common Issues:
1. **Missing Dependencies:** Run `pip install -r requirements.txt`
2. **Python Path:** Ensure Python 3.8+ is available
3. **Memory Issues:** Large files may require more RAM
4. **File Permissions:** Ensure output directories are writable

### Debug Mode:
Set `PYTHON_DEBUG=true` in the ElizaOS configuration for detailed logging.

## Contributing

When adding new analysis features:
1. Follow the existing code structure
2. Add comprehensive error handling
3. Include example usage in docstrings
4. Update this README with new capabilities
5. Add tests for new functionality 