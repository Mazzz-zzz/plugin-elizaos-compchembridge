# Gaussian Knowledge Graph Plugin with cclib

A comprehensive ElizaOS plugin for managing, analyzing, and visualizing Gaussian quantum chemistry calculation data through an intelligent knowledge graph system powered by **cclib** for robust data extraction.

## 🚀 Features

### 📊 Enhanced Knowledge Graph Management with cclib
- **cclib-Powered Parsing**: Uses the industry-standard cclib library for comprehensive data extraction
- **60+ Molecular Properties**: Automatically extracts all available molecular and electronic properties
- **Automatic File Monitoring**: Continuously watches `example_logs/` directory for new Gaussian output files
- **Real-time Processing**: Automatically parses and integrates new calculations into the knowledge graph
- **RDF Storage**: Uses semantic RDF format for structured data representation with enhanced ontologies
- **Persistent Storage**: Maintains comprehensive knowledge graph across sessions

### 🔬 Comprehensive Data Extraction (cclib Enhanced)
- **Basic Molecular Information**: atomnos, atomcoords, atommasses, charge, mult, natom
- **Electronic Structure**: scfenergies, moenergies, mocoeffs, homos, mosyms
- **Vibrational Data**: vibfreqs, vibirs, vibramans, vibdisps, vibfconsts, vibrmasses
- **Thermochemistry**: enthalpy, entropy, freeenergy, zpve, temperature, pressure
- **Electronic Transitions**: etenergies, etoscs, etdips, etsecs, etsyms
- **Advanced Properties**: polarizabilities, atomcharges, atomspins, moments
- **Basis Set Information**: aonames, aooverlaps, atombasis, gbasis, nbasis, nmo
- **Geometry Optimization**: geotargets, geovalues, grads, optdone, optstatus
- **Coupled Cluster & MP**: ccenergies, mpenergies
- **And Much More**: See [cclib documentation](https://cclib.github.io/) for complete list

### 🔍 Query & Search Capabilities
- **Natural Language Queries**: Ask questions about your molecular data in plain English
- **Enhanced Search Patterns**: Thermochemical, spectroscopic, and basis set queries
- **Statistical Summaries**: Get comprehensive overview of all calculations with cclib enhancements
- **Targeted Searches**: Find specific molecular properties, energies, frequencies, or spectroscopic data
- **Relationship Discovery**: Explore connections between molecules and properties

### 📈 Visualization & Plotting
- **Interactive Network Graphs**: D3.js-powered visualizations of molecular relationships
- **Force-Directed Layouts**: Automatically positions nodes based on connectivity
- **Enhanced Color-Coding**: Different colors for molecules, atoms, energies, thermochemical, and spectroscopic properties
- **Hover Interactions**: View detailed information including cclib-extracted properties
- **Export Options**: Generate SVG, PNG, and interactive HTML visualizations

### 🔬 Advanced Analysis with cclib Data
- **Enhanced Energy Analysis**: SCF energies, coupled cluster, and MP corrections
- **HOMO-LUMO Gap Analysis**: Electronic property comparisons with accurate orbital energies
- **Thermochemical Analysis**: Enthalpy, entropy, free energy, and ZPVE analysis
- **Spectroscopic Analysis**: Electronic transitions, IR intensities, Raman activities
- **Vibrational Analysis**: Enhanced frequency data with IR and Raman intensities
- **Basis Set Analysis**: Molecular orbital and basis function information
- **Optimization Status**: Track convergence and failed optimizations
- **Correlation Studies**: Identify relationships between molecular properties
- **Anomaly Detection**: Flag potential issues in calculations using cclib validation

### 📤 Data Export & Sharing
- **Multiple Formats**: Export data as CSV, JSON, Excel-compatible, and RDF
- **Enhanced Structured Exports**: Separate files for molecules, energies, frequencies, thermochemistry, and spectroscopy
- **cclib Metadata**: Comprehensive data documentation with parser information
- **Batch Processing**: Export all data types simultaneously
- **File Size Reporting**: Detailed information about exported datasets

### 📊 Comprehensive Reporting
- **Enhanced HTML Reports**: Beautiful, publication-ready reports with embedded charts and cclib data
- **Thermochemical Sections**: Dedicated analysis of thermodynamic properties
- **Spectroscopic Sections**: Electronic transitions and vibrational analysis
- **Basis Set Reports**: Molecular orbital and basis function analysis
- **Markdown Documentation**: Detailed analysis reports in markdown format
- **Executive Summaries**: High-level overviews for quick insights
- **Data Quality Assessment**: Identification of potential calculation issues using cclib validation
- **Research Recommendations**: AI-generated suggestions leveraging cclib's comprehensive data

## 🎯 Available Actions

### 1. Query Knowledge Graph (`QUERY_GAUSSIAN_KNOWLEDGE`)
```
Enhanced Examples:
- "How many molecules are in the knowledge graph?"
- "Show me thermochemical data"
- "What electronic transitions do we have?"
- "Tell me about basis set information"
- "Find molecules with enthalpy data"
- "Show me IR intensities"
- "What Raman activities are available?"
- "Tell me about optimization status"
```

### 2. Plot Knowledge Graph (`PLOT_KNOWLEDGE_GRAPH`)
```
Examples:
- "Plot the knowledge graph"
- "Visualize the molecular network with cclib data"
- "Show network diagram including thermochemical properties"
- "Create enhanced graph visualization"
```

### 3. Analyze Molecular Data (`ANALYZE_MOLECULAR_DATA`)
```
Enhanced Examples:
- "Analyze the molecular data trends"
- "Compare thermochemical properties"
- "Show me spectroscopic analysis"
- "Analyze electronic transitions"
- "Compare basis set information"
- "Show optimization success rates"
- "Analyze IR and Raman data"
```

### 4. Export Knowledge Data (`EXPORT_KNOWLEDGE_DATA`)
```
Examples:
- "Export the knowledge graph data as CSV"
- "Download thermochemical data in JSON format"
- "Save spectroscopic data for backup"
- "Export cclib data in Excel format"
```

### 5. Generate Comprehensive Report (`GENERATE_COMPREHENSIVE_REPORT`)
```
Examples:
- "Generate a comprehensive report with cclib data"
- "Create a full analysis report including thermochemistry"
- "I need a detailed research report with spectroscopic data"
- "Generate complete analysis with basis set information"
```

## 📁 Enhanced Output Structure

The plugin creates organized output in the `data/` directory with cclib enhancements:

```
data/
├── gaussian-knowledge-graph.ttl    # Enhanced RDF knowledge graph with cclib data
├── visualizations/                 # Interactive plots and charts
│   ├── knowledge-graph.html        # Interactive network visualization
│   ├── network-data.json          # Raw network data with cclib properties
│   └── knowledge-graph.svg        # Static SVG export
├── exports/                        # Enhanced data exports
│   ├── molecules-[timestamp].csv   # Basic molecular structure data
│   ├── energies-[timestamp].csv    # Enhanced energy data (SCF, CC, MP)
│   ├── frequencies-[timestamp].csv # Vibrational data with IR/Raman
│   ├── thermochemistry-[timestamp].csv  # Enthalpy, entropy, free energy
│   ├── spectroscopy-[timestamp].csv     # Electronic transitions, oscillator strengths
│   ├── basis-set-[timestamp].csv   # Molecular orbital and basis information
│   └── metadata-[timestamp].json   # Enhanced export metadata with cclib info
└── reports/                        # Generated reports
    ├── comprehensive-[id].html     # Interactive HTML report with cclib data
    ├── comprehensive-[id].md       # Detailed markdown report
    ├── executive-summary-[id].md   # Executive summary
    └── enhanced-molecular-analysis-[id].md  # cclib-specific analysis reports
```

## 🔧 Installation & Setup

### Prerequisites
```bash
# Install cclib (required)
pip install cclib

# Verify installation
python -c "import cclib; print(cclib.__version__)"
```

### Plugin Setup
1. **Initialize the Plugin**:
```typescript
import { initializeGaussianKnowledgePlugin } from "@elizaos/plugin-gaussian-kg";

// In your main application
await initializeGaussianKnowledgePlugin(runtime);
```

2. **Directory Structure**:
Ensure you have the following directories:
- `example_logs/` - Place your Gaussian .log and .out files here
- `py/` - Python parsing scripts (included with cclib parser)
- `data/` - Output directory (created automatically)

3. **Dependencies**:
- **Python 3.x** with cclib package
- **Node.js** environment with ElizaOS core

## 🧪 Supported File Formats & Computational Chemistry Programs

### Input Files (via cclib)
- **Gaussian**: .log, .out files
- **ORCA**: .out files
- **QChem**: .out files  
- **NWChem**: .out files
- **Psi4**: .out files
- **Molpro**: .out files
- **GAMESS**: .log, .out files
- **And 15+ more programs** supported by cclib

### Output Files
- **RDF/Turtle**: Enhanced semantic representation
- **JSON**: Complete molecular data with cclib metadata
- **CSV**: Tabular data for analysis
- **HTML**: Interactive reports with visualizations
- **Markdown**: Documentation and reports
- **SVG**: Vector graphics for publications

## 📊 Enhanced Visualization Features

### Interactive Network Graphs
- **Force-directed layout** with enhanced cclib data display
- **Enhanced Node types**: Molecules (red), Atoms (blue), Energies (yellow), Thermochemistry (orange), Spectroscopy (purple)
- **Rich Edge types**: Composition, Energy, Vibration, Thermochemical, Electronic transitions
- **Interactive features**: Drag nodes, zoom, pan, hover tooltips with cclib data

### Advanced Statistical Charts
- **Energy distribution histograms** (SCF, CC, MP)
- **HOMO-LUMO gap scatter plots** with accurate orbital energies
- **Thermochemical property correlations**
- **Spectroscopic transition analysis**
- **Basis set comparison charts**
- **Optimization convergence tracking**

## 🔍 Enhanced Analysis Capabilities

### Comprehensive Energy Analysis
- SCF energy statistics with cclib accuracy
- Coupled cluster and MP correction trends
- Energy correlation with molecular properties
- Dispersion correction analysis

### Thermochemical Analysis
- Enthalpy, entropy, and free energy trends
- ZPVE correction analysis
- Temperature and pressure dependencies
- Reaction thermodynamics prediction

### Spectroscopic Analysis
- Electronic transition energies and intensities
- Oscillator strength analysis
- IR intensity and Raman activity correlation
- UV-Vis spectrum prediction

### Advanced Electronic Properties
- Accurate HOMO-LUMO gap calculations
- Molecular orbital analysis
- Basis set convergence studies
- Electronic stability assessment

### Vibrational Analysis Enhanced
- IR and Raman intensity data
- Vibrational mode assignment
- Anharmonicity analysis
- Thermodynamic corrections

## 🛠️ Advanced Features with cclib

### Real-time Enhanced Monitoring
The plugin automatically:
- Detects cclib availability and version
- Processes calculations with comprehensive data extraction
- Updates the knowledge graph with 60+ molecular properties
- Maintains detailed calculation history and metadata

### AI-Powered Insights with cclib Data
- Automated correlation discovery across all molecular properties
- Enhanced research recommendation generation
- Comprehensive data quality assessment using cclib validation
- Advanced trend prediction with thermochemical data

### Export Flexibility
- **cclib-aware** format selection
- Enhanced filtered data exports
- Comprehensive batch processing capabilities
- Detailed metadata preservation with parser information

## 🎨 Customization

### Enhanced Visualization Themes
Modify visualization styles for cclib data:
- Color schemes for different property types (energy, thermochemical, spectroscopic)
- Layout algorithms optimized for chemical data
- Interactive features for exploring cclib properties

### Analysis Parameters
Customize analysis thresholds:
- Energy convergence criteria
- Thermochemical property filters
- Spectroscopic transition criteria
- Basis set quality assessment

## 📖 API Reference

See individual action files for detailed API documentation:
- `src/actions/queryGaussianKnowledge.ts` - Enhanced query capabilities
- `src/actions/plotKnowledgeGraph.ts` - Visualization with cclib data
- `src/actions/analyzeMolecularData.ts` - Comprehensive analysis features
- `src/actions/exportKnowledgeData.ts` - Enhanced export capabilities
- `src/actions/generateComprehensiveReport.ts` - cclib-aware reporting

## 🤝 Contributing

This plugin is designed to be extensible with cclib integration:
- Additional computational chemistry program support (via cclib)
- New visualization types for enhanced molecular properties
- Advanced analysis algorithms leveraging cclib's comprehensive data
- Export format extensions

## 🔬 cclib Integration Benefits

- **Standardized Data Extraction**: Consistent parsing across 18+ quantum chemistry programs
- **Comprehensive Property Coverage**: 60+ molecular properties automatically extracted
- **Robust Error Handling**: Built-in validation and error detection
- **Active Development**: Regular updates and new feature additions
- **Wide Community Support**: Extensive testing and validation by the computational chemistry community

## 📝 License

Part of the ElizaOS ecosystem. See main project license for details.

---

**Built with ❤️ for the computational chemistry community using cclib** 

*Powered by cclib - the universal parser for quantum chemistry calculations* 