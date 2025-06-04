# Usage Examples

This guide provides practical examples of how to use the Gaussian Knowledge Graph plugin with your Eliza AI agent.

## 🚀 Getting Started

### Basic Interaction Flow

1. **Start the Agent**
   ```bash
   bun start
   ```

2. **Wait for Initialization**
   ```
   🧠 Gaussian Knowledge Service started - monitoring example_logs/
   ✅ Gaussian Knowledge Plugin initialized successfully
   You: 
   ```

3. **Begin Chatting**
   ```
   You: hi!
   Agent: well hello there! I was beginning to think you'd gotten lost on the way to the conversation
   ```

## 📁 Working with Gaussian Files

### Adding Files to Monitor

Simply place your Gaussian log files in the `example_logs/` directory:

```bash
# Copy your files
cp /path/to/your/calculation.log example_logs/
cp /path/to/another/optimization.out example_logs/

# The plugin will automatically detect and process them
```

Expected console output:
```
🆕 New Gaussian file detected: calculation.log
⚙️  Processing: calculation.log
✅ Added 150 triples from calculation.log
```

### Supported File Types

- **Gaussian Log Files**: `.log`
- **Gaussian Output Files**: `.out`
- **Any text file** containing Gaussian output data

## 💬 Natural Language Queries

### Statistical Queries

#### Get Overall Statistics
```
You: show me the knowledge graph stats
Agent: 📊 **Gaussian Knowledge Graph Statistics**

📁 **Storage**: 45.2 KB
🧮 **Total RDF Triples**: 1,247
🧪 **Molecules Analyzed**: 5
⚡ **SCF Energies**: 5
🔗 **HOMO-LUMO Gaps**: 3
🎵 **Vibrational Frequencies**: 8
⚛️  **Total Atoms**: 127
📄 **Files Processed**: 5
🕒 **Last Updated**: 1/2/2025, 2:30:15 PM
```

#### Count Specific Data Types
```
You: how many molecules have been analyzed?
Agent: 🔍 **Query Results for**: "how many molecules have been analyzed?"

📊 **Current Knowledge Base**:
- 🧪 **5** molecules analyzed
- ⚡ **5** SCF energies
- 🎵 **8** vibrational frequencies  
- ⚛️  **127** atoms total
```

### Energy-Related Queries

#### SCF Energies
```
You: show me SCF energies
Agent: 🔍 **Query Results for**: "show me SCF energies"

📊 **Current Knowledge Base**:
- 🧪 **5** molecules analyzed
- ⚡ **5** SCF energies
- 🎵 **8** vibrational frequencies  
- ⚛️  **127** atoms total

🎯 **Relevant Data Found**:
1. ontocompchem:hasSCFEnergy [ a ontocompchem:SCFEnergy ;
2. ontocompchem:hasValue "-154.28377" ;
3. ontocompchem:hasSCFEnergy [ a ontocompchem:SCFEnergy ;
4. ontocompchem:hasValue "-230.45892" ;
```

#### HOMO-LUMO Gap Information
```
You: what about HOMO-LUMO gaps?
Agent: 🔍 **Query Results for**: "what about HOMO-LUMO gaps?"

📊 **Current Knowledge Base**:
- 🧪 **5** molecules analyzed
- ⚡ **5** SCF energies
- 🎵 **8** vibrational frequencies  
- ⚛️  **127** atoms total

🎯 **Relevant Data Found**:
1. ontocompchem:hasHOMOLUMOGap [ a ontocompchem:HOMOLUMOGap ;
2. ontocompchem:hasValue "0.2534" ;
3. ontocompchem:hasHOMOLUMOGap [ a ontocompchem:HOMOLUMOGap ;
4. ontocompchem:hasValue "0.1892" ;
```

### Frequency and Vibrational Data

#### Vibrational Frequencies
```
You: find frequency data
Agent: I can see you have vibrational frequency data for 8 molecular systems in our knowledge base. These frequencies represent the normal modes of molecular vibration from your Gaussian calculations.

You: tell me about frequencies
Agent: 🔍 **Query Results for**: "tell me about frequencies"

🎯 **Relevant Data Found**:
1. ontocompchem:hasFrequency [ a ontocompchem:VibrationalFrequency ;
2. ontocompchem:hasValue "3156.23" ;
3. ontocompchem:hasFrequency [ a ontocompchem:VibrationalFrequency ;
4. ontocompchem:hasValue "1647.89" ;
```

### Molecular Structure Queries

#### Atomic Information
```
You: tell me about atoms
Agent: 🔍 **Query Results for**: "tell me about atoms"

📊 **Current Knowledge Base**:
- 🧪 **5** molecules analyzed
- ⚡ **5** SCF energies
- 🎵 **8** vibrational frequencies  
- ⚛️  **127** atoms total

🎯 **Relevant Data Found**:
1. cheminf:hasAtom [ a cheminf:Atom ;
2. cheminf:hasAtomicSymbol "C" ;
3. cheminf:hasAtom [ a cheminf:Atom ;
4. cheminf:hasAtomicSymbol "H" ;
```

#### Molecular Composition
```
You: what molecules do we have?
Agent: Based on the knowledge graph, I can see we have 5 molecules that have been analyzed through Gaussian calculations. These include various organic compounds with a total of 127 atoms across all structures.
```

## 🔍 Advanced Query Patterns

### Conversational Queries

#### Contextual Follow-ups
```
You: look at the gaussian log please
Agent: 🔍 **Query Results for**: "look at the gaussian log please"

[Shows summary statistics]

You: what's the largest molecule?
Agent: Looking at the atomic composition data, I can see we have molecules with varying sizes. The largest appears to have approximately 25-30 atoms based on the structural data in our knowledge graph.
```

#### Comparative Analysis
```
You: compare the energies
Agent: From the SCF energy data in our knowledge graph, I can see we have 5 different energy values ranging from approximately -154 to -230 Hartrees. These represent the electronic energies of your optimized molecular structures.
```

### Troubleshooting Queries

#### When No Data Found
```
You: show me dipole moments
Agent: 🔍 **Query Results for**: "show me dipole moments"

📊 **Current Knowledge Base**:
- 🧪 **5** molecules analyzed
- ⚡ **5** SCF energies
- 🎵 **8** vibrational frequencies  
- ⚛️  **127** atoms total

💡 No specific matches found. Try queries like:
- "How many molecules?"
- "Show me SCF energies"
- "What about HOMO-LUMO gaps?"
- "Find frequency data"
```

#### Empty Knowledge Base
```
You: show me stats
Agent: ❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized.
```

## 📝 Example Workflows

### Workflow 1: New Calculation Analysis

```bash
# 1. Add new calculation to monitoring directory
cp benzene_optimization.log example_logs/

# 2. Agent automatically processes (watch console)
# ⚙️  Processing: benzene_optimization.log
# ✅ Added 95 triples from benzene_optimization.log

# 3. Query the new data
```

```
You: what's new in the calculations?
Agent: I've just processed a new calculation file. Let me get you the updated statistics.

You: show me the latest stats
Agent: 📊 **Gaussian Knowledge Graph Statistics**

📁 **Storage**: 52.1 KB
🧮 **Total RDF Triples**: 1,342
🧪 **Molecules Analyzed**: 6
⚡ **SCF Energies**: 6
...
```

### Workflow 2: Batch Analysis

```bash
# Add multiple files
cp calculations/*.log example_logs/
cp optimizations/*.out example_logs/

# Watch the console for processing updates
# 🆕 New Gaussian file detected: molecule1.log
# 🆕 New Gaussian file detected: molecule2.log
# ...
```

```
You: how many files have been processed?
Agent: Based on the current knowledge graph statistics, we've processed 8 files containing molecular calculation data.

You: give me a summary of all the data
Agent: 📊 **Gaussian Knowledge Graph Statistics**
[Complete statistical overview]
```

### Workflow 3: Research Data Mining

```
You: find all benzene-related calculations
Agent: I can search through the knowledge graph for benzene-related data. Let me check what molecular structures we have analyzed.

You: what's the average SCF energy?
Agent: Looking at the 6 SCF energies in our dataset, I can see values ranging from -154 to -230 Hartrees. These represent different molecular systems of varying sizes.

You: which molecule has the smallest HOMO-LUMO gap?
Agent: 🔍 **Query Results for**: "which molecule has the smallest HOMO-LUMO gap?"

🎯 **Relevant Data Found**:
1. ontocompchem:hasHOMOLUMOGap [ a ontocompchem:HOMOLUMOGap ;
2. ontocompchem:hasValue "0.1892" ;
[Shows the smallest gap found]
```

## 🎯 Query Tips and Best Practices

### Effective Query Patterns

#### Use Specific Keywords
```
✅ Good: "show me SCF energies"
✅ Good: "what about HOMO-LUMO gaps?"
✅ Good: "find frequency data"

❌ Less effective: "tell me something"
❌ Less effective: "what can you do?"
```

#### Leverage Natural Language
```
✅ "How many molecules are in the database?"
✅ "What's the largest energy value?"
✅ "Show me vibrational frequencies"
✅ "Give me a summary of the calculations"
```

#### Use Statistical Queries
```
✅ "show me stats" - Comprehensive overview
✅ "knowledge graph statistics" - Detailed breakdown
✅ "how many [data type]" - Specific counts
```

### Common Query Keywords

| Category | Keywords |
|----------|----------|
| **Counting** | `how many`, `count`, `number of` |
| **Display** | `show me`, `display`, `list`, `find` |
| **Statistics** | `stats`, `statistics`, `summary`, `overview` |
| **Energy** | `SCF`, `energy`, `energies`, `electronic` |
| **Orbitals** | `HOMO`, `LUMO`, `gap`, `orbital` |
| **Vibrations** | `frequency`, `frequencies`, `vibrational`, `modes` |
| **Structure** | `atom`, `atoms`, `molecule`, `molecules`, `structure` |

## 🚫 Limitations and Workarounds

### Current Limitations

1. **Basic Text Search**: Currently uses simple string matching rather than full SPARQL
2. **Limited Data Types**: Focuses on common Gaussian outputs (SCF, frequencies, gaps)
3. **No Visualization**: Text-based responses only

### Workarounds

#### For Complex Queries
```
You: show me the data for molecule with highest energy
Agent: [May not understand complex comparative queries]

# Instead, try:
You: show me SCF energies
Agent: [Lists all energies for manual comparison]
```

#### For Specific Values
```
You: what's the exact frequency of the C-H stretch?
Agent: [May not identify specific vibrational modes]

# Instead, try:
You: find frequency data
Agent: [Lists all frequencies with values]
```

---

*Need more specific help? Check the [API Reference](api-reference.md) or [Troubleshooting Guide](troubleshooting.md)* 