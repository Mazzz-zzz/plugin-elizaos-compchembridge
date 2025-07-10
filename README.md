# Computational Chemistry Plugin V2

Advanced computational chemistry plugin for ElizaOS with integrated Python analysis capabilities.

## Overview

This plugin enables ElizaOS agents to perform molecular analysis, computational chemistry calculations, and generate visualizations using Python integration. It migrates and enhances functionality from the v1 plugin with improved architecture and extended capabilities.

## ✨ Features

### 🧪 **Molecular Analysis**
- **Property Calculation**: Molecular weight, density estimation, complexity scoring
- **Energy Analysis**: SCF energy classification, HOMO-LUMO gap analysis, conductivity prediction
- **Stability Assessment**: Bond-to-atom ratio analysis and stability estimates
- **Formula Recognition**: Automatic molecular formula extraction from text

### 🎨 **Visualization & Diagrams**
- **ASCII Structure Diagrams**: Text-based molecular structure representations
- **Coordinate System Support**: 2D/3D molecular coordinate processing
- **Element Color Coding**: Standard CPK color scheme for atoms
- **Bounds Calculation**: Automatic molecular dimension analysis

### 🐍 **Python Integration**
- **Seamless Script Execution**: Direct Python script calling from TypeScript actions
- **Environment Detection**: Automatic Python and package availability checking
- **Streaming Support**: Real-time output for long-running calculations
- **Error Handling**: Comprehensive error reporting and timeout management

### 🔧 **Extensible Architecture**
- **Service-Based Design**: Modular Python execution service
- **Configurable Environment**: Customizable Python paths and debug settings
- **Package Management**: Automatic detection of missing dependencies
- **Multiple Analysis Types**: Molecular, energy, and visualization analysis modes

## 🚀 Getting Started

### Prerequisites

1. **Python Environment**
   ```bash
   # Ensure Python 3.7+ is installed
   python3 --version

   # Install required packages
   pip install numpy matplotlib scipy pandas seaborn
   ```

2. **Plugin Installation**
   ```bash
   # Create the plugin
   elizaos create -t plugin my-compchem-plugin-v2

   # Navigate to the plugin directory
   cd plugin-my-compchem-plugin-v2

   # Start development
   elizaos dev
   ```

### Basic Configuration

Set up environment variables in your `.env` file:

```env
# Optional: Custom Python path
PYTHON_PATH=python3

# Optional: Enable debug logging
PYTHON_DEBUG=true

# Optional: Data directory for analysis files
COMPCHEM_DATA_DIR=./data
```

## 🎯 Available Actions

### 1. Molecular Analysis (`ANALYZE_MOLECULAR_DATA`)

Analyzes molecular structures and computes chemical properties.

**Example Usage:**
```
User: "Can you analyze this molecular structure and compute its properties?"
Agent: "🧪 Molecular Analysis Results

Formula: C6H6
Atom Count: 12
Bond Count: 12
Molecular Weight: 78.11 g/mol

Computed Properties:
• Density Estimate: 7.81 g/cm³
• Complexity Score: 24/100
• Stability: stable"
```

**Trigger Keywords:**
- "analyze molecule"
- "molecular analysis"
- "compute properties"
- "molecular weight"
- "chemical properties"

### 2. Molecular Visualization (`GENERATE_MOLECULAR_VISUALIZATION`)

Generates molecular structure visualizations and diagrams.

**Example Usage:**
```
User: "Can you visualize the molecular structure of benzene?"
Agent: "🎨 Molecular Visualization Generated

Molecule: C6H6 (Benzene)
Structure:

```
    H
    |
H-C=C-H
 |   |
H-C=C-H
    |
    H
```

Atoms: 12
Bonds: 12

Atom Details:
• C: 6
• H: 6"
```

**Trigger Keywords:**
- "visualize molecule"
- "plot structure"
- "show structure"
- "molecular diagram"

## 🔧 Technical Details

### Python Service Architecture

The plugin uses a dedicated `PythonService` that handles:

1. **Script Execution**: Executes Python scripts using `execFile` and `spawn`
2. **Environment Checking**: Validates Python installation and package availability
3. **Error Handling**: Provides detailed error messages and timeout management
4. **Data Processing**: Handles JSON data exchange between TypeScript and Python

### Core Python Scripts

- **`py/molecular_analyzer.py`**: Main analysis script for molecular calculations
- **`py/requirements.txt`**: Python package dependencies

### Services

1. **PythonService**: Manages Python script execution
2. **CompchemService**: Coordinates computational chemistry operations

### Configuration Schema

```typescript
{
  PYTHON_PATH: string,        // Path to Python interpreter (default: "python3")
  PYTHON_DEBUG: boolean,      // Enable debug logging (default: false)
  COMPCHEM_DATA_DIR: string   // Data directory (default: "./data")
}
```

## 📊 Data Formats

### Molecular Data Input

```json
{
  "formula": "C6H6",
  "atoms": [
    { "id": 1, "element": "C", "x": 0, "y": 0, "z": 0 },
    { "id": 2, "element": "C", "x": 1.4, "y": 0, "z": 0 }
  ],
  "bonds": [
    { "from": 1, "to": 2 }
  ],
  "scf_energy": -231.5,
  "homo_lumo_gap": 5.2
}
```

### Analysis Output

```json
{
  "formula": "C6H6",
  "atom_count": 12,
  "bond_count": 12,
  "molecular_weight": 78.11,
  "success": true,
  "properties": {
    "density_estimate": 7.81,
    "complexity_score": 24,
    "stability_estimate": "stable"
  }
}
```

## 🧪 Development & Testing

### Running Tests

```bash
# Run all tests
elizaos test

# Run component tests only
elizaos test component

# Run e2e tests only
elizaos test e2e
```

### Development Mode

```bash
# Start with hot-reloading
elizaos dev

# Test Python integration
python3 py/molecular_analyzer.py '{"formula": "H2O"}' --analysis_type molecular
```

### Debugging Python Scripts

Enable debug mode:

```env
PYTHON_DEBUG=true
```

This will show detailed Python execution logs.

## 📈 Performance Considerations

- **Script Timeout**: Python scripts have a 30-second default timeout
- **Memory Usage**: Large molecular structures may require increased memory allocation
- **Package Dependencies**: Missing Python packages will show warnings but won't break functionality

## 🔮 Future Enhancements

- **cclib Integration**: Support for advanced quantum chemistry file parsing
- **3D Visualizations**: Enhanced visualization capabilities with matplotlib
- **File Processing**: Direct support for common quantum chemistry file formats (.log, .out, .fchk)
- **Batch Analysis**: Process multiple molecular structures simultaneously

## 📚 Resources

- [ElizaOS Plugin Documentation](https://elizaos.ai/docs/plugins)
- [Python Scientific Computing](https://scipy.org/)
- [Computational Chemistry](https://en.wikipedia.org/wiki/Computational_chemistry)

## 🔧 **Troubleshooting**

### **❌ "No Gaussian log file specified" Error**

If you see this error, the plugin can't find your data files. Here's how to fix it:

1. **Run diagnostics first:**
   ```
   Ask your agent: "Run diagnostics"
   ```
   This will show you:
   - Current working directory
   - Where the plugin is looking for files
   - What files are found/missing

2. **Check file locations:**
   The plugin looks for files in these locations:
   - `./data/examples/` (relative to current directory)
   - `py/` directory for Python scripts
   - Various plugin-specific paths

3. **Copy files to the correct location:**
   ```bash
   # Create directories
   mkdir -p data/examples
   mkdir -p py
   
   # Copy your log files
   cp /path/to/your/files/*.log data/examples/
   
   # Ensure Python scripts are present
   ls py/parse_gaussian_cclib.py  # Should exist
   ```

### **❌ Python Environment Issues**

1. **Check Python installation:**
   ```bash
   python3 --version
   which python3
   ```

2. **Install required packages:**
   ```bash
   pip install cclib numpy scipy matplotlib pandas
   ```

3. **Test cclib directly:**
   ```bash
   python3 -c "import cclib; print(cclib.__version__)"
   ```

### **❌ Path Resolution Issues**

The plugin automatically searches multiple locations:
- Current working directory
- Plugin directory (relative to `__dirname`)
- ElizaOS plugin directory structure

If files still aren't found:
1. Run diagnostics to see current paths
2. Copy files to the reported current working directory
3. Use absolute file paths in your requests

### **🔍 Debug Commands**

```bash
# Check current directory structure
find . -name "*.log" -o -name "*.py" | head -10

# Test Python integration directly  
python3 py/parse_gaussian_cclib.py data/examples/lactone.log '{}' --format json

# Check Python packages
python3 -c "import sys; print('\n'.join(sys.path))"
```

### **💡 Usage Examples with Troubleshooting**

#### **Parse Gaussian Files**
- "Can you parse the lactone.log Gaussian file?"
- "Analyze the TolueneEnergy.log computational chemistry file"
- "Parse this Gaussian output file: path/to/file.log"

#### **Molecular Analysis**  
- "Analyze this molecule: C6H6 benzene ring"
- "Calculate properties for molecular formula C2H2O2"
- "What are the energy characteristics of this compound?"

#### **Generate Visualizations**
- "Create a molecular structure diagram for C6H6"
- "Generate a visualization of the lactone molecule"
- "Show me the molecular structure"

#### **Diagnostics**
- "Run diagnostics to check if everything is working"
- "Debug the computational chemistry plugin"
- "Check environment and file paths"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This plugin is licensed under the MIT License.

---

**Ready to revolutionize computational chemistry with AI agents!** 🧪✨
