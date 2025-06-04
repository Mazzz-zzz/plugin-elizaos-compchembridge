# Python Gaussian Parser

This directory contains the Python parsing component that extracts data from Gaussian 16 logfiles and converts it to RDF knowledge graphs.

## Features

- **cclib Integration**: Uses cclib for robust quantum chemistry file parsing
- **RDF Generation**: Converts parsed data to semantic triples using rdflib
- **Standard Ontologies**: Maps to OntoCompChem, CHEMINF, and PROV-O
- **CLI Interface**: Standalone command-line tool for batch processing
- **Comprehensive Testing**: Full test suite with mocked and real data

## Installation

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

## Usage

### Command Line Interface

```bash
# Parse a single file
poetry run python parse_gaussian.py path/to/calculation.log

# With metadata
poetry run python parse_gaussian.py calculation.log '{"filename": "benzene.log", "software_version": "16.C.01"}'

# Save to file
poetry run python parse_gaussian.py calculation.log '{}' --output output.ttl

# Different RDF format
poetry run python parse_gaussian.py calculation.log '{}' --format json-ld
```

### Python API

```python
from parse_gaussian import gaussian_to_dict, dict_to_graph, CalculationMetadata

# Parse Gaussian file
calc_data = gaussian_to_dict("benzene_b3lyp.log")

# Create metadata
metadata = CalculationMetadata(
    filename="benzene_b3lyp.log",
    software_version="16.C.01"
)

# Generate RDF graph
graph = dict_to_graph(calc_data, "https://example.org/calc1", metadata)

# Serialize to various formats
turtle_rdf = graph.serialize(format="turtle")
json_ld = graph.serialize(format="json-ld")
```

## Supported File Types

- `.log` - Gaussian output files
- `.out` - Gaussian output files  
- `.fchk` - Formatted checkpoint files (limited support)

## Extracted Data

| Property | Description | Ontology Mapping |
|----------|-------------|------------------|
| Method | DFT/HF method | `ontocompchem:hasComputationalMethod` |
| Basis Set | Basis set name | `ontocompchem:hasBasisSet` |
| SCF Energy | Final SCF energy | `ontocompchem:hasSCFEnergy` |
| Geometry | Molecular coordinates | `cheminf:hasMolecularStructure` |
| Frequencies | Vibrational frequencies | `ontocompchem:hasVibrationalFrequencies` |
| HOMO-LUMO Gap | Orbital energy gap | `ontocompchem:hasHOMOLUMOGap` |
| Dipole Moment | Electric dipole | `ontocompchem:hasDipoleMoment` |
| Convergence | Success/failure | `ontocompchem:hasConverged` |

## Testing

```bash
# Run all tests
poetry run pytest

# With coverage
poetry run pytest --cov=parse_gaussian

# Specific test file
poetry run pytest tests/test_parser.py

# Run tests with verbose output
poetry run pytest -v
```

## Error Handling

The parser includes robust error handling for:

- **File not found**: Graceful error with helpful message
- **Parsing failures**: Detailed error information from cclib
- **Invalid metadata**: Pydantic validation with clear errors
- **Memory issues**: Large file handling with appropriate warnings

## Dependencies

- **cclib** (>=1.8): Quantum chemistry file parsing
- **rdflib** (>=7.0): RDF graph manipulation
- **pydantic** (>=2.5): Data validation and serialization
- **numpy** (>=1.24): Numerical operations

## Development

### Code Style

```bash
# Format code
poetry run black parse_gaussian.py

# Lint code  
poetry run flake8 parse_gaussian.py

# Type checking
poetry run mypy parse_gaussian.py
```

### Adding New Features

1. **Add parsing logic** in `gaussian_to_dict()`
2. **Map to ontology** in `dict_to_graph()`
3. **Add tests** in `tests/test_parser.py`
4. **Update documentation** in this README

### Example: Adding Mulliken Charges

```python
# In gaussian_to_dict()
if hasattr(data, 'atomcharges') and 'mulliken' in data.atomcharges:
    result['mulliken_charges'] = data.atomcharges['mulliken'].tolist()

# In dict_to_graph()
if calc_data.get('mulliken_charges'):
    for i, charge in enumerate(calc_data['mulliken_charges']):
        charge_node = BNode()
        g.add((atom_nodes[i], CHEMINF.hasMullikenCharge, charge_node))
        g.add((charge_node, ONTOCOMPCHEM.hasValue, Literal(charge)))
```

## Performance

- **Small files** (<1MB): ~0.1-0.5 seconds
- **Medium files** (1-10MB): ~1-5 seconds  
- **Large files** (10-100MB): ~10-60 seconds
- **Memory usage**: ~2-3x file size for RDF generation

## Troubleshooting

### cclib Import Errors

```bash
# Ensure cclib is properly installed
poetry run python -c "import cclib; print(cclib.__version__)"

# Reinstall if needed
poetry remove cclib
poetry add cclib
```

### RDFlib Serialization Issues

```bash
# Check rdflib version
poetry run python -c "import rdflib; print(rdflib.__version__)"

# Test basic functionality
poetry run python -c "from rdflib import Graph; g = Graph(); print('OK')"
```

### Large File Memory Issues

For very large files (>1GB), consider:

- Processing in chunks
- Using streaming parsers
- Increasing system memory
- Running on cloud instances

## Contributing

See the main project README for contribution guidelines. Python-specific considerations:

- Follow PEP 8 style guidelines
- Use type hints for all functions
- Add docstrings for public APIs
- Include both unit and integration tests 