# Frequently Asked Questions (FAQ)

Common questions and answers about the Gaussian Knowledge Graph plugin and Eliza AI agent.

## 🎯 General Questions

### What is the Gaussian Knowledge Graph plugin?

The plugin automatically processes Gaussian computational chemistry log files and converts them into a queryable semantic knowledge graph. This allows you to ask natural language questions about your molecular calculations, energies, and chemical data.

### What can I do with this plugin?

- **Automatic Processing**: Drop Gaussian log files into a folder and they're automatically analyzed
- **Natural Language Queries**: Ask questions like "How many molecules?" or "Show me SCF energies"
- **Statistical Analysis**: Get summaries of your computational chemistry data
- **Knowledge Preservation**: Build a persistent database of your calculations

### What file formats are supported?

- **Gaussian Log Files**: `.log` extension
- **Gaussian Output Files**: `.out` extension
- **Any text file** containing Gaussian calculation output

### Do I need to know RDF or semantic web technologies?

No! The plugin handles all the technical RDF/semantic web details automatically. You interact with it using natural language through the AI agent.

## 🔧 Technical Questions

### How does the plugin work internally?

1. **File Monitoring**: Watches `example_logs/` directory for new files
2. **Python Processing**: Calls Python scripts to parse Gaussian output
3. **RDF Generation**: Converts extracted data to semantic triples
4. **Knowledge Graph**: Stores data in `data/gaussian-knowledge-graph.ttl`
5. **Natural Language Interface**: Enables queries through the AI agent

### What data is extracted from Gaussian files?

- **Energies**: SCF energies, total energies
- **Orbital Data**: HOMO-LUMO gaps, orbital energies
- **Vibrational Data**: Frequencies, normal modes
- **Molecular Structure**: Atomic coordinates, connectivity
- **Calculation Metadata**: Methods, basis sets, convergence

### Can I add support for other quantum chemistry codes?

Yes! The plugin architecture is extensible. You would need to:
1. Create new Python parsers for your format
2. Update the file watcher to recognize new extensions
3. Add keyword recognition for new data types

### Does it work with large calculation files?

The plugin handles typical Gaussian files efficiently (up to ~100MB). For very large files or datasets:
- Processing may take longer
- Consider archiving old files periodically
- Monitor system memory usage

## 🚀 Usage Questions

### How do I add my calculation files?

Simply copy them to the `example_logs/` directory:
```bash
cp /path/to/your/calculation.log example_logs/
```

The plugin automatically detects and processes new files.

### What questions can I ask the agent?

**Statistical Queries:**
- "How many molecules have been analyzed?"
- "Show me the knowledge graph stats"
- "Give me a summary of the calculations"

**Data-Specific Queries:**
- "Show me SCF energies"
- "What about HOMO-LUMO gaps?"
- "Find frequency data"
- "Tell me about atoms"

**General Chemistry Queries:**
- "What's in my Gaussian log?"
- "What calculations do we have?"
- "Show me recent data"

### Why doesn't the agent understand my question?

The plugin recognizes specific chemistry-related keywords. Try using terms like:
- `energy`, `energies`, `SCF`
- `molecule`, `molecules`, `atom`, `atoms`
- `HOMO`, `LUMO`, `gap`
- `frequency`, `frequencies`, `vibrational`
- `stats`, `statistics`, `summary`

### Can I query specific molecules or calculations?

Currently, the plugin provides general statistics and data listings. For specific molecule queries, you can:
- Ask for general data and manually review results
- Use file names that include molecule identifiers
- Request features for more specific querying

## 🔧 Setup and Configuration

### Do I need special API keys?

Yes, you need an API key for the AI model provider:
- **OpenRouter** (recommended): Sign up at openrouter.ai
- **OpenAI**: Alternative option
- **Anthropic**: Another alternative

### Can I use local AI models instead of cloud APIs?

Yes! You can configure the agent to use:
- **Ollama**: Local model serving
- **LM Studio**: Local model interface
- **Other local providers**: See Eliza documentation

### How much does it cost to run?

**Free Options:**
- Local AI models (Ollama, etc.)
- Free tier API keys (limited usage)

**Paid Options:**
- OpenRouter: ~$0.001-0.01 per query
- OpenAI: ~$0.001-0.02 per query
- Actual costs depend on model choice and usage

### Can I run this without Python?

The current implementation uses Python for Gaussian file parsing. Alternatives:
- Pre-process files with existing Python installation
- Implement parsing in TypeScript/JavaScript
- Use Docker container with Python included

## 🔍 Troubleshooting

### The plugin isn't loading. What do I check?

1. **Verify plugin import** in `character.ts`
2. **Check initialization** in `index.ts`
3. **Look for error messages** in console output
4. **Ensure all dependencies** are installed

### Files aren't being processed automatically. Why?

1. **Check file extensions**: Must be `.log` or `.out`
2. **Verify directory**: Files must be in `example_logs/`
3. **Check permissions**: Ensure read/write access
4. **Monitor console**: Look for processing messages

### The agent says "service not available". How do I fix this?

1. **Check service initialization** in startup logs
2. **Verify Python availability**: `python3 --version`
3. **Check directory structure**: Ensure `data/` and `example_logs/` exist
4. **Restart the agent**: Sometimes fixes initialization issues

### Queries return no results. What's wrong?

1. **Check knowledge graph**: `ls -la data/gaussian-knowledge-graph.ttl`
2. **Verify file processing**: Look for "Added X triples" messages
3. **Use exact keywords**: Follow examples in documentation
4. **Check for errors**: Review console output for processing errors

## 📊 Data and Privacy

### Where is my data stored?

- **Knowledge Graph**: `data/gaussian-knowledge-graph.ttl` (local file)
- **Original Files**: Remain in `example_logs/` unchanged
- **No Cloud Storage**: All data stays on your local system

### Is my data sent to AI providers?

- **Query Text**: Natural language queries are sent to AI providers
- **Calculation Data**: Raw Gaussian data stays local
- **Statistics**: Only summary statistics may be included in AI responses

### Can I delete or modify the knowledge graph?

Yes! The knowledge graph is stored in a text file:
```bash
# View the file
cat data/gaussian-knowledge-graph.ttl

# Delete and regenerate
rm data/gaussian-knowledge-graph.ttl
# Restart agent to rebuild from files in example_logs/
```

### How do I backup my data?

```bash
# Backup everything
cp -r data/ backup_data/
cp -r example_logs/ backup_logs/

# Backup just the knowledge graph
cp data/gaussian-knowledge-graph.ttl backup_kg_$(date +%Y%m%d).ttl
```

## 🚀 Advanced Usage

### Can I integrate this with other chemistry tools?

The RDF knowledge graph format is standard and compatible with:
- **SPARQL endpoints**: For advanced querying
- **Chemistry databases**: ChEMBL, PubChem integration
- **Visualization tools**: ChemDraw, VMD, PyMOL (with adapters)
- **Analysis pipelines**: Jupyter notebooks, R scripts

### How do I extend the plugin for my specific needs?

1. **Add new data extraction**: Modify Python parsers
2. **Create custom actions**: Add specialized query handlers
3. **Extend ontology**: Include domain-specific terms
4. **Add visualization**: Create plotting or structure viewers

### Can I use this for high-throughput screening?

Yes, but consider:
- **Performance limits**: Test with your data sizes
- **Memory usage**: Monitor system resources
- **Batch processing**: May need optimization for 1000+ files
- **Storage scaling**: Large datasets may need database backend

### How do I cite this in academic work?

Since this is a hackathon project, you might cite:
- The Eliza AI framework
- The specific ontologies used (OntoCompChem, CHEMINF)
- Your own modifications and extensions
- Bio-XYZ Hackathon (if appropriate)

## 🔮 Future Development

### What features are planned?

- **SPARQL endpoint**: Direct semantic queries
- **Visualization**: Molecular structure rendering
- **Additional formats**: Support for other quantum chemistry codes
- **Machine learning**: Pattern recognition in chemical data
- **Cloud integration**: Remote processing capabilities

### How can I contribute?

- **Report issues**: Document bugs and limitations
- **Suggest features**: Share use case requirements
- **Contribute code**: Extend parsers, add visualizations
- **Share examples**: Provide test cases and examples

### Will this work with future versions of Eliza?

The plugin is designed to be compatible with the Eliza plugin architecture. Updates may be needed for:
- **API changes**: Service and action interfaces
- **Type definitions**: TypeScript interface updates
- **Dependencies**: Node.js and package updates

---

*Have a question not covered here? Check the [Troubleshooting Guide](troubleshooting.md) or review the [API Reference](api-reference.md) for technical details.* 