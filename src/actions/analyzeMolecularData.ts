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

/**
 * Action for analyzing molecular data using Python computational chemistry tools
 */
export const analyzeMolecularDataAction: Action = {
  name: 'ANALYZE_MOLECULAR_DATA',
  similes: ['ANALYZE_MOLECULE', 'MOLECULAR_ANALYSIS', 'COMPUTE_PROPERTIES'],
  description: 'Analyzes molecular data and computes chemical properties using Python tools',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    // Check if this looks like a molecular analysis request
    const text = message.content.text?.toLowerCase() || '';
    
    const molecularKeywords = [
      'analyze molecule', 'molecular analysis', 'compute properties',
      'molecular weight', 'stability', 'energy', 'chemical properties',
      'molecular structure', 'atoms', 'bonds', 'homo lumo'
    ];
    
    return molecularKeywords.some(keyword => text.includes(keyword));
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
      logger.info('🧪 Analyzing molecular data...');

      // Get Python service
      const pythonService = runtime.getService<PythonService>('python-execution');
      if (!pythonService) {
        throw new Error('Python service not available');
      }

      // Check Python environment
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent: Content = {
          text: '❌ Python environment is not available. Please ensure Python 3 and required packages (numpy, matplotlib, scipy) are installed.',
          actions: ['ANALYZE_MOLECULAR_DATA'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Extract molecular data from message or use example data
      const molecularData = extractMolecularDataFromMessage(message) || {
        formula: 'C6H6',
        atoms: [
          { id: 1, element: 'C', x: 0, y: 0, z: 0 },
          { id: 2, element: 'C', x: 1.4, y: 0, z: 0 },
          { id: 3, element: 'C', x: 2.1, y: 1.2, z: 0 },
          { id: 4, element: 'C', x: 1.4, y: 2.4, z: 0 },
          { id: 5, element: 'C', x: 0, y: 2.4, z: 0 },
          { id: 6, element: 'C', x: -0.7, y: 1.2, z: 0 },
          { id: 7, element: 'H', x: -0.5, y: -0.9, z: 0 },
          { id: 8, element: 'H', x: 1.9, y: -0.9, z: 0 },
          { id: 9, element: 'H', x: 3.2, y: 1.2, z: 0 },
          { id: 10, element: 'H', x: 1.9, y: 3.3, z: 0 },
          { id: 11, element: 'H', x: -0.5, y: 3.3, z: 0 },
          { id: 12, element: 'H', x: -1.8, y: 1.2, z: 0 }
        ],
        bonds: [
          { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
          { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 1 },
          { from: 1, to: 7 }, { from: 2, to: 8 }, { from: 3, to: 9 },
          { from: 4, to: 10 }, { from: 5, to: 11 }, { from: 6, to: 12 }
        ],
        scf_energy: -231.5,
        homo_lumo_gap: 5.2,
        timestamp: new Date().toISOString()
      };

      // Perform molecular analysis
      const analysisResult = await pythonService.analyzeMolecularData(molecularData, 'molecular');
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Perform energy analysis if energy data is available
      let energyAnalysis = null;
      if (molecularData.scf_energy || molecularData.homo_lumo_gap) {
        energyAnalysis = await pythonService.analyzeMolecularData(molecularData, 'energy');
      }

      // Format the response
      let responseText = `🧪 **Molecular Analysis Results**\n\n`;
      responseText += `**Formula:** ${analysisResult.formula}\n`;
      responseText += `**Atom Count:** ${analysisResult.atom_count}\n`;
      responseText += `**Bond Count:** ${analysisResult.bond_count}\n`;
      responseText += `**Molecular Weight:** ${analysisResult.molecular_weight} g/mol\n\n`;

      responseText += `**Computed Properties:**\n`;
      responseText += `• Density Estimate: ${analysisResult.properties.density_estimate} g/cm³\n`;
      responseText += `• Complexity Score: ${analysisResult.properties.complexity_score}/100\n`;
      responseText += `• Stability: ${analysisResult.properties.stability_estimate}\n`;

      if (energyAnalysis && energyAnalysis.success) {
        responseText += `\n**Energy Analysis:**\n`;
        if (energyAnalysis.scf_energy) {
          responseText += `• SCF Energy: ${energyAnalysis.scf_energy} hartree\n`;
          responseText += `• Energy Classification: ${energyAnalysis.energy_classification}\n`;
        }
        if (energyAnalysis.homo_lumo_gap) {
          responseText += `• HOMO-LUMO Gap: ${energyAnalysis.homo_lumo_gap} eV\n`;
          responseText += `• Conductivity Prediction: ${energyAnalysis.conductivity_prediction}\n`;
        }
      }

      if (pythonEnv.packagesMissing.length > 0) {
        responseText += `\n**Note:** Some advanced features require additional Python packages: ${pythonEnv.packagesMissing.join(', ')}`;
      }

      const responseContent: Content = {
        text: responseText,
        actions: ['ANALYZE_MOLECULAR_DATA'],
        source: message.content.source,
      };

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in molecular data analysis:', error);
      
      const errorContent: Content = {
        text: `❌ Failed to analyze molecular data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ['ANALYZE_MOLECULAR_DATA'],
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
          text: 'Can you analyze this molecular structure and compute its properties?',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🧪 **Molecular Analysis Results**\n\n**Formula:** C6H6\n**Atom Count:** 12\n**Bond Count:** 12\n**Molecular Weight:** 78.11 g/mol\n\n**Computed Properties:**\n• Density Estimate: 7.81 g/cm³\n• Complexity Score: 24/100\n• Stability: stable',
          actions: ['ANALYZE_MOLECULAR_DATA'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'What are the chemical properties of benzene?',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🧪 **Molecular Analysis Results**\n\n**Formula:** C6H6\n**Atom Count:** 12\n**Bond Count:** 12\n**Molecular Weight:** 78.11 g/mol\n\n**Computed Properties:**\n• Density Estimate: 7.81 g/cm³\n• Complexity Score: 24/100\n• Stability: stable\n\n**Energy Analysis:**\n• SCF Energy: -231.5 hartree\n• Energy Classification: unstable\n• HOMO-LUMO Gap: 5.2 eV\n• Conductivity Prediction: insulator',
          actions: ['ANALYZE_MOLECULAR_DATA'],
        },
      },
    ],
  ],
};

/**
 * Extract molecular data from the message content
 */
function extractMolecularDataFromMessage(message: Memory): any | null {
  const text = message.content.text;
  if (!text) return null;

  // Try to extract JSON molecular data from the message
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    // If JSON parsing fails, continue with other extraction methods
  }

  // Try to extract simple molecular formula
  const formulaMatch = text.match(/([A-Z][a-z]?\d*)+/);
  if (formulaMatch) {
    return {
      formula: formulaMatch[0],
      timestamp: new Date().toISOString()
    };
  }

  return null;
} 