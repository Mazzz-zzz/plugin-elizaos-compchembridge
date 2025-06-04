# CompChemBridge ElizaOS Plugin

An ElizaOS plugin that bridges computational chemistry and AI by parsing Gaussian 16 quantum chemistry logfiles into semantic knowledge graphs.

## Features

- **Parse Gaussian Files**: Automatically processes `.log` and `.out` files from Gaussian 16
- **Knowledge Graph Generation**: Converts quantum chemistry data into RDF triples using standard ontologies
- **Natural Language Queries**: Ask questions about molecular properties, energies, and calculations
- **Real-time Processing**: Monitors for new files and processes them automatically

## Installation

```bash
npm install @mazzz/elizaos-compchembridge
```

## Usage

### Add to Character Configuration

```json
{
  "name": "ChemistryAgent",
  "plugins": ["@mazzz/elizaos-compchembridge"],
  "settings": {
    "compchembridge": {
      "GAUSSIAN_PARSER_DEBUG": "true",
      "GAUSSIAN_PARSER_PYTHON_PATH": "python",
      "GAUSSIAN_PARSER_MAX_FILE_SIZE": "500"
    }
  }
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `GAUSSIAN_PARSER_DEBUG` | Enable debug logging | `false` |
| `GAUSSIAN_PARSER_PYTHON_PATH` | Path to Python executable | `python` |
| `GAUSSIAN_PARSER_MAX_FILE_SIZE` | Max file size in MB | `500` |

### Example Interactions

```
User: "Parse this Gaussian file: ./benzene_b3lyp.log"
Agent: "I'll parse that Gaussian logfile and import the quantum chemistry data into my knowledge graph."

User: "How many molecules have been analyzed?"
Agent: "I've analyzed 15 molecules with a total of 1,240 RDF triples in my knowledge graph."
```

## Actions

- **PARSE_GAUSSIAN_FILE**: Parse Gaussian logfiles into RDF knowledge graphs
- **QUERY_KNOWLEDGE_GRAPH**: Query the generated knowledge graphs using natural language

## Services

- **GaussianParserService**: Core service for file validation and parsing

## Requirements

- Python 3.7+ with `cclib` and `rdflib` packages
- Node.js 23.0+
- ElizaOS runtime

## Development

```bash
# Clone and setup
git clone https://github.com/mazzz/elizaos-compchembridge
cd elizaos-compchembridge
npm install

# Test
npm test

# Development mode
npm run dev
```

## License

MIT License - see LICENSE file for details. 