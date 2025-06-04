# Setup Guide

This guide will walk you through setting up the Eliza AI agent with the Gaussian Knowledge Graph plugin from scratch.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18+ (tested with v23.11.1)
- **Bun**: Latest version for package management and running
- **Python**: Version 3.8+ for Gaussian log processing
- **Git**: For cloning and version control

### Required API Keys
- **OpenRouter API Key**: For AI model access (recommended)
  - Sign up at [openrouter.ai](https://openrouter.ai)
  - Generate an API key from your dashboard

### Hardware Requirements
- **Memory**: 4GB+ RAM recommended
- **Storage**: 2GB+ free space
- **CPU**: Modern multi-core processor

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bio-xyz-hackathon/eliza-starter
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
bun install

# Install Python dependencies (if using virtual environment)
python -m venv pfos_env
source pfos_env/bin/activate  # On Windows: pfos_env\Scripts\activate
pip install -r requirements.txt  # Create this if needed
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env  # If example exists, or create new file
```

Add the following environment variables to `.env`:

```env
# OpenRouter Configuration (Recommended)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Alternative Model Providers (Optional)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Embedding Configuration
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large
USE_OPENAI_EMBEDDING=false

# Server Configuration
SERVER_PORT=3000

# Development Settings
NODE_ENV=development
LOG_LEVEL=info

# Gaussian Plugin Settings
GAUSSIAN_WATCH_DIR=./example_logs
GAUSSIAN_DATA_DIR=./data
GAUSSIAN_PYTHON_PATH=python3
```

### 4. Directory Structure Setup

Create the required directories:

```bash
# Create necessary directories
mkdir -p example_logs data py

# Verify structure
ls -la
```

Your directory structure should look like:

```
eliza-starter/
├── .env                    # Environment variables
├── src/                    # TypeScript source code
├── example_logs/          # Gaussian log files (auto-monitored)
├── data/                  # Generated knowledge graphs
├── py/                    # Python processing scripts
├── docs/                  # Documentation
├── package.json           # Node.js dependencies
└── tsconfig.json          # TypeScript configuration
```

## 🔧 Configuration Details

### Model Provider Setup

#### OpenRouter (Recommended)
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Navigate to "Keys" in your dashboard
3. Create a new API key
4. Add to your `.env` file as `OPENROUTER_API_KEY`

#### Alternative Providers
- **OpenAI**: Set `OPENAI_API_KEY` in `.env`
- **Anthropic**: Set `ANTHROPIC_API_KEY` in `.env`
- **Local Models**: Configure Ollama or other local providers

### Character Configuration

The character is defined in `src/character.ts`. Key settings:

```typescript
export const character: Character = {
    name: "Eliza",
    modelProvider: ModelProviderName.OPENROUTER,
    plugins: [gaussianKnowledgeGraphPlugin],
    clients: [Clients.DIRECT],
    // ... other settings
};
```

### Plugin Configuration

The Gaussian plugin automatically:
- Monitors `example_logs/` directory
- Processes `.log` and `.out` files
- Generates RDF knowledge graphs in `data/`
- Enables natural language queries

## 🧪 Testing the Setup

### 1. Start the Agent

```bash
bun start
```

You should see output similar to:

```
[INFO] Initializing AgentRuntime...
📖 Loading existing knowledge graph...
🔍 Found X Gaussian files to process
✅ Processed X existing files
🧠 Gaussian Knowledge Service started - monitoring example_logs/
✅ Gaussian Knowledge Plugin initialized successfully
You: 
```

### 2. Test Basic Functionality

Try these example interactions:

```
You: hi!
Agent: [Should respond naturally]

You: what can you see in my log file?
Agent: [Should discuss log file analysis]

You: how many molecules are analyzed?
Agent: [Should show statistical summary]
```

### 3. Test Gaussian Plugin

Add a Gaussian log file to `example_logs/` and try:

```
You: show me the knowledge graph stats
Agent: [Should display statistics about processed data]

You: what about HOMO-LUMO gaps?
Agent: [Should search and display relevant data]
```

## 🐛 Common Setup Issues

### Issue: "Command not found: bun"
**Solution**: Install Bun following instructions at [bun.sh](https://bun.sh)

### Issue: "Module not found" errors
**Solution**: 
```bash
rm -rf node_modules bun.lockb
bun install
```

### Issue: Python script errors
**Solution**: Ensure Python 3 is available and dependencies are installed:
```bash
python3 --version
pip install -r requirements.txt  # If requirements file exists
```

### Issue: API key errors
**Solution**: 
1. Verify API key is correct in `.env`
2. Check API key permissions and credits
3. Ensure no extra spaces or quotes in `.env`

### Issue: Port already in use
**Solution**: 
1. Change `SERVER_PORT` in `.env`
2. Or kill process using the port: `lsof -ti:3000 | xargs kill`

## 🔄 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes* | - | OpenRouter API key for model access |
| `OPENAI_API_KEY` | No | - | Alternative OpenAI API key |
| `SERVER_PORT` | No | 3000 | Port for web interface |
| `OLLAMA_EMBEDDING_MODEL` | No | mxbai-embed-large | Embedding model for text processing |
| `LOG_LEVEL` | No | info | Logging verbosity (debug, info, warn, error) |
| `GAUSSIAN_WATCH_DIR` | No | ./example_logs | Directory to monitor for Gaussian files |

*Required unless using alternative model provider

## ✅ Verification Checklist

Before proceeding, ensure:

- [ ] Node.js 18+ is installed
- [ ] Bun is installed and working
- [ ] Python 3.8+ is available
- [ ] API keys are configured in `.env`
- [ ] All directories exist (`example_logs`, `data`, `py`)
- [ ] Dependencies are installed (`bun install` completed)
- [ ] Agent starts without errors (`bun start`)
- [ ] Basic chat functionality works
- [ ] Gaussian plugin initializes successfully

## 🎯 Next Steps

Once setup is complete:
1. Read the [Plugin Overview](plugin-overview.md) to understand capabilities
2. Try the [Usage Examples](usage-examples.md)
3. Add your own Gaussian log files to `example_logs/`
4. Explore the [API Reference](api-reference.md) for advanced usage

---

*Having issues? Check the [Troubleshooting Guide](troubleshooting.md) or [FAQ](faq.md)* 