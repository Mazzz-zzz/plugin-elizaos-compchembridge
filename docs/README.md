# Bio-XYZ Hackathon - Eliza with Gaussian Knowledge Graph Plugin

Welcome to the documentation for the Bio-XYZ Hackathon project featuring Eliza AI agent enhanced with a custom Gaussian Knowledge Graph plugin for computational chemistry analysis.

## 📚 Documentation Overview

This documentation covers the complete setup, usage, and development of an Eliza AI agent enhanced with computational chemistry capabilities through automatic Gaussian log file processing and semantic knowledge graph generation.

## 📋 Table of Contents

### Getting Started
- [Setup Guide](setup.md) - Complete installation and configuration instructions
- [Quick Start](quick-start.md) - Get up and running in minutes
- [Configuration](configuration.md) - Environment variables and settings

### Gaussian Knowledge Graph Plugin
- [Plugin Overview](plugin-overview.md) - Architecture and features
- [Usage Examples](usage-examples.md) - Common use cases and examples
- [API Reference](api-reference.md) - Detailed action and service documentation

### Advanced Topics
- [Development Guide](development.md) - Contributing and extending the plugin
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [FAQ](faq.md) - Frequently asked questions

## 🎯 Key Features

### Eliza AI Agent
- **Natural Language Interface**: Chat with your agent using everyday language
- **Multi-Modal Support**: Text-based interactions with extensible plugin architecture
- **OpenRouter Integration**: Powered by state-of-the-art language models

### Gaussian Knowledge Graph Plugin
- **Automatic File Monitoring**: Real-time detection and processing of Gaussian log files
- **Semantic Knowledge Graph**: RDF/Turtle format for structured chemistry data
- **Natural Language Queries**: Ask questions about your computational chemistry data
- **Statistical Analysis**: Get insights into your molecular calculations

## 🚀 Quick Examples

```bash
# Start the agent
bun start

# Example conversations:
You: "How many molecules have been analyzed?"
Agent: Shows statistical summary of processed molecules

You: "What SCF energies do we have?"
Agent: Displays available SCF energy data

You: "Tell me about HOMO-LUMO gaps"
Agent: Provides HOMO-LUMO gap information from your calculations
```

## 🔧 Architecture

```
eliza-starter/
├── src/
│   ├── plugin-gaussian-kg/          # Custom Gaussian plugin
│   │   ├── actions/                 # Natural language actions
│   │   ├── services/                # Background processing services
│   │   └── types/                   # TypeScript type definitions
│   ├── character.ts                 # Agent character configuration
│   └── index.ts                     # Main application entry point
├── py/                              # Python processing scripts
├── example_logs/                    # Gaussian log files (monitored)
├── data/                           # Generated knowledge graphs
└── docs/                           # This documentation
```

## 🎓 Learning Path

1. **Start Here**: [Setup Guide](setup.md) - Get your environment ready
2. **Understand the Plugin**: [Plugin Overview](plugin-overview.md) - Learn how it works
3. **Try Examples**: [Usage Examples](usage-examples.md) - See it in action
4. **Dive Deeper**: [API Reference](api-reference.md) - Technical details
5. **Contribute**: [Development Guide](development.md) - Extend and improve

## 📞 Support

If you encounter issues or have questions:
1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Review the [FAQ](faq.md)
3. Examine the console logs for error messages
4. Ensure all dependencies are properly installed

## 🏆 Project Context

This project was developed for the Bio-XYZ Hackathon, demonstrating the integration of AI agents with computational chemistry workflows. It showcases how natural language interfaces can make complex scientific data more accessible and queryable.

---

*Last updated: January 2025* 