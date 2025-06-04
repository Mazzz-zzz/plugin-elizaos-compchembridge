# Quick Start Guide

Get the Gaussian Knowledge Graph plugin up and running in under 10 minutes!

## ⚡ Prerequisites (2 minutes)

You need:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Bun** - Run: `curl -fsSL https://bun.sh/install | bash`
- **Python 3.8+** - [Download here](https://python.org/) or use your system package manager
- **OpenRouter API Key** - [Sign up here](https://openrouter.ai/) (free tier available)

## 🚀 Setup (3 minutes)

### 1. Clone and Install
```bash
# Navigate to your project
cd bio-xyz-hackathon/eliza-starter

# Install dependencies
bun install
```

### 2. Environment Configuration
Create `.env` file:
```bash
# Create environment file
touch .env
```

Add your API key:
```env
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Create Required Directories
```bash
mkdir -p example_logs data py
```

## 🧪 Test Run (2 minutes)

### Start the Agent
```bash
bun start
```

You should see:
```
🧠 Gaussian Knowledge Service started - monitoring example_logs/
✅ Gaussian Knowledge Plugin initialized successfully
You: 
```

### Test Basic Functionality
```
You: hi!
Agent: [Should respond naturally]

You: show me stats
Agent: [Should show knowledge graph statistics]
```

## 📁 Add Your Data (1 minute)

### Copy Gaussian Files
```bash
# Add your Gaussian log files
cp /path/to/your/calculation.log example_logs/

# Watch the console for processing:
# 🆕 New Gaussian file detected: calculation.log
# ⚙️  Processing: calculation.log
# ✅ Added 150 triples from calculation.log
```

## 🔍 Query Your Data (2 minutes)

Try these example queries:

### Statistical Overview
```
You: show me the knowledge graph stats
Agent: 📊 **Gaussian Knowledge Graph Statistics**
[Shows detailed statistics]
```

### Molecular Data
```
You: how many molecules have been analyzed?
Agent: [Shows molecule count and summary]

You: show me SCF energies
Agent: [Lists available SCF energy data]

You: what about HOMO-LUMO gaps?
Agent: [Shows HOMO-LUMO gap information]
```

### Chemistry-Specific Queries
```
You: find frequency data
Agent: [Shows vibrational frequency information]

You: tell me about atoms
Agent: [Shows atomic composition data]
```

## ✅ Success Checklist

Verify everything is working:

- [ ] Agent starts without errors
- [ ] Plugin initialization message appears
- [ ] Basic chat works (`hi!`)
- [ ] Statistics query works (`show me stats`)
- [ ] File processing works (add a `.log` file to `example_logs/`)
- [ ] Chemistry queries work (`show me SCF energies`)

## 🎯 Quick Tips

### Effective Queries
Use these keywords for best results:
- **Counting**: `how many`, `count`
- **Display**: `show me`, `find`, `tell me about`
- **Statistics**: `stats`, `statistics`, `summary`
- **Chemistry Terms**: `energy`, `molecule`, `HOMO`, `LUMO`, `frequency`

### File Management
```bash
# Add multiple files at once
cp calculations/*.log example_logs/

# Archive old files
mkdir archive
mv example_logs/old_*.log archive/
```

### Monitoring
```bash
# Watch file processing in real-time
tail -f console_output.log | grep "Processing\|Added"

# Check knowledge graph size
ls -lh data/gaussian-knowledge-graph.ttl
```

## 🐛 Quick Troubleshooting

### Agent Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

### No File Processing
```bash
# Check file extensions (must be .log or .out)
ls -la example_logs/

# Check Python availability
python3 --version
```

### No Query Results
```bash
# Verify knowledge graph exists
ls -la data/gaussian-knowledge-graph.ttl

# Check for processing errors in console
```

### API Key Issues
```bash
# Test your API key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models
```

## 🎯 Next Steps

Once everything is working:

1. **Add More Data**: Copy all your Gaussian files to `example_logs/`
2. **Explore Queries**: Try different chemistry-related questions
3. **Read Documentation**: Check out the [Usage Examples](usage-examples.md)
4. **Customize**: Review the [Plugin Overview](plugin-overview.md) for advanced features

## 💡 Common Use Cases

### Research Workflow
```bash
# 1. Add new calculations
cp new_calculations/*.log example_logs/

# 2. Query for insights
# "How many new molecules?"
# "Show me the latest energies"
# "What's the average HOMO-LUMO gap?"
```

### Data Mining
```bash
# 1. Bulk import
cp large_dataset/*.out example_logs/

# 2. Statistical analysis
# "Show me knowledge graph stats"
# "Find all frequency data"
# "Tell me about molecular composition"
```

### Educational Use
```bash
# 1. Add example calculations
cp textbook_examples/*.log example_logs/

# 2. Interactive learning
# "What calculations do we have?"
# "Explain these SCF energies"
# "Show me vibrational frequencies"
```

---

**🎉 Congratulations!** You now have a working AI agent that can understand and query your Gaussian computational chemistry data using natural language!

*Need more detailed information? Check the [Setup Guide](setup.md) or [API Reference](api-reference.md).* 