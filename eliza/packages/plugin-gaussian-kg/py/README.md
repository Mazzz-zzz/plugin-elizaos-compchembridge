# Gaussian Knowledge Graph Plugin - Python Components

This directory contains the Python modules for the Gaussian Knowledge Graph Plugin, providing enhanced parsing and visualization capabilities.

## Files

- `parse_gaussian_cclib.py` - Enhanced Gaussian file parser using cclib
- `plot_gaussian_analysis.py` - Matplotlib-based plotting for comprehensive reports  
- `test_plotting.py` - Test script to verify plotting functionality
- `requirements.txt` - Python dependencies

## New Matplotlib Visualization Features

The plugin now uses **Python matplotlib** instead of inline SVG generation for all charts, providing:

### 🎨 **Professional Quality Charts**
- High-resolution PNG output (300 DPI)
- Consistent styling with seaborn
- Publication-ready visualizations
- Better color schemes and typography

### 📊 **Available Chart Types**

1. **Overview Chart** - Pie chart with statistics table showing knowledge graph data distribution
2. **Energy Trend Chart** - Line plot showing SCF energy variations across calculations  
3. **Molecular Comparison Chart** - Bar chart comparing HOMO-LUMO gaps with reactivity analysis
4. **Enhanced Properties Chart** - Grid layout showing cclib property categories
5. **Frequency Analysis Chart** - Dual histogram and spectrum plot for vibrational frequencies

### 🔧 **Setup and Installation**

1. **Install Python dependencies:**
   ```bash
   cd eliza/packages/plugin-gaussian-kg/py
   pip install -r requirements.txt
   ```

2. **Test the plotting functionality:**
   ```bash
   python test_plotting.py
   ```

3. **Verify all charts work correctly:**
   ```bash
   # Test individual chart types
   python plot_gaussian_analysis.py overview '{"stats":{"molecules":5,"scfEnergies":10}}'
   python plot_gaussian_analysis.py energy_trend '{"energyData":[-76.4,-76.3,-76.5]}'
   ```

### 📈 **Usage in Reports**

The comprehensive report action automatically calls the Python plotting module:

```typescript
// TypeScript calls Python matplotlib
const chartImages = await generateReportChartsWithPython(analysisData, stats);
```

Charts are returned as base64-encoded PNG images and embedded directly in:
- Interactive HTML reports
- Chat message attachments  
- Export files

### 🎯 **Key Improvements Over SVG**

| Feature | Old (SVG) | New (Matplotlib) |
|---------|-----------|------------------|
| **Resolution** | Vector (limited styling) | 300 DPI PNG |
| **Styling** | Basic CSS | Professional seaborn themes |
| **Customization** | Manual SVG paths | Full matplotlib API |
| **Statistical Features** | Basic calculations | Advanced scipy integration |
| **Error Handling** | Limited | Comprehensive Python exceptions |
| **Extensibility** | Hard to extend | Easy Python module expansion |

### 🔬 **Technical Details**

#### Chart Generation Process:
1. TypeScript extracts data from knowledge graph
2. Data is JSON-serialized and passed to Python
3. Python matplotlib generates high-quality charts
4. Charts are base64-encoded and returned
5. TypeScript embeds charts in reports and UI

#### Python Function Interface:
```python
# All chart functions return base64-encoded PNG strings
create_overview_chart(stats, output_path=None)
create_energy_trend_chart(energy_data, output_path=None) 
create_molecular_comparison_chart(homo_lumo_data, output_path=None)
create_enhanced_properties_chart(stats, output_path=None)
create_frequency_analysis_chart(frequency_data, output_path=None)
```

#### Command Line Usage:
```bash
python plot_gaussian_analysis.py <chart_type> <data_json> [output_path]
```

### 🚀 **Benefits**

1. **Publication Quality**: Charts suitable for scientific publications
2. **Better Performance**: Faster rendering than complex SVG
3. **Enhanced Analytics**: Access to full scipy/numpy ecosystem  
4. **Easier Maintenance**: Standard matplotlib instead of custom SVG
5. **Future-Proof**: Easy to add new chart types and features
6. **Professional Appearance**: Consistent with scientific visualization standards

### 🔧 **Troubleshooting**

**If plotting fails:**
1. Check Python dependencies: `python test_plotting.py`
2. Verify matplotlib backend: Should use 'Agg' for headless operation
3. Check Python path in TypeScript: Defaults to `python3`
4. Review error logs in console output

**Common Issues:**
- **Missing dependencies**: Run `pip install -r requirements.txt`
- **Backend issues**: Set `MPLBACKEND=Agg` environment variable
- **Path issues**: Ensure Python script path is correct in TypeScript

### 📝 **Future Enhancements**

Planned improvements:
- [ ] Interactive Plotly charts for web interface
- [ ] 3D molecular structure visualizations
- [ ] Animated reaction pathway plots
- [ ] Machine learning correlation analysis
- [ ] Custom color schemes for different molecular types

### 🤝 **Contributing**

To add new chart types:
1. Add function to `plot_gaussian_analysis.py`
2. Update `test_plotting.py` with test case
3. Modify TypeScript to call new chart type
4. Update this README with documentation

---

*Enhanced visualizations powered by Python matplotlib for the ElizaOS Gaussian Knowledge Graph Plugin* 