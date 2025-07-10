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

/**
 * Action for parsing Gaussian log files using cclib
 */
export const parseGaussianFileAction: Action = {
  name: 'PARSE_GAUSSIAN_FILE',
  similes: ['PARSE_GAUSSIAN', 'ANALYZE_GAUSSIAN_LOG', 'READ_GAUSSIAN_FILE'],
  description: 'Parses Gaussian computational chemistry log files using cclib to extract molecular properties and energies',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    // Check if this looks like a Gaussian file parsing request
    const text = message.content.text?.toLowerCase() || '';
    
    const gaussianKeywords = [
      'parse gaussian', 'gaussian log', 'gaussian file', '.log', '.out',
      'scf energy', 'computational chemistry', 'quantum chemistry',
      'parse log file', 'gaussian output', 'cclib', 'analyze calculation'
    ];
    
    return gaussianKeywords.some(keyword => text.includes(keyword));
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
      logger.info('🧬 Parsing Gaussian file...');

      // Get Python service
      const pythonService = runtime.getService<PythonService>('python-execution');
      if (!pythonService) {
        throw new Error('Python service not available');
      }

      // Check Python environment
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent: Content = {
          text: '❌ Python environment is not available. Please install Python 3 and required packages.',
          actions: ['PARSE_GAUSSIAN_FILE'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      if (!pythonEnv.cclibAvailable) {
        const errorContent: Content = {
          text: '❌ cclib is required for Gaussian file parsing. Please install it with: `pip install cclib`',
          actions: ['PARSE_GAUSSIAN_FILE'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Extract file path from message or use example files
      const filePath = extractFilePathFromMessage(message) || findExampleLogFile();
      
      if (!filePath) {
        const errorContent: Content = {
          text: '❌ No Gaussian log file specified. Please provide a file path or add log files to the data/examples/ directory.',
          actions: ['PARSE_GAUSSIAN_FILE'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Parse the Gaussian file
      const metadata = {
        user_request: message.content.text,
        timestamp: new Date().toISOString(),
        source: 'eliza_agent'
      };

      const parseResult = await pythonService.parseGaussianFile(filePath, metadata, 'json');
      
      if (parseResult.error) {
        throw new Error(parseResult.error);
      }

      // Format the response
      let responseText = `🧬 **Gaussian File Analysis Complete**\n\n`;
      responseText += `**File:** ${path.basename(filePath)}\n`;
      
      if (parseResult.metadata) {
        responseText += `**Parser:** cclib v${parseResult.metadata.cclib_version}\n`;
        responseText += `**Parsed:** ${new Date(parseResult.metadata.parsed_at).toLocaleString()}\n\n`;
      }

      // Basic molecular information
      if (parseResult.molecular_formula) {
        responseText += `**Molecular Formula:** ${parseResult.molecular_formula}\n`;
      }
      if (parseResult.natom) {
        responseText += `**Number of Atoms:** ${parseResult.natom}\n`;
      }
      if (parseResult.charge !== undefined) {
        responseText += `**Charge:** ${parseResult.charge}\n`;
      }
      if (parseResult.mult) {
        responseText += `**Multiplicity:** ${parseResult.mult}\n`;
      }

      // Energy information
      if (parseResult.scfenergies && parseResult.scfenergies.length > 0) {
        responseText += `\n**Energies:**\n`;
        const finalEnergy = parseResult.scfenergies[parseResult.scfenergies.length - 1];
        const finalEnergyHartree = finalEnergy / 27.211;
        responseText += `• Final SCF Energy: ${finalEnergy.toFixed(6)} eV (${finalEnergyHartree.toFixed(8)} hartree)\n`;
        
        if (parseResult.scfenergies.length > 1) {
          responseText += `• Total SCF Cycles: ${parseResult.scfenergies.length}\n`;
        }
      }

      // HOMO-LUMO gap
      if (parseResult.homo_lumo_gaps && parseResult.homo_lumo_gaps.length > 0) {
        const gap = parseResult.homo_lumo_gaps[0];
        responseText += `• HOMO-LUMO Gap: ${gap.gap_ev.toFixed(3)} eV\n`;
        responseText += `• HOMO Energy: ${gap.homo_energy_ev.toFixed(3)} eV\n`;
        responseText += `• LUMO Energy: ${gap.lumo_energy_ev.toFixed(3)} eV\n`;
      }

      // Vibrational frequencies
      if (parseResult.vibfreqs && parseResult.vibfreqs.length > 0) {
        responseText += `\n**Vibrational Analysis:**\n`;
        responseText += `• Number of Frequencies: ${parseResult.vibfreqs.length}\n`;
        
        // Show first few frequencies
        const freqsToShow = parseResult.vibfreqs.slice(0, 5);
        responseText += `• Frequencies (cm⁻¹): ${freqsToShow.map((f: number) => f.toFixed(1)).join(', ')}`;
        if (parseResult.vibfreqs.length > 5) {
          responseText += ` ... (${parseResult.vibfreqs.length - 5} more)`;
        }
        responseText += `\n`;
      }

      // Thermochemistry if available
      if (parseResult.enthalpy || parseResult.entropy || parseResult.freeenergy) {
        responseText += `\n**Thermochemistry:**\n`;
        if (parseResult.enthalpy) {
          responseText += `• Enthalpy: ${parseResult.enthalpy.toFixed(6)} hartree\n`;
        }
        if (parseResult.entropy) {
          responseText += `• Entropy: ${parseResult.entropy.toFixed(6)} cal/(mol·K)\n`;
        }
        if (parseResult.freeenergy) {
          responseText += `• Free Energy: ${parseResult.freeenergy.toFixed(6)} hartree\n`;
        }
        if (parseResult.zpve) {
          responseText += `• Zero-Point Vibrational Energy: ${parseResult.zpve.toFixed(6)} hartree\n`;
        }
      }

      // Geometry information
      if (parseResult.final_geometry) {
        responseText += `\n**Final Geometry:** ${parseResult.final_geometry.length} atoms with optimized coordinates\n`;
      }

      // Data summary
      const availableProperties = Object.keys(parseResult).filter(key => 
        !['metadata', 'error'].includes(key) && parseResult[key] != null
      );
      responseText += `\n**Available Data:** ${availableProperties.length} properties extracted\n`;
      responseText += `Properties: ${availableProperties.slice(0, 8).join(', ')}`;
      if (availableProperties.length > 8) {
        responseText += ` ... (${availableProperties.length - 8} more)`;
      }

      const responseContent: Content = {
        text: responseText,
        actions: ['PARSE_GAUSSIAN_FILE'],
        source: message.content.source,
      };

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in Gaussian file parsing:', error);
      
      const errorContent: Content = {
        text: `❌ Failed to parse Gaussian file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ['PARSE_GAUSSIAN_FILE'],
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
          text: 'Can you parse the lactone.log Gaussian file?',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🧬 **Gaussian File Analysis Complete**\n\n**File:** lactone.log\n**Parser:** cclib v1.8.1\n\n**Molecular Formula:** C3H4O2\n**Number of Atoms:** 9\n**Charge:** 0\n**Multiplicity:** 1\n\n**Energies:**\n• Final SCF Energy: -6202.856269 eV (-227.856269 hartree)\n• HOMO-LUMO Gap: 8.245 eV\n\n**Available Data:** 15 properties extracted',
          actions: ['PARSE_GAUSSIAN_FILE'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Analyze the TolueneEnergy.log computational chemistry file',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🧬 **Gaussian File Analysis Complete**\n\n**File:** TolueneEnergy.log\n**Parser:** cclib v1.8.1\n\n**Molecular Formula:** C7H8\n**Number of Atoms:** 15\n**Charge:** 0\n**Multiplicity:** 1\n\n**Energies:**\n• Final SCF Energy: -7384.636042 eV (-271.636042 hartree)\n• Total SCF Cycles: 5\n\n**Available Data:** 12 properties extracted',
          actions: ['PARSE_GAUSSIAN_FILE'],
        },
      },
    ],
  ],
};

/**
 * Extract file path from the message content
 */
function extractFilePathFromMessage(message: Memory): string | null {
  const text = message.content.text;
  if (!text) return null;

  // Look for file path patterns
  const filePatterns = [
    /(?:file:|path:)?\s*([^\s]+\.(?:log|out))/gi,
    /([^\s]+lactone\.log)/gi,
    /([^\s]+TolueneEnergy\.log)/gi,
    /([^\s]+\.(?:log|out))/gi
  ];

  for (const pattern of filePatterns) {
    const match = text.match(pattern);
    if (match) {
      let filePath = match[1] || match[0];
      
      // Clean up the path
      filePath = filePath.replace(/^(file:|path:)/i, '').trim();
      
      // If it's just a filename, look in data/examples/
      if (!filePath.includes('/') && !filePath.includes('\\')) {
        filePath = path.join(process.cwd(), 'data', 'examples', filePath);
      }
      
      return filePath;
    }
  }

  return null;
}

/**
 * Find an example log file to use for demonstration
 */
function findExampleLogFile(): string | null {
  const exampleFiles = [
    path.join(process.cwd(), 'data', 'examples', 'lactone.log'),
    path.join(process.cwd(), 'data', 'examples', 'TolueneEnergy.log')
  ];

  // Return the first file that exists
  for (const file of exampleFiles) {
    try {
      require('fs').accessSync(file);
      return file;
    } catch {
      // File doesn't exist, continue
    }
  }

  return null;
} 