import {
  type IAgentRuntime,
  Service,
  logger,
} from '@elizaos/core';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { DeploymentService } from './deploymentService';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);

export class PythonService extends Service {
  static serviceType = 'python-execution';
  
  capabilityDescription = 'Enables the agent to execute Python scripts for molecular analysis and computational chemistry calculations';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<PythonService> {
    const service = new PythonService(runtime);
    
    // Initialize service with runtime settings
    const debugMode = runtime.getSetting('PYTHON_DEBUG') === 'true';
    const pythonPath = runtime.getSetting('PYTHON_PATH') || 'python3';
    
    if (debugMode) {
      logger.info('🐍 Python Service initialized with debug mode');
      logger.info(`   Python path: ${pythonPath}`);
    }
    
    return service;
  }

  async stop(): Promise<void> {
    logger.info('🐍 Python Service stopped');
  }

  /**
   * Execute a Python script using execFile (for simple scripts that return JSON)
   */
  async executePythonScript(
    scriptPath: string,
    args: string[] = [],
    options: { timeout?: number } = {}
  ): Promise<string> {
    try {
      const pythonInterpreter = this.runtime.getSetting('PYTHON_PATH') || 'python3';
      const absoluteScriptPath = path.resolve(scriptPath);
      
      // Verify script exists
      await fs.access(absoluteScriptPath);
      
      const { stdout } = await execFileAsync(pythonInterpreter, [absoluteScriptPath, ...args], {
        timeout: options.timeout || 30000, // 30 second default timeout
        encoding: 'utf8'
      });
      
      return stdout;
    } catch (error) {
      logger.error('Python script execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute Python script with streaming output (for long-running processes)
   */
  async executePythonScriptStreaming(
    scriptPath: string,
    args: string[] = [],
    onData?: (data: string) => void,
    onError?: (data: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonInterpreter = this.runtime.getSetting('PYTHON_PATH') || 'python3';
      const absoluteScriptPath = path.resolve(scriptPath);
      
      const pythonProcess = spawn(pythonInterpreter, [absoluteScriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (onData) onData(output);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        if (onError) onError(error);
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          logger.error(`❌ Python process failed with code ${code}: ${stderr}`);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        logger.error(`❌ Failed to start Python process: ${error}`);
        reject(error);
      });
    });
  }

  /**
   * Analyze molecular data using Python
   */
  async analyzeMolecularData(
    molecularData: any,
    analysisType: 'molecular' | 'energy' | 'visualization' = 'molecular'
  ): Promise<any> {
    try {
      // Try to find the Python script in various locations
      const possibleScriptPaths = [
        path.join(process.cwd(), 'py', 'molecular_analyzer.py'),
        path.join(__dirname, '..', '..', 'py', 'molecular_analyzer.py'),
        path.join(__dirname, '..', '..', '..', 'py', 'molecular_analyzer.py'),
        path.join(process.cwd(), 'plugins', 'my-compchem-plugin-v2', 'py', 'molecular_analyzer.py'),
        './py/molecular_analyzer.py'
      ];

      let scriptPath: string | null = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
          // Script doesn't exist at this path, continue
        }
      }

      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(', ')}`);
      }

      const dataJson = JSON.stringify(molecularData);
      
      const result = await this.executePythonScript(scriptPath, [
        dataJson,
        '--analysis_type', analysisType
      ]);
      
      return JSON.parse(result);
    } catch (error) {
      logger.error('Molecular data analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate visualization data using Python
   */
  async generateVisualization(
    molecularData: any,
    outputPath?: string
  ): Promise<any> {
    try {
      // Try to find the Python script in various locations
      const possibleScriptPaths = [
        path.join(process.cwd(), 'py', 'molecular_analyzer.py'),
        path.join(__dirname, '..', '..', 'py', 'molecular_analyzer.py'),
        path.join(__dirname, '..', '..', '..', 'py', 'molecular_analyzer.py'),
        path.join(process.cwd(), 'plugins', 'my-compchem-plugin-v2', 'py', 'molecular_analyzer.py'),
        './py/molecular_analyzer.py'
      ];

      let scriptPath: string | null = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
          // Script doesn't exist at this path, continue
        }
      }

      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(', ')}`);
      }

      const dataJson = JSON.stringify(molecularData);
      
      const args = [dataJson, '--analysis_type', 'visualization'];
      if (outputPath) {
        args.push('--output', outputPath);
      }
      
      const result = await this.executePythonScript(scriptPath, args);
      
      if (outputPath) {
        return { success: true, outputPath };
      } else {
        return JSON.parse(result);
      }
    } catch (error) {
      logger.error('Visualization generation failed:', error);
      throw error;
    }
  }

  /**
   * Parse Gaussian log files using cclib
   */
  async parseGaussianFile(
    filePath: string,
    metadata: any = {},
    outputFormat: 'json' | 'turtle' = 'json'
  ): Promise<any> {
    try {
      // Ensure Python files are deployed before attempting to use them
      await this.ensurePythonFilesDeployed();
      // Try to find the Python script in various locations
      const possibleScriptPaths = [
        path.join(process.cwd(), 'py', 'parse_gaussian_cclib.py'),
        path.join(__dirname, '..', '..', 'py', 'parse_gaussian_cclib.py'),
        path.join(__dirname, '..', '..', '..', 'py', 'parse_gaussian_cclib.py'),
        path.join(process.cwd(), 'plugins', 'my-compchem-plugin-v2', 'py', 'parse_gaussian_cclib.py'),
        './py/parse_gaussian_cclib.py'
      ];

      let scriptPath: string | null = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
          // Script doesn't exist at this path, continue
        }
      }

      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(', ')}`);
      }

      const metadataJson = JSON.stringify(metadata);
      const args = [filePath, metadataJson, '--format', outputFormat];
      
      const result = await this.executePythonScript(scriptPath, args);
      
      if (outputFormat === 'json') {
        return JSON.parse(result);
      } else {
        return { rdf: result, success: true };
      }
    } catch (error) {
      logger.error('Gaussian file parsing failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Generate analysis plots using matplotlib
   */
  async generateAnalysisPlots(
    chartType: string,
    data: any,
    outputPath?: string
  ): Promise<any> {
    try {
      // Try to find the Python script in various locations
      const possibleScriptPaths = [
        path.join(process.cwd(), 'py', 'plot_gaussian_analysis.py'),
        path.join(__dirname, '..', '..', 'py', 'plot_gaussian_analysis.py'),
        path.join(__dirname, '..', '..', '..', 'py', 'plot_gaussian_analysis.py'),
        path.join(process.cwd(), 'plugins', 'my-compchem-plugin-v2', 'py', 'plot_gaussian_analysis.py'),
        './py/plot_gaussian_analysis.py'
      ];

      let scriptPath: string | null = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
          // Script doesn't exist at this path, continue
        }
      }

      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(', ')}`);
      }

      const dataJson = JSON.stringify(data);
      const args = outputPath 
        ? [chartType, dataJson, outputPath]
        : [chartType, dataJson];
        
      const result = await this.executePythonScript(scriptPath, args);
      
      if (outputPath) {
        return { success: true, outputPath, message: result };
      } else {
        return { success: true, output: result };
      }
    } catch (error) {
      logger.error('Analysis plot generation failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Check if Python and required packages are available
   */
  async checkPythonEnvironment(): Promise<{
    pythonAvailable: boolean;
    pythonVersion?: string;
    packagesAvailable: string[];
    packagesMissing: string[];
    cclibAvailable: boolean;
  }> {
    try {
      const pythonInterpreter = this.runtime.getSetting('PYTHON_PATH') || 'python3';
      
      // Check Python version
      const { stdout: versionOutput } = await execFileAsync(pythonInterpreter, ['--version']);
      const pythonVersion = versionOutput.trim();
      
      // Check required packages including cclib
      const requiredPackages = ['numpy', 'matplotlib', 'scipy', 'pandas', 'seaborn', 'cclib'];
      const packagesAvailable: string[] = [];
      const packagesMissing: string[] = [];
      
      for (const pkg of requiredPackages) {
        try {
          await execFileAsync(pythonInterpreter, ['-c', `import ${pkg}; print(${pkg}.__version__)`]);
          packagesAvailable.push(pkg);
        } catch {
          packagesMissing.push(pkg);
        }
      }
      
      const cclibAvailable = packagesAvailable.includes('cclib');
      
      return {
        pythonAvailable: true,
        pythonVersion,
        packagesAvailable,
        packagesMissing,
        cclibAvailable
      };
    } catch (error) {
      logger.warn('Python environment check failed:', error);
      return {
        pythonAvailable: false,
        packagesAvailable: [],
        packagesMissing: ['numpy', 'matplotlib', 'scipy', 'pandas', 'seaborn', 'cclib'],
        cclibAvailable: false
      };
    }
  }

  /**
   * Ensure Python files are deployed and available
   */
  private async ensurePythonFilesDeployed(): Promise<void> {
    const deployment = DeploymentService.checkDeployment();
    if (!deployment.deployed) {
      logger.info(`🚀 Auto-deploying missing Python files: ${deployment.missing.join(', ')}`);
      try {
        await DeploymentService.deployPythonFiles();
      } catch (error) {
        logger.warn('⚠️  Auto-deployment failed:', error);
        throw new Error(`Required Python files missing: ${deployment.missing.join(', ')}`);
      }
    }
  }
} 