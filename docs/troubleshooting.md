# Troubleshooting Guide

This guide helps resolve common issues with the Gaussian Knowledge Graph plugin and Eliza AI agent setup.

## 🚨 Common Issues

### Installation and Setup Problems

#### Issue: "Command not found: bun"

**Symptoms:**
```bash
bun: command not found
```

**Solution:**
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart your terminal or reload shell
source ~/.bashrc  # or ~/.zshrc

# Verify installation
bun --version
```

**Alternative:** Use npm/yarn if Bun installation fails:
```bash
npm install
npm run start
```

#### Issue: TypeScript Compilation Errors

**Symptoms:**
```
error TS2322: Type 'X' is not assignable to type 'Y'
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solutions:**

1. **Clear build cache:**
```bash
rm -rf node_modules bun.lockb
bun install
```

2. **Check TypeScript version:**
```bash
npx tsc --version
# Should be 5.0+
```

3. **Verify tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### Issue: Python Script Errors

**Symptoms:**
```
❌ Error processing filename.log: spawn python3 ENOENT
/usr/bin/env: 'python3': No such file or directory
```

**Solutions:**

1. **Install Python 3:**
```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt update && sudo apt install python3

# Windows
# Download from python.org
```

2. **Check Python availability:**
```bash
python3 --version
which python3
```

3. **Update environment variable:**
```env
GAUSSIAN_PYTHON_PATH=/usr/bin/python3
# or wherever your Python 3 is located
```

### API and Authentication Issues

#### Issue: "Invalid API Key" or "Unauthorized"

**Symptoms:**
```
Error: 401 Unauthorized
Invalid API key provided
Rate limit exceeded
```

**Solutions:**

1. **Verify API key format:**
```env
# OpenRouter keys start with "sk-or-"
OPENROUTER_API_KEY=sk-or-v1-abc123...

# OpenAI keys start with "sk-"
OPENAI_API_KEY=sk-abc123...
```

2. **Check key permissions:**
- Log into your provider dashboard
- Verify key is active and has sufficient credits
- Check usage limits and quotas

3. **Test API key manually:**
```bash
# Test OpenRouter
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models

# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### Issue: "Model not found" or "Model access denied"

**Symptoms:**
```
Error: The model `nousresearch/hermes-3-llama-3.1-405b` does not exist
You don't have access to this model
```

**Solutions:**

1. **Check available models:**
```typescript
// In character.ts, try a different model
modelProvider: ModelProviderName.OPENAI,  // Instead of OPENROUTER
```

2. **Use fallback models:**
```env
# Try these models if premium ones fail
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENAI_MODEL=gpt-3.5-turbo
```

### Plugin-Specific Issues

#### Issue: Plugin Not Loading

**Symptoms:**
```
❌ Failed to initialize Gaussian Knowledge Plugin
Plugin 'gaussian-kg' not found
```

**Solutions:**

1. **Check plugin import:**
```typescript
// In character.ts, verify:
import gaussianKnowledgeGraphPlugin, { initializeGaussianKnowledgePlugin } from "./plugin-gaussian-kg/index.js";

export const character: Character = {
    plugins: [gaussianKnowledgeGraphPlugin],
    // ...
};
```

2. **Verify plugin registration:**
```typescript
// In index.ts, check:
const hasGaussianPlugin = character.plugins?.some(plugin => plugin.name === "gaussian-kg");
if (hasGaussianPlugin) {
    await initializeGaussianKnowledgePlugin(runtime);
}
```

3. **Check file extensions:**
- Ensure imports use `.js` extension, not `.ts`
- TypeScript files should have `.ts` extension

#### Issue: Knowledge Service Not Available

**Symptoms:**
```
❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized.
```

**Solutions:**

1. **Check service initialization:**
```bash
# Look for this in startup logs:
🧠 Gaussian Knowledge Service started - monitoring example_logs/
✅ Gaussian Knowledge Plugin initialized successfully
```

2. **Verify directories exist:**
```bash
ls -la example_logs/    # Should exist
ls -la data/           # Should exist
ls -la py/            # Should exist (if using Python parsing)
```

3. **Check file permissions:**
```bash
# Ensure write permissions for data directory
chmod 755 data/
chmod 755 example_logs/
```

#### Issue: Files Not Being Processed

**Symptoms:**
```
# No output when adding files to example_logs/
# No "🆕 New Gaussian file detected" messages
```

**Solutions:**

1. **Check file extensions:**
```bash
# Supported extensions
mv calculation.txt calculation.log
mv output.dat output.out
```

2. **Verify file watcher:**
```bash
# Test by adding a file manually
cp test.log example_logs/
# Should see immediate processing
```

3. **Check file contents:**
```bash
# Ensure files contain Gaussian output
head -20 example_logs/your_file.log
# Should contain Gaussian calculation data
```

#### Issue: Empty or Incorrect Query Results

**Symptoms:**
```
💡 No specific matches found. Try queries like:
- "How many molecules?"
- "Show me SCF energies"
```

**Solutions:**

1. **Check knowledge graph content:**
```bash
# Verify knowledge graph exists and has content
ls -la data/gaussian-knowledge-graph.ttl
head -50 data/gaussian-knowledge-graph.ttl
```

2. **Use exact keywords:**
```
❌ "Tell me about the data"
✅ "Show me SCF energies"
✅ "How many molecules?"
✅ "What about HOMO-LUMO gaps?"
```

3. **Check for processing errors:**
```bash
# Look for Python parsing errors in logs
grep "Error processing" console_output.log
```

### Performance Issues

#### Issue: Slow Query Responses

**Symptoms:**
- Queries take > 10 seconds to respond
- Agent appears to hang during queries

**Solutions:**

1. **Check knowledge graph size:**
```bash
ls -lh data/gaussian-knowledge-graph.ttl
# If > 10MB, consider optimization
```

2. **Reduce query complexity:**
```
❌ "Find all molecules with energy between -150 and -200 and HOMO-LUMO gap > 0.2"
✅ "Show me SCF energies"
```

3. **Monitor memory usage:**
```bash
# Check if system is running out of memory
top
htop
```

#### Issue: High Memory Usage

**Symptoms:**
- System becomes slow after running for hours
- Out of memory errors

**Solutions:**

1. **Restart the agent periodically:**
```bash
# Stop and restart
Ctrl+C
bun start
```

2. **Limit processed files:**
```bash
# Move old files out of example_logs/
mkdir archive/
mv example_logs/*.log archive/
```

3. **Clear knowledge graph:**
```bash
# Backup and reset knowledge graph
mv data/gaussian-knowledge-graph.ttl data/backup.ttl
# Restart agent to regenerate
```

## 🔧 Debugging Techniques

### Enable Debug Logging

```env
# Add to .env file
LOG_LEVEL=debug
NODE_ENV=development
```

### Inspect Knowledge Graph

```bash
# View recent additions
tail -100 data/gaussian-knowledge-graph.ttl

# Count triples
grep -c '\.' data/gaussian-knowledge-graph.ttl

# Search for specific data
grep -i "scfenergy" data/gaussian-knowledge-graph.ttl
```

### Test Individual Components

```typescript
// Test action validation
const testMessage = { content: { text: "show me SCF energies" } };
const isValid = await queryGaussianKnowledgeAction.validate(runtime, testMessage);
console.log("Action validates:", isValid);

// Test service directly
const service = runtime.services.get("gaussian-knowledge");
const stats = await service.getKnowledgeGraphStats();
console.log("Service stats:", stats);
```

### Monitor File Processing

```bash
# Watch for file changes
watch -n 1 'ls -la example_logs/'

# Monitor processing in real-time
tail -f console_output.log | grep "Processing\|Added\|Error"
```

## 🚩 Error Codes and Messages

### Plugin Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Property 'initialize' is missing` | Service class doesn't extend properly | Check Service class inheritance |
| `Type 'X' is not assignable to type 'ServiceType'` | Custom service type not recognized | Use manual service registration |
| `Handler callback signature mismatch` | Incorrect handler function signature | Update to use `HandlerCallback` type |

### Runtime Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `EADDRINUSE: address already in use` | Port 3000 already occupied | Change `SERVER_PORT` in `.env` |
| `ENOENT: no such file or directory` | Missing file or directory | Create required directories |
| `Permission denied` | Insufficient file permissions | Fix file permissions with `chmod` |

### API Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| `401` | Unauthorized | Check API key validity |
| `429` | Rate limit exceeded | Wait or upgrade API plan |
| `404` | Model not found | Use available model |
| `500` | Internal server error | Check API provider status |

## 🔍 Diagnostic Commands

### System Check

```bash
# Check all prerequisites
node --version          # Should be 18+
bun --version          # Should be latest
python3 --version      # Should be 3.8+
git --version          # Any recent version

# Check project structure
find . -name "*.ts" -type f | head -10
find . -name "*.log" -type f | head -5
```

### Environment Check

```bash
# Verify environment variables
echo $OPENROUTER_API_KEY | head -c 20
echo $NODE_ENV
echo $LOG_LEVEL

# Check file permissions
ls -la .env
ls -la data/
ls -la example_logs/
```

### Service Health Check

```javascript
// In browser console or Node REPL
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log);
```

## 📞 Getting Help

### Self-Diagnosis Steps

1. **Check console output** for error messages
2. **Verify all prerequisites** are installed
3. **Test with minimal configuration** (single log file)
4. **Review environment variables** for typos
5. **Check file permissions** and ownership

### Information to Gather

When seeking help, provide:

- **Operating System**: macOS, Linux, Windows version
- **Node.js version**: `node --version`
- **Bun version**: `bun --version`
- **Error messages**: Full error output
- **Configuration**: Sanitized `.env` contents
- **Log files**: Recent console output
- **File structure**: `ls -la` output

### Reset to Clean State

If all else fails, reset to a known good state:

```bash
# Backup your data
cp -r data/ data_backup/
cp -r example_logs/ example_logs_backup/

# Clean installation
rm -rf node_modules bun.lockb
rm -rf data/*
bun install

# Restart from scratch
bun start
```

---

*Still having issues? Check the [FAQ](faq.md) or review the [Setup Guide](setup.md) for additional help.* 