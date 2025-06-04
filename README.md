# Bio-XYZ Hackathon - Eliza with Gaussian Knowledge Graph Plugin

[![Bio x AI Hackathon](https://img.shields.io/badge/Bio%20x%20AI-Hackathon-blue)](https://bio-xyz-hackathon.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Eliza OS](https://img.shields.io/badge/Eliza_OS-Compatible-purple.svg)](https://eliza.how/)

A working Eliza AI agent enhanced with a custom Gaussian Knowledge Graph plugin for computational chemistry analysis. This project demonstrates natural language interaction with quantum chemistry data through automatic file processing and semantic knowledge graphs.

## 🎯 What It Does

- **Automatic Processing**: Monitors `example_logs/` for Gaussian files and processes them automatically
- **Knowledge Graph**: Converts Gaussian output to semantic RDF triples 
- **Natural Language Queries**: Ask questions like "How many molecules?" or "Show me SCF energies"
- **Real-time Analysis**: Provides statistical summaries and data insights
- **Chemistry Intelligence**: Understands computational chemistry terminology

## 🚀 Quick Start

```bash
# Navigate to the working agent
cd eliza-starter

# Install dependencies
bun install

# Add your API key to .env
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Start the agent
bun start
```

Then add Gaussian files to `example_logs/` and chat with your agent!

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[Setup Guide](docs/setup.md)** - Complete installation instructions
- **[Quick Start](docs/quick-start.md)** - Get running in 10 minutes
- **[Plugin Overview](docs/plugin-overview.md)** - Architecture and features
- **[Usage Examples](docs/usage-examples.md)** - Example queries and workflows
- **[API Reference](docs/api-reference.md)** - Technical documentation
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[Development Guide](docs/development.md)** - Contributing and extending

## 🏗️ Project Structure

```
bio-xyz-hackathon/
├── eliza-starter/                 # 🚀 Main working agent
│   ├── src/plugin-gaussian-kg/    # Custom Gaussian plugin
│   ├── example_logs/              # Gaussian files (monitored)
│   ├── data/                     # Generated knowledge graphs
│   └── py/                       # Python processing scripts
├── docs/                         # 📚 Complete documentation
└── README.md                     # This file
```

## ✨ Features

### Working Plugin Capabilities
- **File Monitoring**: Real-time detection of new Gaussian files
- **Python Integration**: Uses cclib for parsing Gaussian output
- **RDF Generation**: Creates semantic knowledge graphs in Turtle format
- **Statistical Analysis**: Provides counts and summaries of molecular data
- **Natural Language Interface**: Query using chemistry terms and plain English

### Example Interactions
```
You: show me the knowledge graph stats
Agent: 📊 Shows comprehensive statistics

You: how many molecules have been analyzed?
Agent: 🔍 Returns molecule count and summary

You: what about HOMO-LUMO gaps?
Agent: 🎯 Displays HOMO-LUMO gap data
```

## 🧪 Science Use Cases

- **Research Data Mining**: Query across multiple calculations
- **Educational Tools**: Interactive chemistry learning
- **Progress Tracking**: Monitor computational workflows
- **Data Preservation**: Semantic storage of calculation results

## 🤝 Contributing

This is a hackathon project showcasing AI + computational chemistry integration. See the [Development Guide](docs/development.md) for technical details and extension points.

## 📞 Support

- **Documentation**: Check the [`docs/`](docs/) folder first
- **Issues**: Common problems covered in [Troubleshooting](docs/troubleshooting.md)
- **Setup Help**: Detailed instructions in [Setup Guide](docs/setup.md)

## 🏆 Bio-XYZ Hackathon

This project demonstrates the integration of AI agents with scientific computing workflows, specifically computational chemistry. It showcases how natural language interfaces can make complex scientific data more accessible and queryable.

---

**Ready to try it?** → Start with the [Quick Start Guide](docs/quick-start.md) ⚡ 