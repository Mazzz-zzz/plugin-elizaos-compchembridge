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
import { imageService } from '../services/imageServingService';
import { promises as fs } from 'fs';
import * as path from 'path';

export const generateReportAction: Action = {
  name: 'GENERATE_COMPREHENSIVE_REPORT',
  similes: [
    'GENERATE_REPORT',
    'CREATE_REPORT',
    'COMPREHENSIVE_ANALYSIS',
    'FULL_REPORT',
    'ANALYSIS_REPORT',
    'COMPLETE_ANALYSIS',
    'DETAILED_REPORT',
    'SUMMARY_REPORT'
  ],
  description: 'Generate a comprehensive analysis report with multiple visualizations, statistics, and detailed analysis from the knowledge graph data',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    
    const keywords = [
      'comprehensive report', 'full report', 'complete report', 'analysis report',
      'detailed report', 'summary report', 'generate report', 'create report',
      'comprehensive analysis', 'complete analysis', 'full analysis',
      'report', 'summary', 'overview', 'comprehensive'
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
      logger.info('Generating comprehensive analysis report');

      // Get services
      const autoService = runtime.getService<AutoKnowledgeService>('auto-knowledge');
      const pythonService = runtime.getService<PythonService>('python-execution');

      if (!autoService) {
        const errorContent: Content = {
          text: '❌ Auto knowledge service not available. Please ensure the service is running.',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      if (!pythonService) {
        const errorContent: Content = {
          text: '❌ Python service not available. Comprehensive reports require Python with matplotlib.',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Get comprehensive knowledge graph data
      const stats = await autoService.getStats();
      const energyData = await autoService.getEnergies();
      const molecularData = await autoService.getMolecularData();

      if (stats.error) {
        const errorContent: Content = {
          text: `❌ Error getting knowledge graph data: ${stats.error}`,
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      if (stats.totalFiles === 0) {
        const errorContent: Content = {
          text: '📊 No data available for report generation. Please add some Gaussian files to `data/examples/` first.',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
          source: message.content.source,
        };
        
        if (callback) await callback(errorContent);
        return errorContent;
      }

      // Prepare comprehensive data for Python script
      const reportData = prepareReportData(energyData, molecularData, stats);
      
      // Generate timestamp for unique file naming
      const timestamp = Date.now();
      
      // Create reports directory
      const reportsDir = path.join(process.cwd(), 'data', 'reports', `comprehensive-${timestamp}`);
      await fs.mkdir(reportsDir, { recursive: true });

      let responseText = '';
      let reportFiles: string[] = [];

      try {
        // Generate comprehensive report using PythonService
        const reportResult = await pythonService.generateComprehensiveReport(reportData, reportsDir);
        
        if (reportResult.success) {
          reportFiles = [
            reportResult.dashboard_path,
            ...reportResult.analysis_paths
          ].filter(Boolean);
          
          const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
          const dashboardFilename = path.basename(reportResult.dashboard_path);
          
          responseText = `📊 Comprehensive Analysis Report Generated

Dashboard: http://localhost:3000/reports/comprehensive-${timestamp}/${dashboardFilename}
Analysis Files: ${reportResult.total_files} detailed reports
Data Sources: ${stats.totalFiles} Gaussian files
Generated: ${reportResult.timestamp}

## 📋 Report Contents
✅ **Main Dashboard** - Overview with key statistics
✅ **Energy Analysis** - Detailed SCF energy trends
✅ **Molecular Analysis** - Molecular properties and formulas
✅ **File Comparison** - Cross-file analysis and completeness

## 🔍 Key Findings
${generateKeyFindings(stats, energyData, molecularData)}

Local Path: \`${path.relative(process.cwd(), reportsDir)}\``;

        } else {
          responseText = `Report Generation Failed

**Error:** ${reportResult.error || 'Unknown error'}

🔧 Check Python/matplotlib installation and data availability`;
        }
        
      } catch (error) {
        logger.error('Error generating comprehensive report:', error);
        responseText = `❌ **Report Error:** ${error.message}`;
      }

      // Keep response focused and avoid model context bloat
      const responseContent: Content = {
        text: responseText,
        actions: ['GENERATE_COMPREHENSIVE_REPORT'],
        source: message.content.source,
      };

      // Add local file paths for user reference (no attachments to avoid payload issues)
      if (reportFiles.length > 0) {
        const fileList = reportFiles.map((reportPath: string) => {
          const filename = path.basename(reportPath);
          const relativePath = path.relative(process.cwd(), reportPath);
          return `  • ${getReportTitle(filename)}: \`${relativePath}\``;
        }).join('\n');
        
        responseText += `\n\n📁 **Generated Reports:**\n${fileList}`;
        logger.info(`Generated ${reportFiles.length} report files without attachments to avoid payload issues`);
      }

      if (callback) await callback(responseContent);
      return responseContent;

    } catch (error) {
      logger.error('Error in GENERATE_COMPREHENSIVE_REPORT action:', error);
      
      const errorContent: Content = {
        text: `❌ **Comprehensive Report Error:** ${error.message}`,
        actions: ['GENERATE_COMPREHENSIVE_REPORT'],
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
          text: 'Generate a comprehensive report',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 **Comprehensive Analysis Report Generated**\n\n🎯 **Dashboard:** Generated with comprehensive analysis\n📈 **Analysis Files:** 4 detailed reports\n🧪 **Data Sources:** 2 Gaussian files\n\n## 📋 Report Contents\n✅ **Main Dashboard** - Overview with key statistics\n✅ **Energy Analysis** - Detailed SCF energy trends\n✅ **Molecular Analysis** - Molecular properties\n✅ **File Comparison** - Cross-file analysis\n\n## 🔍 Key Findings\n• 2 molecules analyzed with 15 SCF energies\n• Energy range: -154.123 to -98.456 Hartree\n• Molecular formulas: C7H6O2, C7H8\n• Atom counts: 15-15 atoms per molecule\n\n📁 **Generated Reports:**\n  • Main Dashboard: `data/reports/comprehensive-1234567890/comprehensive_dashboard.png`\n  • Energy Analysis: `data/reports/comprehensive-1234567890/detailed_energy_analysis.png`\n  • Molecular Analysis: `data/reports/comprehensive-1234567890/detailed_molecular_analysis.png`\n  • File Comparison: `data/reports/comprehensive-1234567890/file_comparison_analysis.png`',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Create a full analysis report of all the data',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 Comprehensive Analysis Report Generated\n\nDashboard: Complete overview with visualizations\nAnalysis Files: 3 detailed reports\nData Sources: 1 Gaussian file\n\nReport Contents:\n• Main Dashboard - Statistical overview\n• Energy Analysis - SCF convergence analysis\n• Molecular Analysis - Structural properties\n\nKey Findings:\n• Single molecule: C7H6O2 (lactone)\n• 8 SCF energy calculations\n• 15 atoms total\n• Energy convergence achieved\n\nPerfect for research documentation and analysis review.',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'I need a detailed summary report with charts',
        },
      },
      {
        name: '{{user2}}',
        content: {
          text: '📊 Comprehensive Analysis Report Generated\n\nDashboard: Multi-panel overview with charts\nAnalysis Files: 4 detailed visualizations\nData Sources: 2 Gaussian files analyzed\n\nReport Contents:\n• Main Dashboard - 6-panel overview\n• Energy Analysis - Distribution and trends\n• Molecular Analysis - Properties and statistics\n• File Comparison - Comparative analysis\n\nKey Findings:\n• Multiple molecular systems compared\n• Energy statistics and distributions\n• Molecular diversity analysis\n• Data completeness assessment\n\nProfessional quality charts suitable for publications.',
          actions: ['GENERATE_COMPREHENSIVE_REPORT'],
        },
      },
    ],
  ],
};

function prepareReportData(energyData: any, molecularData: any, stats: any): any {
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
    fileData: combineFileDataForReport(energyData.energiesByFile || {}, molecularData.moleculesByFile || {})
  };
}

function combineFileDataForReport(energies: any, molecules: any): any {
  const combined: any = {};
  
  // Get all unique files from both energy and molecular data
  const allFiles = new Set([...Object.keys(energies), ...Object.keys(molecules)]);
  
  for (const filename of allFiles) {
    const energyList = energies[filename] || [];
    const molecularProps = molecules[filename] || {};
    
    combined[filename] = {
      energyData: Array.isArray(energyList) ? energyList.map((e: any) => 
        typeof e === 'object' && e.hartree ? e.hartree : e
      ) : [],
      molecularData: molecularProps,
      homoLumoData: [], // Not available in V2 basic parsing
      frequencyData: [] // Not available in V2 basic parsing
    };
  }
  
  return combined;
}

function generateKeyFindings(stats: any, energyData: any, molecularData: any): string {
  const findings = [];
  
  // Basic statistics
  findings.push(`• ${stats.molecules || 0} molecules analyzed with ${stats.scfEnergies || 0} SCF energies`);
  
  // Energy analysis
  if (energyData.energiesByFile) {
    const allEnergies: number[] = [];
    Object.values(energyData.energiesByFile).forEach((energies: any) => {
      if (Array.isArray(energies)) {
        energies.forEach((e: any) => {
          const energy = typeof e === 'object' && e.hartree ? e.hartree : e;
          if (typeof energy === 'number') allEnergies.push(energy);
        });
      }
    });
    
    if (allEnergies.length > 0) {
      const minE = Math.min(...allEnergies);
      const maxE = Math.max(...allEnergies);
      findings.push(`• Energy range: ${minE.toFixed(3)} to ${maxE.toFixed(3)} Hartree`);
    }
  }
  
  // Molecular analysis
  if (molecularData.moleculesByFile) {
    const formulas = new Set<string>();
    const atomCounts: number[] = [];
    
    Object.values(molecularData.moleculesByFile).forEach((mol: any) => {
      if (mol && typeof mol === 'object') {
        if (mol.formula) formulas.add(mol.formula);
        if (mol.nAtoms) atomCounts.push(mol.nAtoms);
      }
    });
    
    if (formulas.size > 0) {
      const formulaList = Array.from(formulas).slice(0, 3).join(', ');
      findings.push(`• Molecular formulas: ${formulaList}${formulas.size > 3 ? '...' : ''}`);
    }
    
    if (atomCounts.length > 0) {
      const minAtoms = Math.min(...atomCounts);
      const maxAtoms = Math.max(...atomCounts);
      findings.push(`• Atom counts: ${minAtoms}-${maxAtoms} atoms per molecule`);
    }
  }
  
  return findings.join('\n');
}

function getReportTitle(filename: string): string {
  if (filename.includes('dashboard')) {
    return 'Main Dashboard';
  } else if (filename.includes('energy')) {
    return 'Energy Analysis';
  } else if (filename.includes('molecular')) {
    return 'Molecular Analysis';
  } else if (filename.includes('comparison')) {
    return 'File Comparison';
  } else {
    return 'Analysis Report';
  }
} 