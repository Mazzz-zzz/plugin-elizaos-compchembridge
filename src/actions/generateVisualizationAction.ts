import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { PythonService } from '../services/pythonService';
import { AutoKnowledgeService } from '../services/autoKnowledgeService';
import { promises as fs } from 'fs';
import * as path from 'path';

export const generateVisualizationAction: Action = {
  name: 'GENERATE_VISUALIZATION',
  similes: [
    'GENERATE_CHARTS',
    'CREATE_PLOTS',
    'VISUALIZE_DATA',
    'PLOT_ANALYSIS',
    'SHOW_CHARTS',
    'CREATE_VISUALIZATIONS',
    'MAKE_PLOTS'
  ],
  description: 'Generate professional-quality visualizations and charts from the knowledge graph using Python matplotlib',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    
    const keywords = [
      'visualization', 'chart', 'plot', 'graph', 'visualize', 'charts',
      'generate visualization', 'create chart', 'show plot', 'make graph',
      'energy chart', 'frequency plot', 'molecular visualization'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
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
      logger.info('Generating visualization from knowledge graph data');

      // Get services
      const autoService = runtime.getService<AutoKnowledgeService>('auto-knowledge');
      const pythonService = runtime.getService<PythonService>('python-execution');

      if (!autoService) {
        const errorContent: Content = {
          text: '❌ Auto knowledge service not available. Please ensure the service is running.',
          actions: ['GENERATE_VISUALIZATION'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      if (!pythonService) {
        const errorContent: Content = {
          text: '❌ Python service not available. Charts require Python with matplotlib.',
          actions: ['GENERATE_VISUALIZATION'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Get knowledge graph statistics and data
      const stats = await autoService.getStats();
      const energyData = await autoService.getEnergies();
      const molecularData = await autoService.getMolecularData();

      if (stats.error) {
        const errorContent: Content = {
          text: `❌ Error getting knowledge graph data: ${stats.error}`,
          actions: ['GENERATE_VISUALIZATION'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      if (stats.totalFiles === 0) {
        const errorContent: Content = {
          text: '📊 No data available for visualization. Please add some Gaussian files to `data/examples/` first.',
          actions: ['GENERATE_VISUALIZATION'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Determine what type of chart to generate from user message
      const userQuery = message.content.text?.toLowerCase() || '';
      const chartType = detectChartType(userQuery);

      // Prepare data for Python plotting
      const plotData = prepareDataForPlotting(energyData, molecularData, stats);
      
      // Generate timestamp for unique file naming
      const timestamp = Date.now();
      
      // Create charts directory
      const chartsDir = path.join(process.cwd(), 'data', 'charts', `visualization-${timestamp}`);
      await fs.mkdir(chartsDir, { recursive: true });

      let generatedCharts: string[] = [];
      let responseText = '';

      try {
        // Generate the requested visualization using PythonService
        const chartResult = await pythonService.generateVisualization(chartType, plotData, chartsDir);
        
        if (chartResult.success && chartResult.chartPath) {
          generatedCharts.push(chartResult.chartPath);
          const mainChartPath = chartResult.chartPath;
          
          responseText = `📊 **Visualization Generated Successfully**

🎨 **Chart Type:** ${getChartTypeDisplayName(chartType)}
📁 **Location:** \`${path.relative(process.cwd(), mainChartPath)}\`
📈 **Data Points:** ${chartResult.dataPoints || 'N/A'}
🧪 **Files Analyzed:** ${stats.totalFiles}

**📋 Chart Details:**
Professional matplotlib visualization generated from knowledge graph data using Python with actual SCF energies and molecular properties.

**💡 Chart Features:**
• High-resolution PNG format (300 DPI)
• Publication-ready styling
• Color-coded data separation
• Statistical annotations
• Professional typography

**🔍 Data Summary:**
• **Total Energies:** ${Object.keys(energyData.energiesByFile || {}).reduce((sum, file) => sum + (energyData.energiesByFile[file]?.length || 0), 0)}
• **Molecules:** ${stats.molecules || 0}  
• **Files Processed:** ${stats.totalFiles}
• **Analysis Method:** Knowledge graph extraction

**📁 Generated Chart:**
• \`${path.relative(process.cwd(), chartResult.chartPath)}\`

🌐 **View Online:** http://localhost:3000/charts/visualization-${timestamp}/${path.basename(chartResult.chartPath)}

🎯 **Usage:** Perfect for research papers, presentations, and reports!`;

        } else {
          responseText = `❌ **Visualization Generation Failed**

**Error:** ${chartResult.error || 'Unknown error occurred'}

**💡 Troubleshooting:**
• Check that Python matplotlib is installed
• Ensure data contains valid numerical values
• Verify Python script can access data

**📊 Available Chart Types:**
• \`overview\` - Statistics summary
• \`energy\` - SCF energy trends  
• \`molecular\` - Molecular properties
• \`frequency\` - Vibrational analysis

**🔧 Try:** "Generate overview chart" or "Create energy visualization"`;
        }
        
      } catch (error) {
        logger.error('Error generating visualization:', error);
        responseText = `❌ **Visualization Error**

**Details:** ${error.message}

**🔧 Solutions:**
• Ensure Python and matplotlib are installed
• Check that knowledge graph contains data
• Verify file permissions for chart directory

**📁 Data Available:**
• Files: ${stats.totalFiles}
• Energies: ${energyData.totalEnergies || 0}
• Molecules: ${stats.molecules || 0}`;
      }

      const responseContent: Content = {
        text: responseText,
        actions: ['GENERATE_VISUALIZATION'],
        source: message.content.source,
        attachments: [], // Add attachments array
      };

      // Add chart attachments with public URLs for web serving
      if (generatedCharts.length > 0) {
        generatedCharts.forEach((chartPath: string, index: number) => {
          const relativePath = path.relative(process.cwd(), chartPath);
          const filename = path.basename(chartPath);
          const publicUrl = `/charts/visualization-${timestamp}/${filename}`;
          
          responseContent.attachments?.push({
            id: (Date.now() + index).toString(),
            url: publicUrl,
            title: `${getChartTypeDisplayName(chartType)} Chart`,
            source: "visualization-charts",
            description: `Generated visualization chart: ${filename}`,
            text: "",
          });
        });
      }

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in GENERATE_VISUALIZATION action:', error);
      
      const errorContent: Content = {
        text: `❌ Unexpected error generating visualization: ${error.message}`,
        actions: ['GENERATE_VISUALIZATION'],
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
          text: 'Generate a visualization of the data',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 **Visualization Generated Successfully**\n\n🎨 **Chart Type:** Overview Statistics\n📁 **Location:** `data/charts/visualization-1234567890/overview.png`\n📈 **Data Points:** 45\n🧪 **Files Analyzed:** 2\n\n**💡 Chart Features:**\n• High-resolution PNG format (300 DPI)\n• Publication-ready styling\n• Color-coded data separation',
          actions: ['GENERATE_VISUALIZATION'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Create energy plots',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 **Energy Visualization Generated**\n\n🎨 **Chart Type:** SCF Energy Trends\n📈 **Data Points:** 12 energies across 2 files\n📁 **Location:** `data/charts/visualization-1234567890/energy.png`\n\n**🔍 Analysis Shows:**\n• Energy convergence patterns\n• File-by-file comparison\n• Statistical annotations',
          actions: ['GENERATE_VISUALIZATION'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Show me charts of the molecular data',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 **Molecular Visualization Created**\n\n🎨 **Chart Type:** Molecular Properties\n🧪 **Files Analyzed:** 2\n📈 **Properties:** Atoms, formulas, charges\n📁 **Location:** `data/charts/visualization-1234567890/molecular.png`\n\n**💡 Perfect for:** Research presentations and data analysis',
          actions: ['GENERATE_VISUALIZATION'],
        },
      },
    ],
  ],
};

function detectChartType(userQuery: string): string {
  if (userQuery.includes('energy') || userQuery.includes('scf')) {
    return 'energy';
  } else if (userQuery.includes('molecular') || userQuery.includes('molecule')) {
    return 'molecular';
  } else if (userQuery.includes('frequency') || userQuery.includes('vibrational')) {
    return 'frequency';
  } else if (userQuery.includes('overview') || userQuery.includes('summary') || userQuery.includes('statistics')) {
    return 'overview';
  } else {
    // Default to overview for general visualization requests
    return 'overview';
  }
}

function getChartTypeDisplayName(chartType: string): string {
  const names = {
    'overview': 'Overview Statistics',
    'energy': 'SCF Energy Trends',
    'molecular': 'Molecular Properties',
    'frequency': 'Vibrational Analysis'
  };
  return names[chartType] || 'Custom Visualization';
}

function prepareDataForPlotting(energyData: any, molecularData: any, stats: any): any {
  return {
    stats: {
      molecules: stats.molecules || 0,
      scfEnergies: stats.scfEnergies || 0,
      frequencies: stats.frequencies || 0,
      atoms: stats.atoms || 0,
      totalFiles: stats.totalFiles || 0,
      enhanced: false // V2 uses basic parsing
    },
    energyData: energyData.energiesByFile || {},
    molecularData: molecularData.moleculesByFile || {},
    fileData: combineFileData(energyData.energiesByFile || {}, molecularData.moleculesByFile || {})
  };
}

function combineFileData(energies: any, molecules: any): any {
  const combined: any = {};
  
  // Combine energy and molecular data by file
  for (const [filename, energyList] of Object.entries(energies)) {
    combined[filename] = {
      energyData: Array.isArray(energyList) ? energyList.map((e: any) => e.hartree) : [],
      molecularData: molecules[filename] || {},
      homoLumoData: [], // Not available in V2 basic parsing
      frequencyData: [] // Not available in V2 basic parsing
    };
  }
  
  return combined;
} 