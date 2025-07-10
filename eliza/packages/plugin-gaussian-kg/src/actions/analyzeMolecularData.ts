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
import { spawn } from "child_process";

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
    description: "Perform comprehensive analysis of molecular data using cclib including energy trends, HOMO-LUMO gaps, vibrational frequencies, thermochemistry, and spectroscopic properties with matplotlib visualizations",
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
                responseText = `🔬 Enhanced Molecular Data Analysis Results

📊 Dataset Overview:
- 🧪 Molecules Analyzed: ${analysisResult.moleculeCount}
- ⚡ Energy Calculations: ${analysisResult.energyCount}
- 🎵 Frequency Calculations: ${analysisResult.frequencyCount}
- ⚛️ Total Atoms: ${analysisResult.atomCount}
- 🔬 Parser Used: ${analysisResult.enhanced ? 'cclib (enhanced)' : 'basic'}

📈 Energy Analysis:
- 🎯 Lowest SCF Energy: ${analysisResult.energyStats.min.toFixed(6)} Hartree
- 🚀 Highest SCF Energy: ${analysisResult.energyStats.max.toFixed(6)} Hartree
- 📊 Average SCF Energy: ${analysisResult.energyStats.average.toFixed(6)} Hartree
- 📏 Energy Range: ${analysisResult.energyStats.range.toFixed(6)} Hartree

🔋 HOMO-LUMO Analysis:
- 🎭 Average Gap: ${analysisResult.homoLumoStats.averageGap.toFixed(4)} eV
- 🔻 Smallest Gap: ${analysisResult.homoLumoStats.minGap.toFixed(4)} eV (${analysisResult.homoLumoStats.minGapMolecule})
- 🔺 Largest Gap: ${analysisResult.homoLumoStats.maxGap.toFixed(4)} eV (${analysisResult.homoLumoStats.maxGapMolecule})

🎵 Vibrational Analysis:
- 🎼 Frequency Range: ${analysisResult.frequencyStats.min.toFixed(1)} - ${analysisResult.frequencyStats.max.toFixed(1)} cm⁻¹
- 🎯 Most Common Range: ${analysisResult.frequencyStats.commonRange}
- 🚫 Imaginary Frequencies: ${analysisResult.frequencyStats.imaginaryCount}`;

                // Add enhanced cclib-specific analysis if available
                if (analysisResult.enhanced && analysisResult.thermochemistryStats) {
                    responseText += `\n\n🌡️ Thermochemical Properties:
- 🔥 Enthalpy Data: ${analysisResult.thermochemistryStats.enthalpyCount} calculations
- 📊 Entropy Data: ${analysisResult.thermochemistryStats.entropyCount} calculations
- ⚡ Free Energy Data: ${analysisResult.thermochemistryStats.freeEnergyCount} calculations
- 🔬 ZPVE Data: ${analysisResult.thermochemistryStats.zpveCount} calculations`;
                }

                if (analysisResult.enhanced && analysisResult.spectroscopyStats) {
                    responseText += `\n\n🌈 Spectroscopic Properties:
- 🌟 Electronic Transitions: ${analysisResult.spectroscopyStats.transitionCount}
- 📊 IR Intensities: ${analysisResult.spectroscopyStats.irIntensityCount}
- 🔍 Raman Activities: ${analysisResult.spectroscopyStats.ramanCount}
- 💫 Oscillator Strengths: ${analysisResult.spectroscopyStats.oscillatorCount}`;
                }

                if (analysisResult.enhanced && analysisResult.basisStats) {
                    responseText += `\n\n🧮 Basis Set Information:
- 🌐 Molecular Orbitals: ${analysisResult.basisStats.moCount} total
- 🎯 Basis Functions: ${analysisResult.basisStats.basisFunctionCount} total
- ⚛️ Atomic Orbitals: ${analysisResult.basisStats.aoCount} total`;
                }

                if (analysisResult.enhanced && analysisResult.optimizationStats) {
                    responseText += `\n\n🎯 Optimization Status:
- ✅ Converged Calculations: ${analysisResult.optimizationStats.converged}
- ❌ Failed Optimizations: ${analysisResult.optimizationStats.failed}
- 📊 Success Rate: ${analysisResult.optimizationStats.successRate.toFixed(1)}%`;
                }

                if (analysisResult.correlations && analysisResult.correlations.length > 0) {
                    responseText += `\n\n🔗 Key Correlations:`;
                    analysisResult.correlations.forEach((corr: string, index: number) => {
                        responseText += `\n${index + 1}. ${corr}`;
                    });
                }

                if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
                    responseText += `\n\n💡 Recommendations:`;
                    analysisResult.recommendations.forEach((rec: string, index: number) => {
                        responseText += `\n${index + 1}. ${rec}`;
                    });
                }

                if (analysisResult.reportPath) {
                    responseText += `\n\n📄 Detailed Report: \`${analysisResult.reportPath}\``;
                }

                // Add chart information if available
                if (analysisResult.chartImages && analysisResult.chartImages.length > 0) {
                    responseText += `\n\n📊 Professional Matplotlib Charts Generated: ${analysisResult.chartImages.length} visualization(s)`;
                    analysisResult.chartImages.forEach((chart: any, index: number) => {
                        responseText += `\n🖼️  ${chart.title}: Available at ${chart.publicUrl}`;
                    });
                }
            }

            // Create memory with attachments pointing to public folder URLs
            const memoryContent: any = { 
                text: responseText,
                attachments: []
            };

            // Add chart attachments using public URLs for web serving
            if (analysisResult.chartImages && analysisResult.chartImages.length > 0) {
                analysisResult.chartImages.forEach((chart: any, index: number) => {
                    memoryContent.attachments.push({
                        id: (Date.now() + index).toString(),
                        url: chart.publicUrl,
                        title: chart.title,
                        source: "gaussian-kg-charts",
                        description: `Analysis chart: ${chart.title}`,
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
                    text: "I'll perform a comprehensive analysis of the molecular data using cclib with professional matplotlib visualizations.",
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
                    text: "Analyzing thermochemical properties including enthalpy, entropy, and free energy with publication-quality charts.",
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
                    text: "Performing spectroscopic analysis including electronic transitions and vibrational data with matplotlib visualizations.",
                    action: "ANALYZE_MOLECULAR_DATA",
                },
            },
        ],
    ] as ActionExample[][],
};

async function callPythonPlotting(chartType: string, data: any, outputPath?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(process.cwd(), "../packages/plugin-gaussian-kg/py/plot_gaussian_analysis.py");
        const dataJson = JSON.stringify(data);
        
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

async function performEnhancedMolecularAnalysis(knowledgeService: any, query: string): Promise<any> {
    try {
        // Get comprehensive knowledge graph data
        const stats = await knowledgeService.getKnowledgeGraphStats();
        const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
        
        let rdfContent = "";
        try {
            rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
        } catch (error) {
            console.warn("Could not read knowledge graph file, using empty analysis data");
        }
        
        // Check if cclib enhanced data is available
        const enhanced = stats.enhanced || false;
        
        // Extract file-separated data for proper analysis
        const fileData = extractFileSeparatedData(rdfContent);
        
        // Also extract legacy aggregated data for backward compatibility
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
        
        // Generate professional matplotlib charts
        const timestamp = Date.now();
        const chartImages = await generateAnalysisChartsWithPython({
            fileData,
            energyData,
            homoLumoData,
            frequencyData,
            energyStats,
            homoLumoStats,
            frequencyStats,
            enhanced,
            stats,
            ...enhancedAnalysis
        }, timestamp);
        
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

async function generateAnalysisChartsWithPython(analysisData: any, timestamp: number): Promise<any[]> {
    const charts: any[] = [];
    
    try {
        // Create visualizations directory for this analysis
        const visualizationsDir = path.join(process.cwd(), "data", "visualizations", `analysis-${timestamp}`);
        await fs.mkdir(visualizationsDir, { recursive: true });
        
        // Create public charts directory for web serving
        const publicChartsDir = path.join(process.cwd(), "../client/public/charts", `analysis-${timestamp}`);
        await fs.mkdir(publicChartsDir, { recursive: true });
        
        // Generate file-separated energy analysis if available
        if (analysisData.fileData && Object.keys(analysisData.fileData).length > 0) {
            try {
                const energyPath = path.join(visualizationsDir, "file-separated-energy-analysis.png");
                const publicEnergyPath = path.join(publicChartsDir, "file-separated-energy-analysis.png");
                await callPythonPlotting("file_separated_energy", analysisData.fileData, energyPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(energyPath, publicEnergyPath);
                
                charts.push({
                    title: "SCF Energy Analysis by File",
                    path: path.relative(process.cwd(), energyPath),
                    publicUrl: `/charts/analysis-${timestamp}/file-separated-energy-analysis.png`,
                    filename: "file-separated-energy-analysis.png"
                });
            } catch (error) {
                console.error("Error generating energy analysis chart:", error);
            }
        }
        
        // Generate file-separated HOMO-LUMO analysis if available
        const hasGapData = Object.values(analysisData.fileData || {}).some((fileData: any) => 
            fileData.homoLumoData && fileData.homoLumoData.length > 0);
        
        if (hasGapData) {
            try {
                const gapPath = path.join(visualizationsDir, "file-separated-gaps-analysis.png");
                const publicGapPath = path.join(publicChartsDir, "file-separated-gaps-analysis.png");
                await callPythonPlotting("file_separated_gaps", analysisData.fileData, gapPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(gapPath, publicGapPath);
                
                charts.push({
                    title: "HOMO-LUMO Gap Analysis by File",
                    path: path.relative(process.cwd(), gapPath),
                    publicUrl: `/charts/analysis-${timestamp}/file-separated-gaps-analysis.png`,
                    filename: "file-separated-gaps-analysis.png"
                });
            } catch (error) {
                console.error("Error generating gaps analysis chart:", error);
            }
        }
        
        // Generate file-separated frequency analysis if available
        const hasFreqData = Object.values(analysisData.fileData || {}).some((fileData: any) => 
            fileData.frequencyData && fileData.frequencyData.length > 0);
        
        if (hasFreqData) {
            try {
                const frequencyPath = path.join(visualizationsDir, "file-separated-frequency-analysis.png");
                const publicFrequencyPath = path.join(publicChartsDir, "file-separated-frequency-analysis.png");
                await callPythonPlotting("file_separated_frequency", analysisData.fileData, frequencyPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(frequencyPath, publicFrequencyPath);
                
                charts.push({
                    title: "Vibrational Frequency Analysis by File",
                    path: path.relative(process.cwd(), frequencyPath),
                    publicUrl: `/charts/analysis-${timestamp}/file-separated-frequency-analysis.png`,
                    filename: "file-separated-frequency-analysis.png"
                });
            } catch (error) {
                console.error("Error generating frequency analysis chart:", error);
            }
        }
        
        // Generate enhanced cclib analysis summary if available
        if (analysisData.enhanced) {
            try {
                const enhancedPath = path.join(visualizationsDir, "enhanced-analysis-summary.png");
                const publicEnhancedPath = path.join(publicChartsDir, "enhanced-analysis-summary.png");
                
                const enhancedData = { stats: analysisData.stats };
                await callPythonPlotting("enhanced_properties", enhancedData, enhancedPath);
                
                // Copy to public directory for web serving
                await fs.copyFile(enhancedPath, publicEnhancedPath);
                
                charts.push({
                    title: "Enhanced cclib Analysis Summary",
                    path: path.relative(process.cwd(), enhancedPath),
                    publicUrl: `/charts/analysis-${timestamp}/enhanced-analysis-summary.png`,
                    filename: "enhanced-analysis-summary.png"
                });
            } catch (error) {
                console.error("Error generating enhanced analysis chart:", error);
            }
        }
        
        // Generate overview statistics chart
        try {
            const overviewPath = path.join(visualizationsDir, "analysis-overview.png");
            const publicOverviewPath = path.join(publicChartsDir, "analysis-overview.png");
            
            const overviewData = { stats: analysisData.stats };
            await callPythonPlotting("overview", overviewData, overviewPath);
            
            // Copy to public directory for web serving
            await fs.copyFile(overviewPath, publicOverviewPath);
            
            charts.push({
                title: "Molecular Data Analysis Overview",
                path: path.relative(process.cwd(), overviewPath),
                publicUrl: `/charts/analysis-${timestamp}/analysis-overview.png`,
                filename: "analysis-overview.png"
            });
        } catch (error) {
            console.error("Error generating analysis overview chart:", error);
        }
        
    } catch (error) {
        console.error("Error generating analysis charts:", error);
    }
    
    return charts;
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
    
    return fileData;
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