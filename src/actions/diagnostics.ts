import type {
  Action,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
} from '@elizaos/core';
import { logger } from '@elizaos/core';
import { PythonService } from '../services/pythonService';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Diagnostic action to help debug path and environment issues
 */
export const diagnosticsAction: Action = {
  name: 'COMPCHEM_DIAGNOSTICS',
  similes: ['DIAGNOSTICS', 'DEBUG_PATHS', 'CHECK_ENVIRONMENT', 'TROUBLESHOOT'],
  description: 'Runs diagnostic checks for the computational chemistry plugin to help debug path and environment issues',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    
    const diagnosticKeywords = [
      'diagnostic', 'debug', 'troubleshoot', 'check environment',
      'path issues', 'file not found', 'python not working'
    ];
    
    return diagnosticKeywords.some(keyword => text.includes(keyword));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: any,
    callback?: HandlerCallback,
    _responses?: Memory[]
  ) => {
    try {
      logger.info('🔍 Running computational chemistry diagnostics...');

      let responseText = '🔍 **Computational Chemistry Plugin Diagnostics**\n\n';

      // 1. Current working directory
      const currentDir = process.cwd();
      responseText += `📁 **Current Working Directory:**\n\`${currentDir}\`\n\n`;

      // 2. Check for data files
      responseText += '📊 **Data Files Check:**\n';
      const possibleDataDirs = [
        path.join(currentDir, 'data', 'examples'),
        path.join(__dirname, '..', '..', 'data', 'examples'),
        path.join(__dirname, '..', '..', '..', 'data', 'examples'),
        path.join(currentDir, 'plugins', 'my-compchem-plugin-v2', 'data', 'examples'),
        './data/examples'
      ];

      const dataFiles = ['lactone.log', 'TolueneEnergy.log'];
      let foundDataFiles = false;

      for (const dataDir of possibleDataDirs) {
        for (const filename of dataFiles) {
          const filePath = path.join(dataDir, filename);
          try {
            fs.accessSync(filePath);
            responseText += `  ✅ Found: \`${filePath}\`\n`;
            foundDataFiles = true;
          } catch {
            responseText += `  ❌ Missing: \`${filePath}\`\n`;
          }
        }
      }

      if (!foundDataFiles) {
        responseText += '\n⚠️  **No data files found!** Please ensure log files are in the data/examples/ directory.\n';
      }

      // 3. Check for Python scripts
      responseText += '\n🐍 **Python Scripts Check:**\n';
      const scriptNames = ['parse_gaussian_cclib.py', 'molecular_analyzer.py', 'plot_gaussian_analysis.py'];
      const possibleScriptDirs = [
        path.join(currentDir, 'py'),
        path.join(__dirname, '..', '..', 'py'),
        path.join(__dirname, '..', '..', '..', 'py'),
        path.join(currentDir, 'plugins', 'my-compchem-plugin-v2', 'py'),
        './py'
      ];

      let foundScripts = false;
      for (const scriptDir of possibleScriptDirs) {
        for (const scriptName of scriptNames) {
          const scriptPath = path.join(scriptDir, scriptName);
          try {
            fs.accessSync(scriptPath);
            responseText += `  ✅ Found: \`${scriptPath}\`\n`;
            foundScripts = true;
          } catch {
            responseText += `  ❌ Missing: \`${scriptPath}\`\n`;
          }
        }
      }

      if (!foundScripts) {
        responseText += '\n⚠️  **No Python scripts found!** Please ensure scripts are in the py/ directory.\n';
      }

      // 4. Python environment check
      responseText += '\n🐍 **Python Environment:**\n';
      const pythonService = runtime.getService<PythonService>('python-execution');
      if (pythonService) {
        try {
          const pythonEnv = await pythonService.checkPythonEnvironment();
          if (pythonEnv.pythonAvailable) {
            responseText += `  ✅ Python: ${pythonEnv.pythonVersion}\n`;
            if (pythonEnv.cclibAvailable) {
              responseText += `  ✅ cclib: Available\n`;
            } else {
              responseText += `  ❌ cclib: Missing (install with: pip install cclib)\n`;
            }
            
            responseText += `  📦 **Available packages:** ${pythonEnv.packagesAvailable.join(', ')}\n`;
            if (pythonEnv.packagesMissing.length > 0) {
              responseText += `  📦 **Missing packages:** ${pythonEnv.packagesMissing.join(', ')}\n`;
            }
          } else {
            responseText += `  ❌ Python: Not available\n`;
          }
        } catch (error) {
          responseText += `  ❌ Python check failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }
      } else {
        responseText += `  ❌ PythonService: Not available\n`;
      }

      // 5. Runtime settings
      responseText += '\n⚙️  **Runtime Settings:**\n';
      const pythonPath = runtime.getSetting('PYTHON_PATH');
      const pythonDebug = runtime.getSetting('PYTHON_DEBUG');
      const dataDir = runtime.getSetting('COMPCHEM_DATA_DIR');

      responseText += `  • PYTHON_PATH: ${pythonPath || 'Not set (default: python3)'}\n`;
      responseText += `  • PYTHON_DEBUG: ${pythonDebug || 'Not set (default: false)'}\n`;
      responseText += `  • COMPCHEM_DATA_DIR: ${dataDir || 'Not set (default: ./data)'}\n`;

      // 6. Plugin info
      responseText += '\n🔌 **Plugin Info:**\n';
      responseText += `  • __dirname: \`${__dirname}\`\n`;
      responseText += `  • Plugin Name: my-compchem-plugin-v2\n`;
      responseText += `  • Services: PythonService, CompchemService\n`;
      responseText += `  • Actions: PARSE_GAUSSIAN_FILE, ANALYZE_MOLECULAR_DATA, GENERATE_MOLECULAR_VISUALIZATION\n`;

      // 7. Recommendations
      responseText += '\n💡 **Recommendations:**\n';
      if (!foundDataFiles) {
        responseText += `  • Copy log files to: \`${path.join(currentDir, 'data', 'examples')}\`\n`;
      }
      if (!foundScripts) {
        responseText += `  • Copy Python scripts to: \`${path.join(currentDir, 'py')}\`\n`;
      }
      responseText += `  • Try: "Parse the lactone.log file"\n`;
      responseText += `  • Try: "Analyze molecule C6H6"\n`;

      const responseContent: Content = {
        text: responseText,
        actions: ['COMPCHEM_DIAGNOSTICS'],
        source: message.content.source,
      };

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in diagnostics:', error);
      
      const errorContent: Content = {
        text: `❌ Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ['COMPCHEM_DIAGNOSTICS'],
        source: message.content.source,
      };
      
      if (callback) await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Run diagnostics to check if everything is working',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🔍 **Computational Chemistry Plugin Diagnostics**\n\n📁 **Current Working Directory:** `/path/to/workspace`\n\n📊 **Data Files Check:**\n  ✅ Found: `/path/to/data/examples/lactone.log`\n  ✅ Found: `/path/to/data/examples/TolueneEnergy.log`\n\n🐍 **Python Environment:**\n  ✅ Python: Python 3.9.0\n  ✅ cclib: Available\n\n💡 All systems operational!',
          actions: ['COMPCHEM_DIAGNOSTICS'],
        },
      },
    ],
  ],
}; 