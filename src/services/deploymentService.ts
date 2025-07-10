import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@elizaos/core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DeploymentService {
  /**
   * Deploy Python files from plugin to ElizaOS agent directory
   */
  static async deployPythonFiles(): Promise<void> {
    try {
      logger.info('🚀 Deploying Python files to agent directory...');
      
      const agentDir = process.cwd(); // ElizaOS working directory
      let pluginPyDir = path.join(__dirname, '..', '..', 'py');
      const targetPyDir = path.join(agentDir, 'py');
      
      // Alternative path resolution if the standard method fails
      if (!fs.existsSync(pluginPyDir)) {
        const alternativePaths = [
          // Try relative to current working directory
          path.join(process.cwd(), '..', 'plugin-my-compchem-plugin-v2', 'py'),
          // Try relative to agent directory
          path.join(agentDir, '..', 'plugin-my-compchem-plugin-v2', 'py'),
          // Try if we're in a plugins directory structure
          path.join(agentDir, 'plugins', 'plugin-my-compchem-plugin-v2', 'py'),
          // Try absolute path construction from __dirname
          path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'plugin-my-compchem-plugin-v2', 'py'),
        ];
        
        for (const altPath of alternativePaths) {
          if (fs.existsSync(altPath)) {
            logger.info(`🔄 Using alternative path: ${altPath}`);
            pluginPyDir = altPath;
            break;
          }
        }
      }
      
      logger.info(`📁 Source directory: ${pluginPyDir}`);
      logger.info(`📁 Target directory: ${targetPyDir}`);
      
      // Ensure target directory exists
      if (!fs.existsSync(targetPyDir)) {
        fs.mkdirSync(targetPyDir, { recursive: true });
        logger.info(`📁 Created directory: ${targetPyDir}`);
      }
      
      // Files to deploy
      const filesToDeploy = [
        'parse_gaussian_cclib.py',
        'plot_gaussian_analysis.py',
        '__init__.py'
      ];
      
      for (const fileName of filesToDeploy) {
        const sourcePath = path.join(pluginPyDir, fileName);
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
            logger.info(`✅ Deployed: ${fileName}`);
          } else {
            logger.info(`⏭️  Skipped (up to date): ${fileName}`);
          }
        } else {
          logger.warn(`⚠️  Source file not found: ${sourcePath}`);
        }
      }
      
      // Deploy data files if they don't exist
      await this.deployDataFiles();
      
      logger.info('🎉 Python files deployment complete!');
      
    } catch (error) {
      logger.error('❌ Failed to deploy Python files:', error);
      throw error;
    }
  }
  
  /**
   * Deploy example data files
   */
  static async deployDataFiles(): Promise<void> {
    const agentDir = process.cwd();
    let pluginDataDir = path.join(__dirname, '..', '..', 'data', 'examples');
    const targetDataDir = path.join(agentDir, 'data', 'examples');
    
    // Alternative path resolution if the standard method fails
    if (!fs.existsSync(pluginDataDir)) {
      const alternativePaths = [
        // Try relative to current working directory
        path.join(process.cwd(), '..', 'plugin-my-compchem-plugin-v2', 'data', 'examples'),
        // Try relative to agent directory
        path.join(agentDir, '..', 'plugin-my-compchem-plugin-v2', 'data', 'examples'),
        // Try if we're in a plugins directory structure
        path.join(agentDir, 'plugins', 'plugin-my-compchem-plugin-v2', 'data', 'examples'),
        // Try absolute path construction from __dirname
        path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'plugin-my-compchem-plugin-v2', 'data', 'examples'),
      ];
      
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          logger.info(`🔄 Using alternative data path: ${altPath}`);
          pluginDataDir = altPath;
          break;
        }
      }
    }
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDataDir)) {
      fs.mkdirSync(targetDataDir, { recursive: true });
      logger.info(`📁 Created data directory: ${targetDataDir}`);
    }
    
    // Check for example data files in plugin directory
    if (fs.existsSync(pluginDataDir)) {
      const dataFiles = fs.readdirSync(pluginDataDir).filter(f => f.endsWith('.log'));
      
      for (const fileName of dataFiles) {
        const sourcePath = path.join(pluginDataDir, fileName);
        const targetPath = path.join(targetDataDir, fileName);
        
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          logger.info(`✅ Deployed data file: ${fileName}`);
        }
      }
    }
  }
  
  /**
   * Check if Python files are properly deployed
   */
  static checkDeployment(): { deployed: boolean; missing: string[] } {
    const agentDir = process.cwd();
    const targetPyDir = path.join(agentDir, 'py');
    
    const requiredFiles = [
      'parse_gaussian_cclib.py',
      'plot_gaussian_analysis.py'
    ];
    
    const missing: string[] = [];
    
    for (const fileName of requiredFiles) {
      const filePath = path.join(targetPyDir, fileName);
      if (!fs.existsSync(filePath)) {
        missing.push(fileName);
      }
    }
    
    return {
      deployed: missing.length === 0,
      missing
    };
  }
} 