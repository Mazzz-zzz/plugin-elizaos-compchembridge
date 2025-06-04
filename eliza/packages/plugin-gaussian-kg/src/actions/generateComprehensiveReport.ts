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
import * as path from "path";

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

            // Generate comprehensive report with direct image display
            const reportResult = await generateAdvancedComprehensiveReport(knowledgeService, query);
            
            let responseText = "";
            
            if (reportResult.error) {
                responseText = `❌ Error generating report: ${reportResult.error}`;
            } else {
                responseText = `📊 **Comprehensive Research Report Generated**

📈 **Report Overview**:
- 📄 **Report Type**: ${reportResult.reportType}
- 🧪 **Molecules Analyzed**: ${reportResult.moleculeCount}
- 📊 **Data Points**: ${reportResult.dataPointCount}
- 🔬 **Analysis Methods**: ${reportResult.analysisMethods.join(', ')}
- 🎨 **Visualizations**: ${reportResult.visualizationCount}

📝 **Report Sections**:
- 🎯 **Executive Summary**: Key findings and insights
- 📊 **Statistical Analysis**: Comprehensive data overview
- 🧬 **Molecular Properties**: Detailed molecular characterization
- ⚡ **Energy Analysis**: SCF energies and electronic properties
- 🎵 **Vibrational Analysis**: Frequency data and IR/Raman spectra
- 🌡️ **Thermochemical Properties**: ${reportResult.enhanced ? 'Enhanced with cclib data' : 'Basic analysis'}
- 🌈 **Spectroscopic Analysis**: ${reportResult.enhanced ? 'Electronic transitions and intensities' : 'Limited data'}
- 💡 **Research Recommendations**: AI-generated insights

📁 **Generated Files**:
- 🖼️  **Interactive HTML Report**: \`${reportResult.htmlReport}\`
- 📄 **Markdown Report**: \`${reportResult.markdownReport}\`
- 📋 **Executive Summary**: \`${reportResult.executiveSummary}\``;

                if (reportResult.enhanced) {
                    responseText += `\n\n🔬 **Enhanced cclib Features**:
- 📈 **Advanced Statistics**: 60+ molecular properties analyzed
- 🌡️ **Thermochemical Data**: Enthalpy, entropy, free energy, ZPVE
- 🌟 **Spectroscopic Properties**: Electronic transitions, oscillator strengths
- 🧮 **Basis Set Analysis**: Molecular orbitals and basis functions
- 🎯 **Optimization Status**: Convergence tracking and validation`;
                }

                if (reportResult.keyFindings && reportResult.keyFindings.length > 0) {
                    responseText += `\n\n🔍 **Key Findings**:`;
                    reportResult.keyFindings.forEach((finding: string, index: number) => {
                        responseText += `\n${index + 1}. ${finding}`;
                    });
                }

                if (reportResult.chartImages && reportResult.chartImages.length > 0) {
                    responseText += `\n\n📊 **Analysis Charts**: ${reportResult.chartImages.length} visualization(s) displayed below`;
                }

                responseText += `\n\n💡 **Usage**: Open the HTML report for interactive features and detailed analysis`;
            }

            // Create memory with image data for direct display
            const memoryContent: any = { 
                text: responseText,
                attachments: []
            };

            // Add report charts as attachments for direct display
            if (reportResult.chartImages) {
                reportResult.chartImages.forEach((chart: any, index: number) => {
                    memoryContent.attachments.push({
                        id: (Date.now() + index).toString(),
                        url: `data:image/svg+xml;base64,${chart.data}`,
                        title: chart.title,
                        source: "gaussian-kg",
                        description: `Report chart: ${chart.title}`,
                        text: "",
                        contentType: "image/svg+xml"
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
        
        // Generate charts for direct display
        const chartImages = await generateReportCharts(analysisData, stats);
        
        // Generate reports
        const timestamp = Date.now();
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

async function generateReportCharts(analysisData: any, stats: any): Promise<any[]> {
    const charts: any[] = [];
    
    try {
        // Generate overview statistics chart
        const overviewChart = generateOverviewChart(stats);
        charts.push({
            title: "Knowledge Graph Overview",
            data: Buffer.from(overviewChart).toString('base64')
        });
        
        // Generate energy trends if available
        if (analysisData.energyData && analysisData.energyData.length > 1) {
            const trendChart = generateEnergyTrendChart(analysisData.energyData);
            charts.push({
                title: "Energy Trends Analysis",
                data: Buffer.from(trendChart).toString('base64')
            });
        }
        
        // Generate HOMO-LUMO comparison if available
        if (analysisData.homoLumoData && analysisData.homoLumoData.length > 1) {
            const comparisonChart = generateMolecularComparisonChart(analysisData.homoLumoData);
            charts.push({
                title: "Molecular Electronic Properties",
                data: Buffer.from(comparisonChart).toString('base64')
            });
        }
        
        // Generate enhanced cclib summary if available
        if (stats.enhanced) {
            const enhancedChart = generateEnhancedPropertiesChart(stats);
            charts.push({
                title: "Enhanced cclib Properties Summary",
                data: Buffer.from(enhancedChart).toString('base64')
            });
        }
        
    } catch (error) {
        console.error("Error generating report charts:", error);
    }
    
    return charts;
}

function generateOverviewChart(stats: any): string {
    const width = 600;
    const height = 400;
    
    const data = [
        { label: 'Molecules', value: stats.molecules || 0, color: '#ff6b6b' },
        { label: 'SCF Energies', value: stats.scfEnergies || 0, color: '#4ecdc4' },
        { label: 'Frequencies', value: stats.frequencies || 0, color: '#ffe66d' },
        { label: 'Atoms', value: stats.atoms || 0, color: '#95e1d3' },
        { label: 'HOMO-LUMO', value: stats.homoLumoGaps || 0, color: '#a8e6cf' }
    ];
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 120;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .slice { stroke: #fff; stroke-width: 2; }
            .label { fill: #333; font-size: 12px; font-family: Arial; text-anchor: middle; }
            .title { fill: #333; font-size: 18px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .legend { fill: #333; font-size: 11px; font-family: Arial; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${centerX}" y="30" class="title">Knowledge Graph Data Overview</text>`;
    
    // Generate pie chart
    let currentAngle = 0;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    
    if (total > 0) {
        data.forEach((item, i) => {
            if (item.value > 0) {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                const x1 = centerX + Math.cos(currentAngle) * radius;
                const y1 = centerY + Math.sin(currentAngle) * radius;
                const x2 = centerX + Math.cos(currentAngle + sliceAngle) * radius;
                const y2 = centerY + Math.sin(currentAngle + sliceAngle) * radius;
                
                const largeArc = sliceAngle > Math.PI ? 1 : 0;
                
                svg += `\n    <path class="slice" fill="${item.color}" d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"/>`;
                
                // Add percentage label
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                const percentageNum = (item.value / total) * 100;
                const percentage = percentageNum.toFixed(1);
                
                if (percentageNum > 5) { // Only show labels for slices > 5%
                    svg += `\n    <text class="label" x="${labelX}" y="${labelY}">${percentage}%</text>`;
                }
                
                currentAngle += sliceAngle;
            }
        });
    }
    
    // Add legend
    svg += `\n    <g transform="translate(50, ${height - 150})">
        <text x="0" y="0" class="legend" font-weight="bold">Legend:</text>`;
    
    data.forEach((item, i) => {
        const y = 20 + i * 20;
        svg += `\n        <rect x="0" y="${y}" width="15" height="15" fill="${item.color}"/>`;
        svg += `\n        <text x="20" y="${y + 12}" class="legend">${item.label}: ${item.value}</text>`;
    });
    
    svg += `\n    </g>`;
    
    // Add statistics
    svg += `\n    <g transform="translate(${width - 200}, 60)">
        <rect x="0" y="0" width="180" height="120" fill="white" stroke="#ddd" opacity="0.9"/>
        <text x="10" y="20" class="legend" font-weight="bold">Statistics:</text>
        <text x="10" y="40" class="legend">Total Items: ${total}</text>
        <text x="10" y="60" class="legend">Parser: ${stats.parser || 'basic'}</text>
        <text x="10" y="80" class="legend">Enhanced: ${stats.enhanced ? 'Yes' : 'No'}</text>
        <text x="10" y="100" class="legend">Files: ${stats.processedFiles || 0}</text>
    </g>`;
    
    svg += `\n</svg>`;
    return svg;
}

function generateEnergyTrendChart(energyData: number[]): string {
    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const minEnergy = Math.min(...energyData);
    const maxEnergy = Math.max(...energyData);
    const energyRange = maxEnergy - minEnergy || 1;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .line { fill: none; stroke: #4ecdc4; stroke-width: 2; }
            .point { fill: #ff6b6b; stroke: #fff; stroke-width: 1; }
            .axis { stroke: #333; stroke-width: 1; }
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">SCF Energy Trends</text>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="white" stroke="#ddd"/>`;
    
    // Generate line path
    let pathData = "M";
    energyData.forEach((energy, i) => {
        const x = margin.left + (i / (energyData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - ((energy - minEnergy) / energyRange) * chartHeight;
        
        if (i === 0) {
            pathData += ` ${x} ${y}`;
        } else {
            pathData += ` L ${x} ${y}`;
        }
        
        // Add point
        svg += `\n    <circle class="point" cx="${x}" cy="${y}" r="3"/>`;
    });
    
    svg += `\n    <path class="line" d="${pathData}"/>`;
    
    // Axes
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}"/>`;
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}"/>`;
    
    svg += `\n</svg>`;
    return svg;
}

function generateMolecularComparisonChart(homoLumoData: any[]): string {
    const width = 600;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .bar-homo { fill: #ff6b6b; opacity: 0.8; }
            .bar-lumo { fill: #4ecdc4; opacity: 0.8; }
            .axis { stroke: #333; stroke-width: 1; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .legend { fill: #333; font-size: 11px; font-family: Arial; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">HOMO-LUMO Energy Levels</text>
    
    <!-- Legend -->
    <g transform="translate(${width - 150}, 50)">
        <rect x="0" y="0" width="12" height="12" class="bar-homo"/>
        <text x="17" y="10" class="legend">HOMO</text>
        <rect x="0" y="20" width="12" height="12" class="bar-lumo"/>
        <text x="17" y="30" class="legend">LUMO</text>
    </g>`;
    
    // Simple bar representation for first few molecules
    const displayData = homoLumoData.slice(0, 5);
    const barWidth = 60;
    const spacing = 20;
    
    displayData.forEach((data, i) => {
        const x = margin.left + i * (barWidth + spacing);
        const centerY = height / 2;
        
        // HOMO bar (negative direction)
        svg += `\n    <rect class="bar-homo" x="${x}" y="${centerY}" width="${barWidth}" height="30"/>`;
        // LUMO bar (positive direction)  
        svg += `\n    <rect class="bar-lumo" x="${x}" y="${centerY - 30}" width="${barWidth}" height="30"/>`;
        
        // Gap indicator
        svg += `\n    <text x="${x + barWidth/2}" y="${centerY + 50}" class="legend" text-anchor="middle">${data.gap.toFixed(2)} eV</text>`;
    });
    
    svg += `\n</svg>`;
    return svg;
}

function generateEnhancedPropertiesChart(stats: any): string {
    const width = 600;
    const height = 400;
    
    const categories = [
        { name: 'Thermochemistry', count: (stats.thermochemistry?.enthalpy || 0) + (stats.thermochemistry?.entropy || 0), color: '#ff6b6b' },
        { name: 'Spectroscopy', count: (stats.spectroscopy?.electronicTransitions || 0) + (stats.spectroscopy?.irIntensities || 0), color: '#4ecdc4' },
        { name: 'Basis Sets', count: (stats.basisSet?.molecularOrbitals || 0) + (stats.basisSet?.basisFunctions || 0), color: '#ffe66d' },
        { name: 'Optimization', count: (stats.optimization?.convergedCalculations || 0) + (stats.optimization?.failedOptimizations || 0), color: '#95e1d3' }
    ];
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .title { fill: #333; font-size: 18px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .category-text { fill: #333; font-size: 14px; font-family: Arial; font-weight: bold; }
            .value-text { fill: #666; font-size: 12px; font-family: Arial; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="30" class="title">Enhanced cclib Properties Summary</text>`;
    
    // Create grid layout
    categories.forEach((category, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 50 + col * 250;
        const y = 80 + row * 120;
        
        // Category box
        svg += `\n    <rect x="${x}" y="${y}" width="200" height="80" fill="${category.color}" opacity="0.3" stroke="${category.color}" stroke-width="2" rx="10"/>`;
        svg += `\n    <text x="${x + 100}" y="${y + 30}" class="category-text" text-anchor="middle">${category.name}</text>`;
        svg += `\n    <text x="${x + 100}" y="${y + 55}" class="value-text" text-anchor="middle">${category.count} properties</text>`;
    });
    
    // Add summary
    const totalProperties = categories.reduce((sum, cat) => sum + cat.count, 0);
    svg += `\n    <text x="${width/2}" y="${height - 30}" class="value-text" text-anchor="middle">Total Enhanced Properties: ${totalProperties}</text>`;
    
    svg += `\n</svg>`;
    return svg;
}

async function performComprehensiveAnalysis(knowledgeService: any): Promise<any> {
    // Get knowledge graph data
    const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
    const rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
    
    // Extract data for analysis
    const energyData = extractEnergyData(rdfContent);
    const homoLumoData = extractHOMOLUMOData(rdfContent);
    const frequencyData = extractFrequencyData(rdfContent);
    
    return {
        energyData,
        homoLumoData,
        frequencyData
    };
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
    
    return findings;
}

async function generateInteractiveHTMLReport(analysisData: any, stats: any, timestamp: number, chartImages: any[]): Promise<string> {
    const reportPath = path.join(process.cwd(), "data", "reports", `comprehensive-report-${timestamp}.html`);
    
    // Embed charts as base64 data URLs
    const chartEmbeds = chartImages.map((chart, i) => 
        `<div class="chart-container">
            <h3>${chart.title}</h3>
            <img src="data:image/svg+xml;base64,${chart.data}" alt="${chart.title}" style="max-width: 100%; height: auto;">
        </div>`
    ).join('\n');
    
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

**Generated:** ${new Date().toLocaleString()}  
**Parser:** ${stats.parser || 'basic'} ${stats.enhanced ? '(Enhanced with cclib)' : ''}  
**Report ID:** ${timestamp}

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
- **Enthalpy calculations:** ${stats.thermochemistry?.enthalpy || 0}
- **Entropy calculations:** ${stats.thermochemistry?.entropy || 0}
- **Free energy data:** ${stats.thermochemistry?.freeEnergy || 0}
- **ZPVE corrections:** ${stats.thermochemistry?.zpve || 0}

### Spectroscopic Properties
- **Electronic transitions:** ${stats.spectroscopy?.electronicTransitions || 0}
- **IR intensities:** ${stats.spectroscopy?.irIntensities || 0}
- **Raman activities:** ${stats.spectroscopy?.ramanActivities || 0}
- **Oscillator strengths:** ${stats.spectroscopy?.oscillatorStrengths || 0}

### Basis Set Information
- **Molecular orbitals:** ${stats.basisSet?.molecularOrbitals || 0}
- **Basis functions:** ${stats.basisSet?.basisFunctions || 0}
- **Atomic orbitals:** ${stats.basisSet?.atomicOrbitals || 0}

### Optimization Status
- **Converged calculations:** ${stats.optimization?.convergedCalculations || 0}
- **Failed optimizations:** ${stats.optimization?.failedOptimizations || 0}
- **Success rate:** ${stats.optimization?.convergedCalculations && stats.optimization?.failedOptimizations ? 
    ((stats.optimization.convergedCalculations / (stats.optimization.convergedCalculations + stats.optimization.failedOptimizations)) * 100).toFixed(1) : 'N/A'}%

` : ''}

## Energy Analysis

${analysisData.energyData.length > 0 ? `
- **Energy range:** ${Math.min(...analysisData.energyData).toFixed(6)} to ${Math.max(...analysisData.energyData).toFixed(6)} Hartree
- **Average energy:** ${(analysisData.energyData.reduce((a: number, b: number) => a + b, 0) / analysisData.energyData.length).toFixed(6)} Hartree
- **Energy span:** ${(Math.max(...analysisData.energyData) - Math.min(...analysisData.energyData)).toFixed(6)} Hartree
` : 'No energy data available for analysis.'}

## Electronic Properties

${analysisData.homoLumoData.length > 0 ? `
- **HOMO-LUMO gap range:** ${Math.min(...analysisData.homoLumoData.map((d: any) => d.gap)).toFixed(3)} to ${Math.max(...analysisData.homoLumoData.map((d: any) => d.gap)).toFixed(3)} eV
- **Average HOMO-LUMO gap:** ${(analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length).toFixed(3)} eV
- **Electronic character:** ${(analysisData.homoLumoData.reduce((sum: number, d: any) => sum + d.gap, 0) / analysisData.homoLumoData.length) > 4 ? 'Stable (large gap)' : 'Potentially reactive (small gap)'}
` : 'No HOMO-LUMO data available for analysis.'}

## Vibrational Analysis

${analysisData.frequencyData.length > 0 ? `
- **Frequency range:** ${Math.min(...analysisData.frequencyData).toFixed(1)} to ${Math.max(...analysisData.frequencyData).toFixed(1)} cm⁻¹
- **Total frequencies:** ${analysisData.frequencyData.length}
- **Imaginary frequencies:** ${analysisData.frequencyData.filter((f: number) => f < 0).length} (potential transition states)
- **Real frequencies:** ${analysisData.frequencyData.filter((f: number) => f >= 0).length}
` : 'No vibrational frequency data available for analysis.'}

## Key Findings

${generateKeyFindings(analysisData, stats).map((finding: string, i: number) => `${i + 1}. ${finding}`).join('\n')}

## Research Recommendations

1. **Data Quality:** ${stats.enhanced ? 'Excellent data quality with cclib validation' : 'Consider upgrading to cclib for enhanced data validation'}

2. **Analysis Opportunities:** 
   - ${analysisData.energyData.length > 1 ? 'Comparative energy analysis feasible across multiple systems' : 'Single system analysis - consider adding comparative structures'}
   - ${analysisData.homoLumoData.length > 0 ? 'Electronic property trends can be investigated' : 'HOMO-LUMO analysis not available with current data'}
   - ${analysisData.frequencyData.length > 0 ? 'Vibrational mode analysis and IR/Raman prediction possible' : 'Frequency calculations needed for spectroscopic predictions'}

3. **Enhanced Capabilities:** ${stats.enhanced ? 'Full cclib feature set available for advanced analysis' : 'Consider cclib integration for thermochemical and spectroscopic analysis'}

## Technical Details

- **Knowledge Graph Format:** RDF/Turtle with chemical ontologies
- **Data Storage:** ${(stats.fileSize / 1024).toFixed(1)} KB in semantic graph format
- **Processing Time:** Real-time monitoring and automatic updates
- **Compatibility:** Supports ${stats.enhanced ? '18+ quantum chemistry programs via cclib' : 'Gaussian output files'}

## Appendix

### File Locations
- **Main Knowledge Graph:** \`data/gaussian-knowledge-graph.ttl\`
- **Reports Directory:** \`data/reports/\`
- **Visualizations:** \`data/visualizations/\`
- **Export Files:** \`data/exports/\`

### Additional Resources
- [cclib Documentation](https://cclib.github.io/) - For enhanced parsing capabilities
- [ElizaOS Plugin Documentation](https://github.com/elizaos/eliza) - For plugin development
- [RDF/Turtle Format](https://www.w3.org/TR/turtle/) - For knowledge graph understanding

---

*Report generated by ElizaOS Gaussian Knowledge Graph Plugin v2.0*  
*${stats.enhanced ? 'Powered by cclib for comprehensive molecular analysis' : 'Basic analysis mode - upgrade to cclib for enhanced features'}*
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

**Date:** ${new Date().toLocaleDateString()}  
**Analysis Type:** ${stats.enhanced ? 'Enhanced cclib Analysis' : 'Basic Analysis'}  
**Report ID:** ${timestamp}

## Key Metrics

🧪 **${stats.molecules || 0}** molecular systems analyzed  
⚡ **${stats.scfEnergies || 0}** energy calculations completed  
🎵 **${stats.frequencies || 0}** vibrational frequencies computed  
⚛️ **${stats.atoms || 0}** atomic positions processed  

${stats.enhanced ? `
## Enhanced Features (cclib)

🌡️ **${(stats.thermochemistry?.enthalpy || 0) + (stats.thermochemistry?.entropy || 0)}** thermochemical properties  
🌈 **${(stats.spectroscopy?.electronicTransitions || 0) + (stats.spectroscopy?.irIntensities || 0)}** spectroscopic properties  
🧮 **${(stats.basisSet?.molecularOrbitals || 0) + (stats.basisSet?.basisFunctions || 0)}** basis set properties  
🎯 **${stats.optimization?.convergedCalculations || 0}**/**${(stats.optimization?.convergedCalculations || 0) + (stats.optimization?.failedOptimizations || 0)}** successful optimizations

` : ''}

## Critical Findings

${findings.slice(0, 3).map((finding: string, i: number) => `**${i + 1}.** ${finding}`).join('\n\n')}

## Data Quality Assessment

- **Parser Quality:** ${stats.enhanced ? '✅ Excellent (cclib validated)' : '⚠️ Basic (consider cclib upgrade)'}
- **Data Completeness:** ${(stats.scfEnergies || 0) > 0 ? '✅' : '❌'} Energy | ${(stats.frequencies || 0) > 0 ? '✅' : '❌'} Frequencies | ${(stats.homoLumoGaps || 0) > 0 ? '✅' : '❌'} Electronic
- **Calculation Status:** ${imaginaryFreqs === 0 ? '✅ All real frequencies' : `⚠️ ${imaginaryFreqs} imaginary frequencies detected`}

## Strategic Recommendations

1. **Immediate Actions:** ${avgGap > 0 && avgGap < 2 ? 'Review small HOMO-LUMO gaps for reactivity implications' : 'Current electronic properties appear stable'}

2. **Enhancement Opportunities:** ${stats.enhanced ? 'Leverage full cclib dataset for machine learning applications' : 'Consider cclib integration for 10x more molecular properties'}

3. **Research Priorities:** ${analysisData.energyData.length > 5 ? 'Sufficient data for statistical analysis and trend identification' : 'Expand dataset for robust statistical analysis'}

## Next Steps

${stats.enhanced ? 
'- Utilize thermochemical data for reaction pathway analysis\n- Implement spectroscopic property predictions\n- Develop basis set optimization strategies' : 
'- Install cclib for enhanced molecular property extraction\n- Expand calculation types beyond basic SCF\n- Implement automated validation protocols'}

---

**Bottom Line:** ${stats.molecules > 0 ? 
    `Analysis of ${stats.molecules} molecular system${stats.molecules > 1 ? 's' : ''} ${stats.enhanced ? 'with comprehensive cclib enhancement ' : ''}provides ${findings.length > 0 ? 'actionable insights' : 'baseline data'} for ${avgGap > 4 ? 'stable molecular design' : 'reactive system studies'}.` : 
    'No molecular data available - ensure Gaussian output files are placed in example_logs/ directory.'}

*Generated by ElizaOS Gaussian Knowledge Graph Plugin*
`;

    await fs.writeFile(summaryPath, summaryContent, 'utf-8');
    return summaryPath;
} 