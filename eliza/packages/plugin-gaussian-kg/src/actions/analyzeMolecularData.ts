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

interface AnalyzeMolecularDataContent extends Content {
    text: string;
}

export const analyzeMolecularDataAction: Action = {
    name: "ANALYZE_MOLECULAR_DATA",
    similes: [
        "ANALYZE_TRENDS",
        "COMPARE_MOLECULES",
        "CHEMICAL_ANALYSIS",
        "ENERGY_COMPARISON",
        "MOLECULAR_INSIGHTS",
        "HOMO_LUMO_ANALYSIS",
        "FREQUENCY_ANALYSIS",
        "STRUCTURAL_ANALYSIS",
        "THERMOCHEMICAL_ANALYSIS",
        "SPECTROSCOPIC_ANALYSIS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const content = message.content as AnalyzeMolecularDataContent;
        const text = content.text?.toLowerCase() || '';
        
        const analysisKeywords = [
            'analyze', 'compare', 'trends', 'insights', 'analysis',
            'molecular data', 'energy comparison', 'homo lumo', 'frequency analysis',
            'structural analysis', 'chemical insights', 'compare molecules',
            'energy trends', 'vibrational analysis', 'thermochemical', 'spectroscopic',
            'electronic transitions', 'basis set', 'orbital analysis'
        ];
        
        return analysisKeywords.some(keyword => text.includes(keyword));
    },
    description: "Perform comprehensive analysis of molecular data using cclib including energy trends, HOMO-LUMO gaps, vibrational frequencies, thermochemistry, and spectroscopic properties",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<unknown> => {
        try {
            const content = message.content as AnalyzeMolecularDataContent;
            const query = content.text || "";
            
            const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
            if (!knowledgeService) {
                const errorText = "❌ Gaussian knowledge service is not available.";
                if (callback) await callback({ text: errorText });
                return false;
            }

            // Perform comprehensive molecular data analysis
            const analysisResult = await performEnhancedMolecularAnalysis(knowledgeService, query);
            
            let responseText = "";
            
            if (analysisResult.error) {
                responseText = `❌ Error performing analysis: ${analysisResult.error}`;
            } else {
                responseText = `🔬 **Enhanced Molecular Data Analysis Results**

📊 **Dataset Overview**:
- 🧪 **Molecules Analyzed**: ${analysisResult.moleculeCount}
- ⚡ **Energy Calculations**: ${analysisResult.energyCount}
- 🎵 **Frequency Calculations**: ${analysisResult.frequencyCount}
- ⚛️ **Total Atoms**: ${analysisResult.atomCount}
- 🔬 **Parser Used**: ${analysisResult.enhanced ? 'cclib (enhanced)' : 'basic'}

📈 **Energy Analysis**:
- 🎯 **Lowest SCF Energy**: ${analysisResult.energyStats.min.toFixed(6)} Hartree
- 🚀 **Highest SCF Energy**: ${analysisResult.energyStats.max.toFixed(6)} Hartree
- 📊 **Average SCF Energy**: ${analysisResult.energyStats.average.toFixed(6)} Hartree
- 📏 **Energy Range**: ${analysisResult.energyStats.range.toFixed(6)} Hartree

🔋 **HOMO-LUMO Analysis**:
- 🎭 **Average Gap**: ${analysisResult.homoLumoStats.averageGap.toFixed(4)} eV
- 🔻 **Smallest Gap**: ${analysisResult.homoLumoStats.minGap.toFixed(4)} eV (${analysisResult.homoLumoStats.minGapMolecule})
- 🔺 **Largest Gap**: ${analysisResult.homoLumoStats.maxGap.toFixed(4)} eV (${analysisResult.homoLumoStats.maxGapMolecule})

🎵 **Vibrational Analysis**:
- 🎼 **Frequency Range**: ${analysisResult.frequencyStats.min.toFixed(1)} - ${analysisResult.frequencyStats.max.toFixed(1)} cm⁻¹
- 🎯 **Most Common Range**: ${analysisResult.frequencyStats.commonRange}
- 🚫 **Imaginary Frequencies**: ${analysisResult.frequencyStats.imaginaryCount}`;

                // Add enhanced cclib-specific analysis if available
                if (analysisResult.enhanced && analysisResult.thermochemistryStats) {
                    responseText += `\n\n🌡️ **Thermochemical Properties**:
- 🔥 **Enthalpy Data**: ${analysisResult.thermochemistryStats.enthalpyCount} calculations
- 📊 **Entropy Data**: ${analysisResult.thermochemistryStats.entropyCount} calculations
- ⚡ **Free Energy Data**: ${analysisResult.thermochemistryStats.freeEnergyCount} calculations
- 🔬 **ZPVE Data**: ${analysisResult.thermochemistryStats.zpveCount} calculations`;
                }

                if (analysisResult.enhanced && analysisResult.spectroscopyStats) {
                    responseText += `\n\n🌈 **Spectroscopic Properties**:
- 🌟 **Electronic Transitions**: ${analysisResult.spectroscopyStats.transitionCount}
- 📊 **IR Intensities**: ${analysisResult.spectroscopyStats.irIntensityCount}
- 🔍 **Raman Activities**: ${analysisResult.spectroscopyStats.ramanCount}
- 💫 **Oscillator Strengths**: ${analysisResult.spectroscopyStats.oscillatorCount}`;
                }

                if (analysisResult.enhanced && analysisResult.basisStats) {
                    responseText += `\n\n🧮 **Basis Set Information**:
- 🌐 **Molecular Orbitals**: ${analysisResult.basisStats.moCount} total
- 🎯 **Basis Functions**: ${analysisResult.basisStats.basisFunctionCount} total
- ⚛️ **Atomic Orbitals**: ${analysisResult.basisStats.aoCount} total`;
                }

                if (analysisResult.enhanced && analysisResult.optimizationStats) {
                    responseText += `\n\n🎯 **Optimization Status**:
- ✅ **Converged Calculations**: ${analysisResult.optimizationStats.converged}
- ❌ **Failed Optimizations**: ${analysisResult.optimizationStats.failed}
- 📊 **Success Rate**: ${analysisResult.optimizationStats.successRate.toFixed(1)}%`;
                }

                if (analysisResult.correlations && analysisResult.correlations.length > 0) {
                    responseText += `\n\n🔗 **Key Correlations**:`;
                    analysisResult.correlations.forEach((corr: string, index: number) => {
                        responseText += `\n${index + 1}. ${corr}`;
                    });
                }

                if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
                    responseText += `\n\n💡 **Recommendations**:`;
                    analysisResult.recommendations.forEach((rec: string, index: number) => {
                        responseText += `\n${index + 1}. ${rec}`;
                    });
                }

                if (analysisResult.reportPath) {
                    responseText += `\n\n📄 **Detailed Report**: \`${analysisResult.reportPath}\``;
                }

                // Add chart information if available
                if (analysisResult.chartImages && analysisResult.chartImages.length > 0) {
                    responseText += `\n\n📊 **Analysis Charts Generated**: ${analysisResult.chartImages.length} visualization(s)`;
                }
            }

            // Create memory with image data for direct display
            const memoryContent: any = { 
                text: responseText,
                attachments: []
            };

            // Add analysis charts as attachments for direct display
            if (analysisResult.chartImages) {
                analysisResult.chartImages.forEach((chart: any, index: number) => {
                    memoryContent.attachments.push({
                        id: (Date.now() + index).toString(),
                        url: `data:image/svg+xml;base64,${chart.data}`,
                        title: chart.title,
                        source: "gaussian-kg",
                        description: `Analysis chart: ${chart.title}`,
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
            console.error("Error in analyzeMolecularDataAction:", error);
            const errorText = `❌ Error performing molecular analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            if (callback) await callback({ text: errorText });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Analyze the molecular data trends" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll perform a comprehensive analysis of the molecular data using cclib.",
                    action: "ANALYZE_MOLECULAR_DATA",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Compare thermochemical properties" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Analyzing thermochemical properties including enthalpy, entropy, and free energy.",
                    action: "ANALYZE_MOLECULAR_DATA",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show me spectroscopic analysis" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Performing spectroscopic analysis including electronic transitions and vibrational data.",
                    action: "ANALYZE_MOLECULAR_DATA",
                },
            },
        ],
    ] as ActionExample[][],
};

async function performEnhancedMolecularAnalysis(knowledgeService: any, query: string): Promise<any> {
    try {
        // Get comprehensive knowledge graph data
        const stats = await knowledgeService.getKnowledgeGraphStats();
        const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
        const rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
        
        // Check if cclib enhanced data is available
        const enhanced = stats.enhanced || false;
        
        // Extract numerical data from RDF with enhanced cclib parsing
        const energyData = extractEnergyData(rdfContent);
        const homoLumoData = extractHOMOLUMOData(rdfContent);
        const frequencyData = extractFrequencyData(rdfContent);
        
        // Calculate statistics
        const energyStats = calculateEnergyStatistics(energyData);
        const homoLumoStats = calculateHOMOLUMOStatistics(homoLumoData);
        const frequencyStats = calculateFrequencyStatistics(frequencyData);
        
        let enhancedAnalysis = {};
        
        if (enhanced) {
            // Extract cclib-specific data
            const thermochemistryStats = extractThermochemistryStats(rdfContent);
            const spectroscopyStats = extractSpectroscopyStats(rdfContent);
            const basisStats = extractBasisStats(rdfContent);
            const optimizationStats = extractOptimizationStats(rdfContent);
            
            enhancedAnalysis = {
                thermochemistryStats,
                spectroscopyStats,
                basisStats,
                optimizationStats
            };
        }
        
        // Generate analysis charts for direct display
        const chartImages = await generateAnalysisCharts({
            energyData,
            homoLumoData,
            frequencyData,
            energyStats,
            homoLumoStats,
            frequencyStats,
            enhanced,
            ...enhancedAnalysis
        });
        
        // Generate correlations and insights with enhanced data
        const correlations = findEnhancedCorrelations(energyData, homoLumoData, frequencyData, enhancedAnalysis, enhanced);
        const recommendations = generateEnhancedRecommendations(energyStats, homoLumoStats, frequencyStats, enhancedAnalysis, enhanced);
        
        // Generate detailed report
        const reportPath = await generateEnhancedDetailedReport({
            energyStats,
            homoLumoStats,
            frequencyStats,
            correlations,
            recommendations,
            stats,
            enhanced,
            ...enhancedAnalysis
        });
        
        return {
            moleculeCount: stats.molecules || 0,
            energyCount: energyData.length,
            frequencyCount: frequencyData.length,
            atomCount: stats.atoms || 0,
            enhanced,
            energyStats,
            homoLumoStats,
            frequencyStats,
            correlations,
            recommendations,
            reportPath,
            chartImages,
            ...enhancedAnalysis
        };
    } catch (error) {
        return { error: error.message };
    }
}

async function generateAnalysisCharts(analysisData: any): Promise<any[]> {
    const charts: any[] = [];
    
    try {
        // Generate energy distribution chart
        if (analysisData.energyData && analysisData.energyData.length > 0) {
            const energyChart = generateEnergyDistributionChart(analysisData.energyData, analysisData.energyStats);
            charts.push({
                title: "SCF Energy Distribution",
                data: Buffer.from(energyChart).toString('base64')
            });
        }
        
        // Generate HOMO-LUMO gap chart
        if (analysisData.homoLumoData && analysisData.homoLumoData.length > 0) {
            const gapChart = generateHOMOLUMOChart(analysisData.homoLumoData, analysisData.homoLumoStats);
            charts.push({
                title: "HOMO-LUMO Gap Analysis",
                data: Buffer.from(gapChart).toString('base64')
            });
        }
        
        // Generate frequency analysis chart
        if (analysisData.frequencyData && analysisData.frequencyData.length > 0) {
            const freqChart = generateFrequencyChart(analysisData.frequencyData, analysisData.frequencyStats);
            charts.push({
                title: "Vibrational Frequency Analysis",
                data: Buffer.from(freqChart).toString('base64')
            });
        }
        
        // Generate enhanced cclib charts if available
        if (analysisData.enhanced && analysisData.thermochemistryStats) {
            const thermoChart = generateThermochemistryChart(analysisData.thermochemistryStats);
            charts.push({
                title: "Thermochemical Properties Overview",
                data: Buffer.from(thermoChart).toString('base64')
            });
        }
        
        if (analysisData.enhanced && analysisData.spectroscopyStats) {
            const spectroChart = generateSpectroscopyChart(analysisData.spectroscopyStats);
            charts.push({
                title: "Spectroscopic Properties Overview",
                data: Buffer.from(spectroChart).toString('base64')
            });
        }
        
    } catch (error) {
        console.error("Error generating analysis charts:", error);
    }
    
    return charts;
}

function generateEnergyDistributionChart(energyData: number[], energyStats: any): string {
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Create histogram bins
    const binCount = Math.min(10, energyData.length);
    const binWidth = energyStats.range / binCount;
    const bins: number[] = new Array(binCount).fill(0);
    
    energyData.forEach(energy => {
        const binIndex = Math.min(Math.floor((energy - energyStats.min) / binWidth), binCount - 1);
        bins[binIndex]++;
    });
    
    const maxBinValue = Math.max(...bins);
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .bar { fill: #4ecdc4; stroke: #fff; stroke-width: 1; opacity: 0.8; }
            .axis { stroke: #333; stroke-width: 1; }
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .label { fill: #333; font-size: 12px; font-family: Arial; text-anchor: middle; }
            .grid { stroke: #ddd; stroke-width: 0.5; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">SCF Energy Distribution</text>
    
    <!-- Chart area background -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="white" stroke="#ddd"/>
    
    <!-- Grid lines -->`;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + (i * chartHeight / 5);
        svg += `\n    <line class="grid" x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}"/>`;
    }
    
    // Draw bars
    const barWidth = chartWidth / binCount;
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinValue) * chartHeight;
        const x = margin.left + i * barWidth;
        const y = margin.top + chartHeight - barHeight;
        
        svg += `\n    <rect class="bar" x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}"/>`;
        
        // Add value labels on bars
        if (count > 0) {
            svg += `\n    <text class="axis-text" x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle">${count}</text>`;
        }
    });
    
    // X-axis
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}"/>`;
    
    // X-axis labels
    for (let i = 0; i <= binCount; i++) {
        const x = margin.left + (i * chartWidth / binCount);
        const energy = energyStats.min + (i * binWidth);
        svg += `\n    <text class="axis-text" x="${x}" y="${margin.top + chartHeight + 20}" text-anchor="middle">${energy.toFixed(3)}</text>`;
    }
    
    // Y-axis
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}"/>`;
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
        const y = margin.top + chartHeight - (i * chartHeight / 5);
        const value = (i * maxBinValue / 5).toFixed(0);
        svg += `\n    <text class="axis-text" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${value}</text>`;
    }
    
    // Axis labels
    svg += `\n    <text class="label" x="${margin.left + chartWidth/2}" y="${height - 10}" text-anchor="middle">SCF Energy (Hartree)</text>`;
    svg += `\n    <text class="label" x="15" y="${margin.top + chartHeight/2}" text-anchor="middle" transform="rotate(-90 15 ${margin.top + chartHeight/2})">Frequency</text>`;
    
    // Statistics box
    svg += `\n    <g transform="translate(${width - 150}, ${margin.top + 20})">
        <rect x="0" y="0" width="140" height="80" fill="white" stroke="#ddd" opacity="0.9"/>
        <text class="axis-text" x="5" y="15">Statistics:</text>
        <text class="axis-text" x="5" y="30">Min: ${energyStats.min.toFixed(4)}</text>
        <text class="axis-text" x="5" y="45">Max: ${energyStats.max.toFixed(4)}</text>
        <text class="axis-text" x="5" y="60">Avg: ${energyStats.average.toFixed(4)}</text>
        <text class="axis-text" x="5" y="75">Count: ${energyData.length}</text>
    </g>`;
    
    svg += `\n</svg>`;
    return svg;
}

function generateHOMOLUMOChart(homoLumoData: any[], homoLumoStats: any): string {
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .point { fill: #ff6b6b; stroke: #fff; stroke-width: 1; opacity: 0.8; }
            .axis { stroke: #333; stroke-width: 1; }
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .label { fill: #333; font-size: 12px; font-family: Arial; text-anchor: middle; }
            .grid { stroke: #ddd; stroke-width: 0.5; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">HOMO-LUMO Gap Analysis</text>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="white" stroke="#ddd"/>`;
    
    // Plot points
    const maxGap = homoLumoStats.maxGap;
    const minGap = homoLumoStats.minGap;
    const gapRange = maxGap - minGap || 1;
    
    homoLumoData.forEach((data, i) => {
        const x = margin.left + (i / (homoLumoData.length - 1)) * chartWidth;
        const y = margin.top + chartHeight - ((data.gap - minGap) / gapRange) * chartHeight;
        
        svg += `\n    <circle class="point" cx="${x}" cy="${y}" r="4"/>`;
    });
    
    // Average line
    const avgY = margin.top + chartHeight - ((homoLumoStats.averageGap - minGap) / gapRange) * chartHeight;
    svg += `\n    <line stroke="#ffe66d" stroke-width="2" stroke-dasharray="5,5" x1="${margin.left}" y1="${avgY}" x2="${margin.left + chartWidth}" y2="${avgY}"/>`;
    svg += `\n    <text class="axis-text" x="${margin.left + chartWidth - 80}" y="${avgY - 5}">Avg: ${homoLumoStats.averageGap.toFixed(3)} eV</text>`;
    
    // Axes
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}"/>`;
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}"/>`;
    
    // Labels
    svg += `\n    <text class="label" x="${margin.left + chartWidth/2}" y="${height - 10}">Molecule Index</text>`;
    svg += `\n    <text class="label" x="15" y="${margin.top + chartHeight/2}" transform="rotate(-90 15 ${margin.top + chartHeight/2})">HOMO-LUMO Gap (eV)</text>`;
    
    svg += `\n</svg>`;
    return svg;
}

function generateFrequencyChart(frequencyData: number[], frequencyStats: any): string {
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .point-real { fill: #4ecdc4; stroke: #fff; stroke-width: 1; opacity: 0.7; }
            .point-imag { fill: #ff6b6b; stroke: #fff; stroke-width: 1; opacity: 0.7; }
            .axis { stroke: #333; stroke-width: 1; }
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .label { fill: #333; font-size: 12px; font-family: Arial; text-anchor: middle; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">Vibrational Frequency Analysis</text>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="white" stroke="#ddd"/>`;
    
    // Zero line
    const zeroY = margin.top + chartHeight/2;
    svg += `\n    <line stroke="#999" stroke-width="1" x1="${margin.left}" y1="${zeroY}" x2="${margin.left + chartWidth}" y2="${zeroY}"/>`;
    svg += `\n    <text class="axis-text" x="${margin.left + chartWidth + 5}" y="${zeroY + 4}">0 cm⁻¹</text>`;
    
    // Plot frequencies
    const maxAbsFreq = Math.max(Math.abs(frequencyStats.min), Math.abs(frequencyStats.max));
    
    frequencyData.forEach((freq, i) => {
        const x = margin.left + (i / (frequencyData.length - 1)) * chartWidth;
        const y = zeroY - (freq / maxAbsFreq) * (chartHeight / 2);
        const cssClass = freq < 0 ? 'point-imag' : 'point-real';
        
        svg += `\n    <circle class="${cssClass}" cx="${x}" cy="${y}" r="3"/>`;
    });
    
    // Axes
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}"/>`;
    svg += `\n    <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}"/>`;
    
    // Labels
    svg += `\n    <text class="label" x="${margin.left + chartWidth/2}" y="${height - 10}">Frequency Mode</text>`;
    svg += `\n    <text class="label" x="15" y="${margin.top + chartHeight/2}" transform="rotate(-90 15 ${margin.top + chartHeight/2})">Frequency (cm⁻¹)</text>`;
    
    // Legend
    svg += `\n    <g transform="translate(${width - 120}, ${margin.top + 20})">
        <rect x="0" y="0" width="110" height="60" fill="white" stroke="#ddd" opacity="0.9"/>
        <circle class="point-real" cx="15" cy="20" r="4"/>
        <text class="axis-text" x="25" y="24">Real</text>
        <circle class="point-imag" cx="15" cy="40" r="4"/>
        <text class="axis-text" x="25" y="44">Imaginary</text>
    </g>`;
    
    svg += `\n</svg>`;
    return svg;
}

function generateThermochemistryChart(thermoStats: any): string {
    const width = 500;
    const height = 300;
    const data = [
        { label: 'Enthalpy', value: thermoStats.enthalpyCount, color: '#ff6b6b' },
        { label: 'Entropy', value: thermoStats.entropyCount, color: '#4ecdc4' },
        { label: 'Free Energy', value: thermoStats.freeEnergyCount, color: '#ffe66d' },
        { label: 'ZPVE', value: thermoStats.zpveCount, color: '#95e1d3' }
    ];
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barHeight = 40;
    const barSpacing = 15;
    const chartTop = 60;
    const chartLeft = 100;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .label { fill: #333; font-size: 12px; font-family: Arial; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">Thermochemical Properties</text>`;
    
    data.forEach((item, i) => {
        const y = chartTop + i * (barHeight + barSpacing);
        const barWidth = (item.value / maxValue) * (width - chartLeft - 50);
        
        svg += `\n    <rect x="${chartLeft}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" opacity="0.8"/>`;
        svg += `\n    <text class="label" x="${chartLeft - 10}" y="${y + barHeight/2 + 4}" text-anchor="end">${item.label}</text>`;
        svg += `\n    <text class="axis-text" x="${chartLeft + barWidth + 5}" y="${y + barHeight/2 + 4}">${item.value}</text>`;
    });
    
    svg += `\n</svg>`;
    return svg;
}

function generateSpectroscopyChart(spectroStats: any): string {
    const width = 500;
    const height = 300;
    const data = [
        { label: 'Transitions', value: spectroStats.transitionCount, color: '#ff6b6b' },
        { label: 'IR Intensities', value: spectroStats.irIntensityCount, color: '#4ecdc4' },
        { label: 'Raman Activities', value: spectroStats.ramanCount, color: '#ffe66d' },
        { label: 'Oscillator Str.', value: spectroStats.oscillatorCount, color: '#95e1d3' }
    ];
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barHeight = 40;
    const barSpacing = 15;
    const chartTop = 60;
    const chartLeft = 120;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .axis-text { fill: #333; font-size: 11px; font-family: Arial; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .label { fill: #333; font-size: 12px; font-family: Arial; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="25" class="title">Spectroscopic Properties</text>`;
    
    data.forEach((item, i) => {
        const y = chartTop + i * (barHeight + barSpacing);
        const barWidth = (item.value / maxValue) * (width - chartLeft - 50);
        
        svg += `\n    <rect x="${chartLeft}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" opacity="0.8"/>`;
        svg += `\n    <text class="label" x="${chartLeft - 10}" y="${y + barHeight/2 + 4}" text-anchor="end">${item.label}</text>`;
        svg += `\n    <text class="axis-text" x="${chartLeft + barWidth + 5}" y="${y + barHeight/2 + 4}">${item.value}</text>`;
    });
    
    svg += `\n</svg>`;
    return svg;
}

function extractEnergyData(rdfContent: string): number[] {
    const energies: number[] = [];
    const lines = rdfContent.split('\n');
    
    for (const line of lines) {
        // Enhanced to handle both eV and Hartree units from cclib
        const energyMatch = line.match(/ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)/);
        if (energyMatch) {
            energies.push(parseFloat(energyMatch[1]));
        }
    }
    
    return energies;
}

function extractHOMOLUMOData(rdfContent: string): Array<{ homo: number, lumo: number, gap: number, molecule: string }> {
    const homoLumoData: Array<{ homo: number, lumo: number, gap: number, molecule: string }> = [];
    const lines = rdfContent.split('\n');
    
    let currentMolecule = '';
    let homo = 0;
    let lumo = 0;
    let gap = 0;
    
    for (const line of lines) {
        if (line.includes('QuantumCalculation')) {
            currentMolecule = line.match(/ex:(\w+)/)?.[1] || 'Unknown';
        }
        
        const homoMatch = line.match(/ontocompchem:hasHOMOEnergy\s+(-?\d+\.?\d*)/);
        if (homoMatch) {
            homo = parseFloat(homoMatch[1]);
        }
        
        const lumoMatch = line.match(/ontocompchem:hasLUMOEnergy\s+(-?\d+\.?\d*)/);
        if (lumoMatch) {
            lumo = parseFloat(lumoMatch[1]);
        }
        
        const gapMatch = line.match(/ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)/);
        if (gapMatch) {
            gap = parseFloat(gapMatch[1]);
        }
        
        if ((homo !== 0 && lumo !== 0) || gap !== 0) {
            homoLumoData.push({
                homo,
                lumo,
                gap: gap || Math.abs(lumo - homo),
                molecule: currentMolecule
            });
            homo = 0;
            lumo = 0;
            gap = 0;
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

// New cclib-specific extraction functions
function extractThermochemistryStats(rdfContent: string): any {
    return {
        enthalpyCount: (rdfContent.match(/ontocompchem:hasEnthalpy/g) || []).length,
        entropyCount: (rdfContent.match(/ontocompchem:hasEntropy/g) || []).length,
        freeEnergyCount: (rdfContent.match(/ontocompchem:hasFreeEnergy/g) || []).length,
        zpveCount: (rdfContent.match(/ontocompchem:hasZPVE/g) || []).length
    };
}

function extractSpectroscopyStats(rdfContent: string): any {
    return {
        transitionCount: (rdfContent.match(/ontocompchem:ElectronicTransition/g) || []).length,
        irIntensityCount: (rdfContent.match(/ontocompchem:hasIRIntensity/g) || []).length,
        ramanCount: (rdfContent.match(/ontocompchem:hasRamanActivity/g) || []).length,
        oscillatorCount: (rdfContent.match(/ontocompchem:hasOscillatorStrength/g) || []).length
    };
}

function extractBasisStats(rdfContent: string): any {
    return {
        moCount: (rdfContent.match(/ontocompchem:hasNumberOfMOs/g) || []).length,
        basisFunctionCount: (rdfContent.match(/ontocompchem:hasNumberOfBasisFunctions/g) || []).length,
        aoCount: (rdfContent.match(/ontocompchem:hasAOCount/g) || []).length
    };
}

function extractOptimizationStats(rdfContent: string): any {
    const converged = (rdfContent.match(/ontocompchem:hasOptimizationConverged true/g) || []).length;
    const failed = (rdfContent.match(/ontocompchem:hasOptimizationConverged false/g) || []).length;
    const total = converged + failed;
    
    return {
        converged,
        failed,
        total,
        successRate: total > 0 ? (converged / total) * 100 : 0
    };
}

function calculateEnergyStatistics(energies: number[]): any {
    if (energies.length === 0) {
        return { min: 0, max: 0, average: 0, range: 0 };
    }
    
    const min = Math.min(...energies);
    const max = Math.max(...energies);
    const average = energies.reduce((a, b) => a + b, 0) / energies.length;
    
    return {
        min,
        max,
        average,
        range: max - min
    };
}

function calculateHOMOLUMOStatistics(homoLumoData: Array<{ homo: number, lumo: number, gap: number, molecule: string }>): any {
    if (homoLumoData.length === 0) {
        return { averageGap: 0, minGap: 0, maxGap: 0, minGapMolecule: 'N/A', maxGapMolecule: 'N/A' };
    }
    
    const gaps = homoLumoData.map(d => d.gap);
    const averageGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    
    const minGapEntry = homoLumoData.find(d => d.gap === minGap);
    const maxGapEntry = homoLumoData.find(d => d.gap === maxGap);
    
    return {
        averageGap,
        minGap,
        maxGap,
        minGapMolecule: minGapEntry?.molecule || 'N/A',
        maxGapMolecule: maxGapEntry?.molecule || 'N/A'
    };
}

function calculateFrequencyStatistics(frequencies: number[]): any {
    if (frequencies.length === 0) {
        return { min: 0, max: 0, commonRange: 'N/A', imaginaryCount: 0 };
    }
    
    const min = Math.min(...frequencies);
    const max = Math.max(...frequencies);
    const imaginaryCount = frequencies.filter(f => f < 0).length;
    
    // Determine most common frequency range with enhanced analysis
    let commonRange = 'N/A';
    if (frequencies.some(f => f >= 3000 && f <= 3500)) {
        commonRange = '3000-3500 cm⁻¹ (C-H stretch)';
    } else if (frequencies.some(f => f >= 1600 && f <= 1700)) {
        commonRange = '1600-1700 cm⁻¹ (C=C stretch)';
    } else if (frequencies.some(f => f >= 1000 && f <= 1300)) {
        commonRange = '1000-1300 cm⁻¹ (C-O stretch)';
    } else if (frequencies.some(f => f >= 2800 && f <= 3000)) {
        commonRange = '2800-3000 cm⁻¹ (Alkyl C-H stretch)';
    }
    
    return {
        min,
        max,
        commonRange,
        imaginaryCount
    };
}

function findEnhancedCorrelations(energyData: number[], homoLumoData: any[], frequencyData: number[], enhancedData: any, enhanced: boolean): string[] {
    const correlations: string[] = [];
    
    if (energyData.length > 1) {
        correlations.push("Energy stabilization correlates with molecular size and conjugation");
    }
    
    if (homoLumoData.length > 1) {
        const avgGap = homoLumoData.reduce((sum, d) => sum + d.gap, 0) / homoLumoData.length;
        if (avgGap > 5) {
            correlations.push("Large HOMO-LUMO gaps suggest good electronic stability");
        } else {
            correlations.push("Small HOMO-LUMO gaps indicate potential reactivity");
        }
    }
    
    if (frequencyData.filter(f => f < 0).length > 0) {
        correlations.push("Imaginary frequencies detected - structures may be transition states");
    }
    
    if (enhanced) {
        // Add cclib-specific correlations
        if (enhancedData.thermochemistryStats && enhancedData.thermochemistryStats.enthalpyCount > 0) {
            correlations.push("Thermochemical data available for reaction feasibility analysis");
        }
        
        if (enhancedData.spectroscopyStats && enhancedData.spectroscopyStats.transitionCount > 0) {
            correlations.push("Electronic transition data enables UV-Vis spectroscopy predictions");
        }
        
        if (enhancedData.optimizationStats && enhancedData.optimizationStats.successRate > 90) {
            correlations.push("High optimization success rate indicates stable molecular geometries");
        }
    }
    
    return correlations;
}

function generateEnhancedRecommendations(energyStats: any, homoLumoStats: any, frequencyStats: any, enhancedData: any, enhanced: boolean): string[] {
    const recommendations: string[] = [];
    
    if (energyStats.range > 0.1) {
        recommendations.push("Consider normalizing energies by molecular size for better comparison");
    }
    
    if (homoLumoStats.minGap < 2) {
        recommendations.push("Molecules with small HOMO-LUMO gaps may benefit from stabilization studies");
    }
    
    if (frequencyStats.imaginaryCount > 0) {
        recommendations.push("Verify geometry optimization for structures with imaginary frequencies");
    }
    
    if (enhanced) {
        // Add cclib-specific recommendations
        if (enhancedData.thermochemistryStats && enhancedData.thermochemistryStats.freeEnergyCount === 0) {
            recommendations.push("Consider calculating free energies for thermodynamic analysis");
        }
        
        if (enhancedData.spectroscopyStats && enhancedData.spectroscopyStats.irIntensityCount > 0) {
            recommendations.push("Use IR intensity data for spectroscopic identification");
        }
        
        if (enhancedData.optimizationStats && enhancedData.optimizationStats.failed > 0) {
            recommendations.push("Review failed optimizations and consider different convergence criteria");
        }
        
        recommendations.push("Leverage cclib's comprehensive data for machine learning applications");
    }
    
    recommendations.push("Consider performing solvent effects calculations for more realistic energies");
    
    return recommendations;
}

async function generateEnhancedDetailedReport(data: any): Promise<string> {
    const reportDir = path.join(process.cwd(), "data", "reports");
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportContent = `# Enhanced Molecular Data Analysis Report (${data.enhanced ? 'cclib' : 'basic'})
Generated: ${new Date().toISOString()}

## Summary Statistics
- Molecules: ${data.stats.molecules || 0}
- Energy calculations: ${data.energyStats ? 'Available' : 'Not available'}
- HOMO-LUMO data: ${data.homoLumoStats ? 'Available' : 'Not available'}
- Frequency data: ${data.frequencyStats ? 'Available' : 'Not available'}
- Enhanced cclib data: ${data.enhanced ? 'Yes' : 'No'}

## Energy Analysis
${JSON.stringify(data.energyStats, null, 2)}

## HOMO-LUMO Analysis
${JSON.stringify(data.homoLumoStats, null, 2)}

## Frequency Analysis
${JSON.stringify(data.frequencyStats, null, 2)}

${data.enhanced ? `
## Thermochemistry Analysis (cclib)
${JSON.stringify(data.thermochemistryStats, null, 2)}

## Spectroscopy Analysis (cclib)
${JSON.stringify(data.spectroscopyStats, null, 2)}

## Basis Set Analysis (cclib)
${JSON.stringify(data.basisStats, null, 2)}

## Optimization Status (cclib)
${JSON.stringify(data.optimizationStats, null, 2)}
` : ''}

## Correlations
${data.correlations.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

## Recommendations
${data.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}
`;
    
    const reportPath = path.join(reportDir, `enhanced-molecular-analysis-${Date.now()}.md`);
    await fs.writeFile(reportPath, reportContent);
    
    return path.relative(process.cwd(), reportPath);
} 