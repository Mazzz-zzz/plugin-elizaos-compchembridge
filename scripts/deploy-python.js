#!/usr/bin/env node

/**
 * Deploy Python files from plugin to ElizaOS agent directory
 * Can be run as: npm run deploy:python
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deployPythonFiles() {
  try {
    log('🚀 Deploying Python files to ElizaOS agent directory...', 'blue');
    
    // Detect if we're in ElizaOS structure
    const currentDir = process.cwd();
    const isInElizaOS = currentDir.includes('my-agent') || fs.existsSync(path.join(currentDir, '../my-agent'));
    
    let targetAgentDir;
    if (isInElizaOS) {
      // We're in the ElizaOS environment
      if (currentDir.includes('my-agent')) {
        targetAgentDir = currentDir.includes('plugin-my-compchem-plugin-v2') 
          ? path.join(currentDir, '../../../my-agent')
          : currentDir;
      } else {
        targetAgentDir = path.join(currentDir, '../my-agent');
      }
    } else {
      // Standalone plugin development - need to specify target
      const envTarget = process.env.ELIZA_AGENT_DIR;
      if (envTarget) {
        targetAgentDir = envTarget;
      } else {
        log('⚠️  Not in ElizaOS environment. Set ELIZA_AGENT_DIR env var or run from within ElizaOS.', 'yellow');
        log('   Example: ELIZA_AGENT_DIR=/path/to/my-agent npm run deploy:python', 'yellow');
        return;
      }
    }
    
    const pluginDir = path.resolve(__dirname, '..');
    const sourcePyDir = path.join(pluginDir, 'py');
    const targetPyDir = path.join(targetAgentDir, 'py');
    const targetDataDir = path.join(targetAgentDir, 'data', 'examples');
    
    log(`📁 Plugin directory: ${pluginDir}`, 'blue');
    log(`📁 Target agent directory: ${targetAgentDir}`, 'blue');
    
    // Ensure target directories exist
    if (!fs.existsSync(targetPyDir)) {
      fs.mkdirSync(targetPyDir, { recursive: true });
      log(`✅ Created directory: ${targetPyDir}`, 'green');
    }
    
    if (!fs.existsSync(targetDataDir)) {
      fs.mkdirSync(targetDataDir, { recursive: true });
      log(`✅ Created directory: ${targetDataDir}`, 'green');
    }
    
    // Deploy Python files
    const pythonFiles = [
      'parse_gaussian_cclib.py',
      'plot_gaussian_analysis.py'
    ];
    
    let deployedCount = 0;
    for (const fileName of pythonFiles) {
      const sourcePath = path.join(sourcePyDir, fileName);
      const targetPath = path.join(targetPyDir, fileName);
      
      if (fs.existsSync(sourcePath)) {
        // Check if file needs updating
        let shouldCopy = true;
        if (fs.existsSync(targetPath)) {
          const sourceStats = fs.statSync(sourcePath);
          const targetStats = fs.statSync(targetPath);
          shouldCopy = sourceStats.mtime > targetStats.mtime;
        }
        
        if (shouldCopy) {
          fs.copyFileSync(sourcePath, targetPath);
          log(`✅ Deployed: ${fileName}`, 'green');
          deployedCount++;
        } else {
          log(`⏭️  Skipped (up to date): ${fileName}`, 'yellow');
        }
      } else {
        log(`❌ Source file not found: ${sourcePath}`, 'red');
      }
    }
    
    // Deploy example data files
    const sourceDataDir = path.join(pluginDir, 'data', 'examples');
    if (fs.existsSync(sourceDataDir)) {
      const dataFiles = fs.readdirSync(sourceDataDir).filter(f => f.endsWith('.log'));
      
      for (const fileName of dataFiles) {
        const sourcePath = path.join(sourceDataDir, fileName);
        const targetPath = path.join(targetDataDir, fileName);
        
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          log(`✅ Deployed data file: ${fileName}`, 'green');
          deployedCount++;
        } else {
          log(`⏭️  Data file exists: ${fileName}`, 'yellow');
        }
      }
    }
    
    log(`🎉 Deployment complete! ${deployedCount} files processed.`, 'green');
    
    // Verify deployment
    const missingFiles = pythonFiles.filter(file => 
      !fs.existsSync(path.join(targetPyDir, file))
    );
    
    if (missingFiles.length === 0) {
      log('✅ All required Python files are now available!', 'green');
    } else {
      log(`❌ Missing files: ${missingFiles.join(', ')}`, 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployPythonFiles();
}

export default deployPythonFiles; 