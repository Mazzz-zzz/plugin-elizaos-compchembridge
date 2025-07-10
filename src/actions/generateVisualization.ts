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
 * Action for generating molecular visualizations using Python tools
 */
export const generateVisualizationAction: Action = {
  name: 'GENERATE_MOLECULAR_VISUALIZATION',
  similes: ['VISUALIZE_MOLECULE', 'PLOT_STRUCTURE', 'MOLECULAR_VIZ', 'SHOW_MOLECULE'],
  description: 'Generates molecular visualizations and structure diagrams using Python visualization tools',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    // Check if this looks like a visualization request
    const text = message.content.text?.toLowerCase() || '';
    
    const visualizationKeywords = [
      'visualize', 'plot', 'show', 'display', 'diagram', 'structure',
      'molecular visualization', 'molecular diagram', 'plot molecule',
      'show structure', 'visualize structure', 'molecular plot'
    ];
    
    const molecularKeywords = [
      'molecule', 'molecular', 'chemical', 'structure', 'compound', 'atoms', 'bonds'
    ];
    
    const hasVisualizationKeyword = visualizationKeywords.some(keyword => text.includes(keyword));
    const hasMolecularKeyword = molecularKeywords.some(keyword => text.includes(keyword));
    
    return hasVisualizationKeyword && hasMolecularKeyword;
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
      logger.info('🎨 Generating molecular visualization...');

      // Get Python service
      const pythonService = runtime.getService<PythonService>('python-execution');
      if (!pythonService) {
        throw new Error('Python service not available');
      }

      // Check Python environment
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent: Content = {
          text: '❌ Python environment is not available. Please ensure Python 3 and required packages (numpy, matplotlib) are installed for visualizations.',
          actions: ['GENERATE_MOLECULAR_VISUALIZATION'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Extract molecular data from message or use example data
      const molecularData = extractMolecularDataFromMessage(message) || {
        formula: 'C6H6',
        name: 'Benzene',
        atoms: [
          { id: 1, element: 'C', x: 0, y: 0 },
          { id: 2, element: 'C', x: 1.4, y: 0 },
          { id: 3, element: 'C', x: 2.1, y: 1.2 },
          { id: 4, element: 'C', x: 1.4, y: 2.4 },
          { id: 5, element: 'C', x: 0, y: 2.4 },
          { id: 6, element: 'C', x: -0.7, y: 1.2 },
          { id: 7, element: 'H', x: -0.5, y: -0.9 },
          { id: 8, element: 'H', x: 1.9, y: -0.9 },
          { id: 9, element: 'H', x: 3.2, y: 1.2 },
          { id: 10, element: 'H', x: 1.9, y: 3.3 },
          { id: 11, element: 'H', x: -0.5, y: 3.3 },
          { id: 12, element: 'H', x: -1.8, y: 1.2 }
        ],
        bonds: [
          { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
          { from: 4, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 1 },
          { from: 1, to: 7 }, { from: 2, to: 8 }, { from: 3, to: 9 },
          { from: 4, to: 10 }, { from: 5, to: 11 }, { from: 6, to: 12 }
        ]
      };

      // Generate visualization data
      const visualizationResult = await pythonService.generateVisualization(molecularData);
      
      if (!visualizationResult.success && visualizationResult.error) {
        throw new Error(visualizationResult.error);
      }

      // Format the response with ASCII art representation
      let responseText = `🎨 **Molecular Visualization Generated**\n\n`;
      responseText += `**Molecule:** ${molecularData.formula} ${molecularData.name ? `(${molecularData.name})` : ''}\n`;
      responseText += `**Structure:**\n\n`;

      // Generate a simple ASCII representation
      if (visualizationResult.atoms && visualizationResult.atoms.length > 0) {
        responseText += generateASCIIStructure(visualizationResult);
        responseText += `\n\n**Atoms:** ${visualizationResult.atoms.length}\n`;
        responseText += `**Bonds:** ${molecularData.bonds ? molecularData.bonds.length : 0}\n\n`;

        // Show atom details
        responseText += `**Atom Details:**\n`;
        const elementCounts: { [key: string]: number } = {};
        visualizationResult.atoms.forEach((atom: any) => {
          elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
        });
        
        Object.entries(elementCounts).forEach(([element, count]) => {
          responseText += `• ${element}: ${count}\n`;
        });

        // Show coordinate information
        responseText += `\n**Coordinate System:** 2D Layout\n`;
        const bounds = calculateBounds(visualizationResult.atoms);
        responseText += `• X range: ${bounds.minX.toFixed(2)} to ${bounds.maxX.toFixed(2)}\n`;
        responseText += `• Y range: ${bounds.minY.toFixed(2)} to ${bounds.maxY.toFixed(2)}\n`;
      }

      if (pythonEnv.packagesMissing.includes('matplotlib')) {
        responseText += `\n**Note:** Install matplotlib for enhanced graphical visualizations: \`pip install matplotlib\``;
      }

      const responseContent: Content = {
        text: responseText,
        actions: ['GENERATE_MOLECULAR_VISUALIZATION'],
        source: message.content.source,
      };

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in molecular visualization:', error);
      
      const errorContent: Content = {
        text: `❌ Failed to generate molecular visualization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ['GENERATE_MOLECULAR_VISUALIZATION'],
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
          text: 'Can you visualize the molecular structure of benzene?',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🎨 **Molecular Visualization Generated**\n\n**Molecule:** C6H6 (Benzene)\n**Structure:**\n\n```\n    H\n    |\nH-C=C-H\n |   |\nH-C=C-H\n    |\n    H\n```\n\n**Atoms:** 12\n**Bonds:** 12\n\n**Atom Details:**\n• C: 6\n• H: 6',
          actions: ['GENERATE_MOLECULAR_VISUALIZATION'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Show me a diagram of this molecule',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '🎨 **Molecular Visualization Generated**\n\n**Molecule:** C6H6\n**Structure:**\n\n```\n       C\n     /   \\\n   C       C\n   |       |\n   C       C\n     \\   /\n       C\n```\n\n**Atoms:** 12\n**Bonds:** 12\n\n**Coordinate System:** 2D Layout\n• X range: -1.80 to 3.20\n• Y range: -0.90 to 3.30',
          actions: ['GENERATE_MOLECULAR_VISUALIZATION'],
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

/**
 * Generate a simple ASCII representation of the molecular structure
 */
function generateASCIIStructure(visualizationData: any): string {
  if (!visualizationData.atoms || visualizationData.atoms.length === 0) {
    return '```\nNo structure data available\n```';
  }

  // For now, return a simple representation
  // In a full implementation, this would generate actual ASCII art based on coordinates
  const atomCount = visualizationData.atoms.length;
  const elements = visualizationData.atoms.map((atom: any) => atom.element);
  const uniqueElements = [...new Set(elements)];

  let ascii = '```\n';
  if (atomCount <= 20) {
    // Simple linear representation for small molecules
    ascii += visualizationData.atoms.map((atom: any, index: number) => {
      const symbol = atom.element;
      const position = `(${atom.x?.toFixed(1) || '0'}, ${atom.y?.toFixed(1) || '0'})`;
      return `${symbol}${index + 1} ${position}`;
    }).join(' - ');
  } else {
    // Summary for larger molecules
    ascii += `Large molecule with ${atomCount} atoms:\n`;
    uniqueElements.forEach(element => {
      const count = elements.filter((e: string) => e === element).length;
      ascii += `${element}: ${count} atoms\n`;
    });
  }
  ascii += '\n```';

  return ascii;
}

/**
 * Calculate bounds of the molecular structure
 */
function calculateBounds(atoms: any[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (!atoms || atoms.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = atoms[0].x || 0;
  let maxX = atoms[0].x || 0;
  let minY = atoms[0].y || 0;
  let maxY = atoms[0].y || 0;

  atoms.forEach(atom => {
    const x = atom.x || 0;
    const y = atom.y || 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  return { minX, maxX, minY, maxY };
} 