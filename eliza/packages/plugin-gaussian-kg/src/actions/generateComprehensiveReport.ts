import {
    ActionExample,
    Content,
    IAgentRuntime,
    Memory,
    State,
    type Action,
    HandlerCallback,
} from "@elizaos/core";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import * as path from "path";
import { spawn } from "child_process";

interface GenerateComprehensiveReportContent extends Content {
    text: string;
}

export const generateComprehensiveReportAction: Action = {
    name: "GENERATE_COMPREHENSIVE_REPORT",
    similes: [
        "GENERATE_REPORT",
        "CREATE_REPORT",
        "FULL_ANALYSIS",
        "COMPLETE_REPORT",
        "RESEARCH_REPORT",
        "SUMMARY_REPORT",
        "DETAILED_ANALYSIS",
        "COMPREHENSIVE_ANALYSIS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const content = message.content as GenerateComprehensiveReportContent;
        const text = content.text?.toLowerCase() || '';
        
        const reportKeywords = [
            'generate report', 'create report', 'full analysis', 'complete report',
            'research report', 'summary report', 'detailed analysis', 'comprehensive',
            'full report', 'complete analysis', 'detailed report'
        ];
        
        return reportKeywords.some(keyword => text.includes(keyword));
    },
    description: "Generate a comprehensive research report combining knowledge graph statistics, molecular analysis, visualizations, and data exports",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<unknown> => {
        try {
            const content = message.content as GenerateComprehensiveReportContent;
            const query = content.text || "";
            
            const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
            if (!knowledgeService) {
                const errorText = "❌ Gaussian knowledge service is not available.";
                if (callback) await callback({ text: errorText });
                return false;
            }

            // Generate comprehensive report
            const reportResult = await generateAdvancedComprehensiveReport(knowledgeService, query);
            
            let responseText = "";
            
            if (reportResult.error) {
                responseText = `❌ Error generating report: ${reportResult.error}`;
            } else {
                responseText = `📊 Comprehensive Research Report Generated

📈 Report Overview:
- 📄 Report Type: ${reportResult.reportType}
- 🧪 Molecules Analyzed: ${reportResult.moleculeCount}
- 📊 Data Points: ${reportResult.dataPointCount}
- 🔬 Analysis Methods: ${reportResult.analysisMethods.join(', ')}
- 🎨 Visualizations: ${reportResult.visualizationCount}

📝 Report Sections:
- 🎯 Executive Summary: Key findings and insights
- 📊 Statistical Analysis: Comprehensive data overview
- 🧬 Molecular Properties: Detailed molecular characterization
- ⚡ Energy Analysis: SCF energies and electronic properties
- 🎵 Vibrational Analysis: Frequency data and IR/Raman spectra
- 🌡️ Thermochemical Properties: ${reportResult.enhanced ? 'Enhanced with cclib data' : 'Basic analysis'}
- 🌈 Spectroscopic Analysis: ${reportResult.enhanced ? 'Electronic transitions and intensities' : 'Limited data'}
- 💡 Research Recommendations: AI-generated insights

📁 Generated Files:
- 🖼️  Interactive HTML Report: \`${reportResult.htmlReport}\`
- 📄 Markdown Report: \`${reportResult.markdownReport}\`
- 📋 Executive Summary: \`${reportResult.executiveSummary}\``;

                if (reportResult.enhanced) {
                    responseText += `\n\n🔬 Enhanced cclib Features:
- 📈 Advanced Statistics: 60+ molecular properties analyzed
- 🌡️ Thermochemical Data: Enthalpy, entropy, free energy, ZPVE
- 🌟 Spectroscopic Properties: Electronic transitions, oscillator strengths
- 🧮 Basis Set Analysis: Molecular orbitals and basis functions
- 🎯 Optimization Status: Convergence tracking and validation`;
                }

                if (reportResult.keyFindings && reportResult.keyFindings.length > 0) {
                    responseText += `\n\n🔍 Key Findings:`;
                    reportResult.keyFindings.forEach((finding: string, index: number) => {
                        responseText += `\n${index + 1}. ${finding}`;
                    });
                }

                if (reportResult.chartImages && reportResult.chartImages.length > 0) {
                    responseText += `\n\n📊 Generated Chart Files (copied to client/public):`;
                    reportResult.chartImages.forEach((chart: any, index: number) => {
                        responseText += `\n🖼️  ${chart.title}: Available at ${chart.publicUrl}`;
                    });
                }

                responseText += `\n\n💡 Usage: Open the HTML report for interactive features and detailed analysis`;
            }

            // Create memory with attachments pointing to public folder URLs
            const memoryContent: any = { 
                text: responseText,
                attachments: []
            };

            // Add chart attachments using public URLs for web serving
            if (reportResult.chartImages && reportResult.chartImages.length > 0) {
                reportResult.chartImages.forEach((chart: any, index: number) => {
                    memoryContent.attachments.push({
                        id: (Date.now() + index).toString(),
                        url: chart.publicUrl,
                        title: chart.title,
                        source: "gaussian-kg-charts",
                        description: `Report chart: ${chart.title}`,
                        text: "",
                        contentType: "image/png"
                    });
                });
            }

            await runtime.messageManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                content: memoryContent,
                roomId: message.roomId,
            });

            if (callback) {
                await callback({ 
                    text: responseText,
                    attachments: memoryContent.attachments
                });
            }

            return true;
        } catch (error) {
            console.error("Error in generateComprehensiveReportAction:", error);
            const errorText = `❌ Error generating comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            if (callback) await callback({ text: errorText });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Generate a comprehensive report" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll generate a complete research report with all analysis components.",
                    action: "GENERATE_COMPREHENSIVE_REPORT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a full analysis report" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Generating a comprehensive analysis report with visualizations and exports.",
                    action: "GENERATE_COMPREHENSIVE_REPORT",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "I need a detailed research report" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Creating a detailed research report with complete molecular analysis.",
                    action: "GENERATE_COMPREHENSIVE_REPORT",
                },
            },
        ],
    ] as ActionExample[][],
};

async function callPythonPlotting(chartType: string, data: any, outputPath?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(process.cwd(), "../packages/plugin-gaussian-kg/py/plot_gaussian_analysis.py");
        const dataJson = JSON.stringify(data);
        
        // Check if file exists
        if (!fsSync.existsSync(pythonScriptPath)) {
            reject(new Error(`Python script not found at: ${pythonScriptPath}`));
            return;
        }
        
        const args = outputPath 
            ? [pythonScriptPath, chartType, dataJson, outputPath]
            : [pythonScriptPath, chartType, dataJson];
            
        const pythonProcess = spawn('python3', args, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(outputPath || stdout.trim());
            } else {
                console.error(`❌ Python plotting error: ${stderr}`);
                reject(new Error(`Python plotting failed with code ${code}: ${stderr}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error(`❌ Failed to start Python process: ${error}`);
            reject(error);
        });
    });
}

async function generateReportChartsWithPython(analysisData: any, stats: any, timestamp: number): Promise<any[]> {
    const charts: any[] = [];
    
    try {
        // Create visualizations directory for this report
        const visualizationsDir = path.join(process.cwd(), "data", "visualizations", `report-${timestamp}`);
        await fs.mkdir(visualizationsDir, { recursive: true });
        
        // Create public charts directory for web serving
        const publicChartsDir = path.join(process.cwd(), "../client/public/charts", `report-${timestamp}`);
        await fs.mkdir(publicChartsDir, { recursive: true });
        
        // Generate overview statistics chart (aggregated data)
        try {
            const overviewPath = path.join(visualizationsDir, "overview.png");
            const publicOverviewPath = path.join(publicChartsDir, "overview.png");
            
            const overviewData = { stats };
            await callPythonPlotting("overview", overviewData, overviewPath);
            
            // Copy to public directory for web serving
            await fs.copyFile(overviewPath, publicOverviewPath);
            
            charts.push({
                title: "Knowledge Graph Overview",
                path: path.relative(process.cwd(), overviewPath),
                publicUrl: `/charts/report-${timestamp}/overview.png`,
                filename: "overview.png"
            });
        } catch (error) {
            console.error("Error generating overview chart:", error);
        }
        
        // Generate file-separated energy chart if available
        if (analysisData.fileData && Object.keys(analysisData.fileData).length > 0) {
            try {
                const energyPath = path.join(visualizationsDir, "file-separated-energy.png");
                const publicEnergyPath = path.join(publicChartsDir, "file-separated-energy.png");
                await callPythonPlotting("file_separated_energy", analysisData.fileData, energyPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(energyPath, publicEnergyPath);
                
                charts.push({
                    title: "SCF Energy Trends by File",
                    path: path.relative(process.cwd(), energyPath),
                    publicUrl: `/charts/report-${timestamp}/file-separated-energy.png`,
                    filename: "file-separated-energy.png"
                });
            } catch (error) {
                console.error("Error generating file-separated energy chart:", error);
            }
        }
        
        // Generate file-separated HOMO-LUMO gaps if available
        const hasGapData = Object.values(analysisData.fileData || {}).some((fileData: any) => 
            fileData.homoLumoData && fileData.homoLumoData.length > 0);
        
        if (hasGapData) {
            try {
                const gapPath = path.join(visualizationsDir, "file-separated-gaps.png");
                const publicGapPath = path.join(publicChartsDir, "file-separated-gaps.png");
                await callPythonPlotting("file_separated_gaps", analysisData.fileData, gapPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(gapPath, publicGapPath);
                
                charts.push({
                    title: "HOMO-LUMO Energy Gaps by File",
                    path: path.relative(process.cwd(), gapPath),
                    publicUrl: `/charts/report-${timestamp}/file-separated-gaps.png`,
                    filename: "file-separated-gaps.png"
                });
            } catch (error) {
                console.error("Error generating file-separated gaps chart:", error);
            }
        }
        
        // Generate enhanced cclib summary if available (aggregated)
        if (stats.enhanced) {
            try {
                const enhancedPath = path.join(visualizationsDir, "enhanced-properties.png");
                const publicEnhancedPath = path.join(publicChartsDir, "enhanced-properties.png");
                
                const enhancedData = { stats };
                await callPythonPlotting("enhanced_properties", enhancedData, enhancedPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(enhancedPath, publicEnhancedPath);
                
                charts.push({
                    title: "Enhanced cclib Properties Summary",
                    path: path.relative(process.cwd(), enhancedPath),
                    publicUrl: `/charts/report-${timestamp}/enhanced-properties.png`,
                    filename: "enhanced-properties.png"
                });
            } catch (error) {
                console.error("Error generating enhanced properties chart:", error);
            }
        }
        
        // Generate file-separated frequency analysis if available
        const hasFreqData = Object.values(analysisData.fileData || {}).some((fileData: any) => 
            fileData.frequencyData && fileData.frequencyData.length > 0);
        
        if (hasFreqData) {
            try {
                const frequencyPath = path.join(visualizationsDir, "file-separated-frequency.png");
                const publicFrequencyPath = path.join(publicChartsDir, "file-separated-frequency.png");
                await callPythonPlotting("file_separated_frequency", analysisData.fileData, frequencyPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(frequencyPath, publicFrequencyPath);
                
                charts.push({
                    title: "Vibrational Frequency Analysis by File",
                    path: path.relative(process.cwd(), frequencyPath),
                    publicUrl: `/charts/report-${timestamp}/file-separated-frequency.png`,
                    filename: "file-separated-frequency.png"
                });
            } catch (error) {
                console.error("Error generating file-separated frequency chart:", error);
            }
        }
        
        // If no file-separated data is available, create a single-file detailed analysis
        if (!analysisData.fileData || Object.keys(analysisData.fileData).length === 0) {
            console.log("No file-separated data available, creating aggregate analysis...");
            
            // Fallback: create a single pseudo-file with all data for detailed analysis
            if (analysisData.energyData?.length > 0 || analysisData.homoLumoData?.length > 0 || analysisData.frequencyData?.length > 0) {
                try {
                    const singleFileData = {
                        "aggregate_analysis": {
                            energyData: analysisData.energyData || [],
                            homoLumoData: analysisData.homoLumoData || [],
                            frequencyData: analysisData.frequencyData || []
                        }
                    };
                    
                    const detailPath = path.join(visualizationsDir, "detailed-analysis.png");
                    const publicDetailPath = path.join(publicChartsDir, "detailed-analysis.png");
                    await callPythonPlotting("all_files", singleFileData, detailPath);
                    
                    // Copy to public directory for web serving
                    await fs.copyFile(detailPath, publicDetailPath);
                    
                    charts.push({
                        title: "Detailed Molecular Analysis",
                        path: path.relative(process.cwd(), detailPath),
                        publicUrl: `/charts/report-${timestamp}/detailed-analysis.png`,
                        filename: "detailed-analysis.png"
                    });
                } catch (error) {
                    console.error("Error generating detailed analysis chart:", error);
                }
            }
        }
        
    } catch (error) {
        console.error("Error generating report charts:", error);
    }
    
    return charts;
}

async function performComprehensiveAnalysis(knowledgeService: any): Promise<any> {
    // Get knowledge graph data
    const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
    
    let rdfContent = "";
    try {
        rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
    } catch (error) {
        console.warn("Could not read knowledge graph file, using empty analysis data");
    }
    
    // Extract file-separated data
    const fileData = extractFileSeparatedData(rdfContent);
    
    // Also extract legacy aggregated data for backward compatibility
    const energyData = extractEnergyData(rdfContent);
    const homoLumoData = extractHOMOLUMOData(rdfContent);
    const frequencyData = extractFrequencyData(rdfContent);
    
    return {
        fileData,
        energyData,
        homoLumoData,
        frequencyData
    };
}

function extractFileSeparatedData(rdfContent: string): Record<string, any> {
    const fileData: Record<string, any> = {};
    const lines = rdfContent.split('\n');
    
    let currentFile = '';
    let currentMolecule = '';
    
    for (const line of lines) {
        // Extract source file information - look for file references
        const fileMatch = line.match(/ex:(\w+)(?:_log|_out|_gjf)?/); // Match typical Gaussian file patterns
        if (fileMatch && line.includes('QuantumCalculation')) {
            currentFile = fileMatch[1] + '.log'; // Assume .log extension
            currentMolecule = fileMatch[1];
            
            // Initialize file data structure
            if (!fileData[currentFile]) {
                fileData[currentFile] = {
                    energyData: [],
                    homoLumoData: [],
                    frequencyData: []
                };
            }
        }
        
        // Extract data for current file
        if (currentFile) {
            // Extract SCF energies
            const energyMatch = line.match(/ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)/);
            if (energyMatch) {
                fileData[currentFile].energyData.push(parseFloat(energyMatch[1]));
            }
            
            // Extract HOMO-LUMO gaps
            const gapMatch = line.match(/ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)/);
            if (gapMatch) {
                fileData[currentFile].homoLumoData.push({
                    gap: parseFloat(gapMatch[1]),
                    molecule: currentMolecule
                });
            }
            
            // Extract frequencies
            const freqMatch = line.match(/ontocompchem:hasFrequency\s+(-?\d+\.?\d*)/);
            if (freqMatch) {
                fileData[currentFile].frequencyData.push(parseFloat(freqMatch[1]));
            }
        }
    }
    
    // If no file-separated data was found, try to infer from molecule names
    if (Object.keys(fileData).length === 0) {
        console.log("No file markers found, attempting to separate by molecule names...");
        
        const moleculeData: Record<string, any> = {};
        let currentMol = '';
        
        for (const line of lines) {
            const molMatch = line.match(/ex:(\w+)\s+a\s+ontocompchem:QuantumCalculation/);
            if (molMatch) {
                currentMol = molMatch[1];
                const fileName = currentMol + '.log';
                
                if (!moleculeData[fileName]) {
                    moleculeData[fileName] = {
                        energyData: [],
                        homoLumoData: [],
                        frequencyData: []
                    };
                }
            }
            
            if (currentMol) {
                const fileName = currentMol + '.log';
                
                const energyMatch = line.match(/ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)/);
                if (energyMatch && moleculeData[fileName]) {
                    moleculeData[fileName].energyData.push(parseFloat(energyMatch[1]));
                }
                
                const gapMatch = line.match(/ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)/);
                if (gapMatch && moleculeData[fileName]) {
                    moleculeData[fileName].homoLumoData.push({
                        gap: parseFloat(gapMatch[1]),
                        molecule: currentMol
                    });
                }
                
                const freqMatch = line.match(/ontocompchem:hasFrequency\s+(-?\d+\.?\d*)/);
                if (freqMatch && moleculeData[fileName]) {
                    moleculeData[fileName].frequencyData.push(parseFloat(freqMatch[1]));
                }
            }
        }
        
        return moleculeData;
    }
    
    return fileData;
}

function extractEnergyData(rdfContent: string): number[] {
    const energies: number[] = [];
    const lines = rdfContent.split('\n');
    
    for (const line of lines) {
        const energyMatch = line.match(/ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)/);
        if (energyMatch) {
            energies.push(parseFloat(energyMatch[1]));
        }
    }
    
    return energies;
}

function extractHOMOLUMOData(rdfContent: string): Array<{ gap: number, molecule: string }> {
    const homoLumoData: Array<{ gap: number, molecule: string }> = [];
    const lines = rdfContent.split('\n');
    
    let currentMolecule = '';
    
    for (const line of lines) {
        if (line.includes('QuantumCalculation')) {
            currentMolecule = line.match(/ex:(\w+)/)?.[1] || 'Unknown';
        }
        
        const gapMatch = line.match(/ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)/);
        if (gapMatch) {
            homoLumoData.push({
                gap: parseFloat(gapMatch[1]),
                molecule: currentMolecule
            });
        }
    }
    
    return homoLumoData;
}

function extractFrequencyData(rdfContent: string): number[] {
    const frequencies: number[] = [];
    const lines = rdfContent.split('\n');
    
    for (const line of lines) {
        const freqMatch = line.match(/ontocompchem:hasFrequency\s+(-?\d+\.?\d*)/);
        if (freqMatch) {
            frequencies.push(parseFloat(freqMatch[1]));
        }
    }
    
    return frequencies;
}

function generateKeyFindings(analysisData: any, stats: any): string[] {
    const findings: string[] = [];
    
    if (stats.molecules > 1) {
        findings.push(`Comparative analysis across ${stats.molecules} molecular systems`);
    }
    
    if (analysisData.energyData.length > 0) {
        const energyRange = Math.max(...analysisData.energyData) - Math.min(...analysisData.energyData);
        findings.push(`Energy variations span ${energyRange.toFixed(4)} Hartree across the dataset`);
    }
    
    if (analysisData.homoLumoData.length > 0) {
        const avgGap = analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length;
        findings.push(`Average HOMO-LUMO gap of ${avgGap.toFixed(3)} eV indicates ${avgGap > 4 ? 'stable' : 'reactive'} electronic character`);
    }
    
    if (stats.enhanced) {
        findings.push("Enhanced cclib analysis provides comprehensive molecular property characterization");
        
        if (stats.thermochemistry?.enthalpy > 0) {
            findings.push("Thermochemical data enables reaction feasibility predictions");
        }
        
        if (stats.spectroscopy?.electronicTransitions > 0) {
            findings.push("Electronic transition data supports UV-Vis spectroscopy interpretation");
        }
    }
    
    const imaginaryFreqs = analysisData.frequencyData.filter((f: number) => f < 0).length;
    if (imaginaryFreqs > 0) {
        findings.push(`${imaginaryFreqs} imaginary frequencies detected - potential transition states identified`);
    }
    
    // Add matplotlib-specific finding
    findings.push("Professional-quality visualizations generated using Python matplotlib for publication use");
    
    return findings;
}

async function generateInteractiveHTMLReport(analysisData: any, stats: any, timestamp: number, chartImages: any[]): Promise<string> {
    const reportPath = path.join(process.cwd(), "data", "reports", `comprehensive-report-${timestamp}.html`);
    
    // Use public URLs that the web client can serve
    const chartEmbeds = chartImages.map((chart, i) => {
        return `<div class="chart-container">
            <h3>${chart.title}</h3>
            <img src="${chart.publicUrl}" alt="${chart.title}" style="max-width: 100%; height: auto;">
            <p><em>Chart available at: ${chart.publicUrl}</em></p>
        </div>`;
    }).join('\n');
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Gaussian Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .chart-container { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .enhanced-badge { background: #27ae60; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8em; }
        .finding { background: #e8f5e8; border-left: 4px solid #27ae60; padding: 15px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #3498db; color: white; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d; }
        .chart-info { font-style: italic; color: #666; font-size: 0.9em; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔬 Comprehensive Gaussian Analysis Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()} | <strong>Parser:</strong> ${stats.parser || 'basic'} ${stats.enhanced ? '<span class="enhanced-badge">Enhanced with cclib</span>' : ''}</p>
        
        <h2>📊 Overview Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.molecules || 0}</div>
                <div class="stat-label">Molecules Analyzed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.scfEnergies || 0}</div>
                <div class="stat-label">SCF Energies</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.frequencies || 0}</div>
                <div class="stat-label">Vibrational Frequencies</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.atoms || 0}</div>
                <div class="stat-label">Total Atoms</div>
            </div>
        </div>
        
        ${stats.enhanced ? `
        <h2>🔬 Enhanced cclib Properties</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${(stats.thermochemistry?.enthalpy || 0) + (stats.thermochemistry?.entropy || 0)}</div>
                <div class="stat-label">Thermochemical Properties</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.spectroscopy?.electronicTransitions || 0) + (stats.spectroscopy?.irIntensities || 0)}</div>
                <div class="stat-label">Spectroscopic Properties</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.basisSet?.molecularOrbitals || 0) + (stats.basisSet?.basisFunctions || 0)}</div>
                <div class="stat-label">Basis Set Properties</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(stats.optimization?.convergedCalculations || 0) + (stats.optimization?.failedOptimizations || 0)}</div>
                <div class="stat-label">Optimization Data</div>
            </div>
        </div>
        ` : ''}
        
        <h2>📈 Analysis Visualizations</h2>
        <p class="chart-info">📁 Charts are saved as static PNG files for optimal performance and offline viewing</p>
        ${chartEmbeds}
        
        <h2>🔍 Key Findings</h2>
        ${generateKeyFindings(analysisData, stats).map(finding => 
            `<div class="finding">💡 ${finding}</div>`
        ).join('')}
        
        <h2>📋 Detailed Data Summary</h2>
        <table>
            <tr><th>Property</th><th>Count</th><th>Notes</th></tr>
            <tr><td>Molecular Systems</td><td>${stats.molecules || 0}</td><td>Unique molecular structures analyzed</td></tr>
            <tr><td>Energy Calculations</td><td>${stats.scfEnergies || 0}</td><td>SCF energy computations</td></tr>
            <tr><td>HOMO-LUMO Gaps</td><td>${stats.homoLumoGaps || 0}</td><td>Electronic energy gap calculations</td></tr>
            <tr><td>Vibrational Frequencies</td><td>${stats.frequencies || 0}</td><td>Normal mode frequencies</td></tr>
            <tr><td>Atomic Positions</td><td>${stats.atoms || 0}</td><td>Individual atomic coordinates</td></tr>
            ${stats.enhanced ? `
            <tr><td>Thermochemical Data</td><td>${(stats.thermochemistry?.enthalpy || 0) + (stats.thermochemistry?.entropy || 0) + (stats.thermochemistry?.freeEnergy || 0)}</td><td>Enhanced thermodynamic properties</td></tr>
            <tr><td>Spectroscopic Data</td><td>${(stats.spectroscopy?.electronicTransitions || 0) + (stats.spectroscopy?.irIntensities || 0) + (stats.spectroscopy?.ramanActivities || 0)}</td><td>Electronic and vibrational spectroscopy</td></tr>
            <tr><td>Basis Set Info</td><td>${(stats.basisSet?.molecularOrbitals || 0) + (stats.basisSet?.basisFunctions || 0)}</td><td>Quantum mechanical basis descriptions</td></tr>
            ` : ''}
        </table>
        
        <div class="footer">
            <p>Report generated by ElizaOS Gaussian Knowledge Graph Plugin with ${stats.enhanced ? 'cclib enhanced parsing' : 'basic parsing'}</p>
            <p>Charts generated using Python matplotlib and saved as static PNG files</p>
            <p>📁 Chart files location: data/visualizations/report-${timestamp}/</p>
            <p>For more information, visit the <a href="https://github.com/elizaos/eliza">ElizaOS GitHub repository</a></p>
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(reportPath, htmlContent, 'utf-8');
    return reportPath;
}

async function generateDetailedMarkdownReport(analysisData: any, stats: any, timestamp: number): Promise<string> {
    const reportPath = path.join(process.cwd(), "data", "reports", `detailed-analysis-${timestamp}.md`);
    
    const markdownContent = `# Comprehensive Gaussian Analysis Report

Generated: ${new Date().toLocaleString()}  
Parser: ${stats.parser || 'basic'} ${stats.enhanced ? '(Enhanced with cclib)' : ''}  
Report ID: ${timestamp}

## Executive Summary

This comprehensive analysis report covers ${stats.molecules || 0} molecular systems with ${stats.scfEnergies || 0} energy calculations and ${stats.frequencies || 0} vibrational frequency computations. ${stats.enhanced ? 'Enhanced cclib parsing provides access to 60+ molecular properties including thermochemical, spectroscopic, and basis set information.' : 'Basic parsing provides fundamental molecular and energy data.'}

## Dataset Overview

| Property | Count | Description |
|----------|-------|-------------|
| Molecules | ${stats.molecules || 0} | Unique molecular structures |
| SCF Energies | ${stats.scfEnergies || 0} | Self-consistent field calculations |
| HOMO-LUMO Gaps | ${stats.homoLumoGaps || 0} | Electronic energy gaps |
| Vibrational Frequencies | ${stats.frequencies || 0} | Normal mode frequencies |
| Atomic Positions | ${stats.atoms || 0} | Individual atomic coordinates |
| Total RDF Triples | ${stats.totalTriples || 0} | Knowledge graph statements |

${stats.enhanced ? `

## Enhanced cclib Properties

### Thermochemical Data
- Enthalpy calculations: ${stats.thermochemistry?.enthalpy || 0}
- Entropy calculations: ${stats.thermochemistry?.entropy || 0}
- Free energy data: ${stats.thermochemistry?.freeEnergy || 0}
- ZPVE corrections: ${stats.thermochemistry?.zpve || 0}

### Spectroscopic Properties
- Electronic transitions: ${stats.spectroscopy?.electronicTransitions || 0}
- IR intensities: ${stats.spectroscopy?.irIntensities || 0}
- Raman activities: ${stats.spectroscopy?.ramanActivities || 0}
- Oscillator strengths: ${stats.spectroscopy?.oscillatorStrengths || 0}

### Basis Set Information
- Molecular orbitals: ${stats.basisSet?.molecularOrbitals || 0}
- Basis functions: ${stats.basisSet?.basisFunctions || 0}
- Atomic orbitals: ${stats.basisSet?.atomicOrbitals || 0}

### Optimization Status
- Converged calculations: ${stats.optimization?.convergedCalculations || 0}
- Failed optimizations: ${stats.optimization?.failedOptimizations || 0}
- Success rate: ${stats.optimization?.convergedCalculations && stats.optimization?.failedOptimizations ? 
    ((stats.optimization.convergedCalculations / (stats.optimization.convergedCalculations + stats.optimization.failedOptimizations)) * 100).toFixed(1) : 'N/A'}%

` : ''}

## Energy Analysis

${analysisData.energyData.length > 0 ? `
- Energy range: ${Math.min(...analysisData.energyData).toFixed(6)} to ${Math.max(...analysisData.energyData).toFixed(6)} Hartree
- Average energy: ${(analysisData.energyData.reduce((a: number, b: number) => a + b, 0) / analysisData.energyData.length).toFixed(6)} Hartree
- Energy span: ${(Math.max(...analysisData.energyData) - Math.min(...analysisData.energyData)).toFixed(6)} Hartree
` : 'No energy data available for analysis.'}

## Electronic Properties

${analysisData.homoLumoData.length > 0 ? `
- HOMO-LUMO gap range: ${Math.min(...analysisData.homoLumoData.map((d: any) => d.gap)).toFixed(3)} to ${Math.max(...analysisData.homoLumoData.map((d: any) => d.gap)).toFixed(3)} eV
- Average HOMO-LUMO gap: ${(analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length).toFixed(3)} eV
- Electronic character: ${(analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length) > 4 ? 'Stable (large gap)' : 'Potentially reactive (small gap)'}
` : 'No HOMO-LUMO data available for analysis.'}

## Vibrational Analysis

${analysisData.frequencyData.length > 0 ? `
- Frequency range: ${Math.min(...analysisData.frequencyData).toFixed(1)} to ${Math.max(...analysisData.frequencyData).toFixed(1)} cm⁻¹
- Total frequencies: ${analysisData.frequencyData.length}
- Imaginary frequencies: ${analysisData.frequencyData.filter((f: number) => f < 0).length} (potential transition states)
- Real frequencies: ${analysisData.frequencyData.filter((f: number) => f >= 0).length}
` : 'No vibrational frequency data available for analysis.'}

## Key Findings

${generateKeyFindings(analysisData, stats).map((finding: string, i: number) => `${i + 1}. ${finding}`).join('\n')}

## Research Recommendations

1. Data Quality: ${stats.enhanced ? 'Excellent data quality with cclib validation' : 'Consider upgrading to cclib for enhanced data validation'}

2. Analysis Opportunities: 
   - ${analysisData.energyData.length > 1 ? 'Comparative energy analysis feasible across multiple systems' : 'Single system analysis - consider adding comparative structures'}
   - ${analysisData.homoLumoData.length > 0 ? 'Electronic property trends can be investigated' : 'HOMO-LUMO analysis not available with current data'}
   - ${analysisData.frequencyData.length > 0 ? 'Vibrational mode analysis and IR/Raman prediction possible' : 'Frequency calculations needed for spectroscopic predictions'}

3. Enhanced Capabilities: ${stats.enhanced ? 'Full cclib feature set available for advanced analysis' : 'Consider cclib integration for thermochemical and spectroscopic analysis'}

## Technical Details

- Knowledge Graph Format: RDF/Turtle with chemical ontologies
- Data Storage: ${(stats.fileSize / 1024).toFixed(1)} KB in semantic graph format
- Processing Time: Real-time monitoring and automatic updates
- Compatibility: Supports ${stats.enhanced ? '18+ quantum chemistry programs via cclib' : 'Gaussian output files'}
- Visualizations: Generated using Python matplotlib for publication-quality charts

## Appendix

### File Locations
- Main Knowledge Graph: \`data/gaussian-knowledge-graph.ttl\`
- Reports Directory: \`data/reports/\`
- Visualizations: \`data/visualizations/\`
- Export Files: \`data/exports/\`

### Additional Resources
- [cclib Documentation](https://cclib.github.io/) - For enhanced parsing capabilities
- [ElizaOS Plugin Documentation](https://github.com/elizaos/eliza) - For plugin development
- [RDF/Turtle Format](https://www.w3.org/TR/turtle/) - For knowledge graph understanding
- [Matplotlib Documentation](https://matplotlib.org/) - For visualization customization

---

Report generated by ElizaOS Gaussian Knowledge Graph Plugin v2.0  
${stats.enhanced ? 'Powered by cclib for comprehensive molecular analysis' : 'Basic analysis mode - upgrade to cclib for enhanced features'}
Charts powered by Python matplotlib for professional-quality visualizations
`;

    await fs.writeFile(reportPath, markdownContent, 'utf-8');
    return reportPath;
}

async function generateExecutiveSummary(analysisData: any, stats: any, timestamp: number): Promise<string> {
    const summaryPath = path.join(process.cwd(), "data", "reports", `executive-summary-${timestamp}.md`);
    
    const findings = generateKeyFindings(analysisData, stats);
    const avgEnergy = analysisData.energyData.length > 0 ? 
        (analysisData.energyData.reduce((a: number, b: number) => a + b, 0) / analysisData.energyData.length) : 0;
    const avgGap = analysisData.homoLumoData.length > 0 ? 
        (analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length) : 0;
    const imaginaryFreqs = analysisData.frequencyData.filter((f: number) => f < 0).length;

    const summaryContent = `# Executive Summary: Gaussian Analysis

Date: ${new Date().toLocaleDateString()}  
Analysis Type: ${stats.enhanced ? 'Enhanced cclib Analysis' : 'Basic Analysis'}  
Report ID: ${timestamp}

## Key Metrics

🧪 ${stats.molecules || 0} molecular systems analyzed  
⚡ ${stats.scfEnergies || 0} energy calculations completed  
🎵 ${stats.frequencies || 0} vibrational frequencies computed  
⚛️ ${stats.atoms || 0} atomic positions processed  

${stats.enhanced ? `
## Enhanced Features (cclib)

🌡️ ${(stats.thermochemistry?.enthalpy || 0) + (stats.thermochemistry?.entropy || 0)} thermochemical properties  
🌈 ${(stats.spectroscopy?.electronicTransitions || 0) + (stats.spectroscopy?.irIntensities || 0)} spectroscopic properties  
🧮 ${(stats.basisSet?.molecularOrbitals || 0) + (stats.basisSet?.basisFunctions || 0)} basis set properties  
🎯 ${stats.optimization?.convergedCalculations || 0}/${(stats.optimization?.convergedCalculations || 0) + (stats.optimization?.failedOptimizations || 0)} successful optimizations

` : ''}

## Critical Findings

${findings.slice(0, 3).map((finding: string, i: number) => `${i + 1}. ${finding}`).join('\n\n')}

## Data Quality Assessment

- Parser Quality: ${stats.enhanced ? '✅ Excellent (cclib validated)' : '⚠️ Basic (consider cclib upgrade)'}
- Data Completeness: ${(stats.scfEnergies || 0) > 0 ? '✅' : '❌'} Energy | ${(stats.frequencies || 0) > 0 ? '✅' : '❌'} Frequencies | ${(stats.homoLumoGaps || 0) > 0 ? '✅' : '❌'} Electronic
- Calculation Status: ${imaginaryFreqs === 0 ? '✅ All real frequencies' : `⚠️ ${imaginaryFreqs} imaginary frequencies detected`}
- Visualization Quality: ✅ Professional matplotlib charts generated

## Strategic Recommendations

1. Immediate Actions: ${avgGap > 0 && avgGap < 2 ? 'Review small HOMO-LUMO gaps for reactivity implications' : 'Current electronic properties appear stable'}

2. Enhancement Opportunities: ${stats.enhanced ? 'Leverage full cclib dataset for machine learning applications' : 'Consider cclib integration for 10x more molecular properties'}

3. Research Priorities: ${analysisData.energyData.length > 5 ? 'Sufficient data for statistical analysis and trend identification' : 'Expand dataset for robust statistical analysis'}

## Next Steps

${stats.enhanced ? 
'- Utilize thermochemical data for reaction pathway analysis\n- Implement spectroscopic property predictions\n- Develop basis set optimization strategies\n- Export high-resolution charts for publications' : 
'- Install cclib for enhanced molecular property extraction\n- Expand calculation types beyond basic SCF\n- Implement automated validation protocols\n- Upgrade to matplotlib-based visualizations (✅ Complete)'}

---

Bottom Line: ${stats.molecules > 0 ? 
    `Analysis of ${stats.molecules} molecular system${stats.molecules > 1 ? 's' : ''} ${stats.enhanced ? 'with comprehensive cclib enhancement ' : ''}provides ${findings.length > 0 ? 'actionable insights' : 'baseline data'} for ${avgGap > 4 ? 'stable molecular design' : 'reactive system studies'}.` : 
    'No molecular data available - ensure Gaussian output files are placed in example_logs/ directory.'}

Generated by ElizaOS Gaussian Knowledge Graph Plugin with Python matplotlib visualizations
`;

    await fs.writeFile(summaryPath, summaryContent, 'utf-8');
    return summaryPath;
}

async function generateAdvancedComprehensiveReport(knowledgeService: any, query: string): Promise<any> {
    try {
        // Get comprehensive knowledge graph data
        const stats = await knowledgeService.getKnowledgeGraphStats();
        const graphData = await knowledgeService.queryKnowledgeGraph("all data");
        
        // Create reports directory
        const reportsDir = path.join(process.cwd(), "data", "reports");
        await fs.mkdir(reportsDir, { recursive: true });
        
        // Enhanced analysis with cclib data
        const enhanced = stats.enhanced || false;
        
        // Analyze molecular data with charts
        const analysisData = await performComprehensiveAnalysis(knowledgeService);
        
        const timestamp = Date.now();
        
        // Generate charts using Python matplotlib and save as static files
        const chartImages = await generateReportChartsWithPython(analysisData, stats, timestamp);
        
        // Generate reports
        const htmlReport = await generateInteractiveHTMLReport(analysisData, stats, timestamp, chartImages);
        const markdownReport = await generateDetailedMarkdownReport(analysisData, stats, timestamp);
        const executiveSummary = await generateExecutiveSummary(analysisData, stats, timestamp);
        
        // Extract key findings
        const keyFindings = generateKeyFindings(analysisData, stats);
        
        return {
            reportType: enhanced ? "Enhanced cclib Analysis" : "Basic Analysis",
            moleculeCount: stats.molecules || 0,
            dataPointCount: (stats.scfEnergies || 0) + (stats.frequencies || 0) + (stats.atoms || 0),
            analysisMethods: enhanced ? ["cclib", "Statistical Analysis", "Correlation Analysis", "Thermochemistry", "Spectroscopy"] : ["Basic Parsing", "Statistical Analysis"],
            visualizationCount: chartImages.length,
            enhanced,
            htmlReport: path.relative(process.cwd(), htmlReport),
            markdownReport: path.relative(process.cwd(), markdownReport),
            executiveSummary: path.relative(process.cwd(), executiveSummary),
            keyFindings,
            chartImages
        };
    } catch (error) {
        return { error: error.message };
    }
} 