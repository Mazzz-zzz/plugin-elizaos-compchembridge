import {
    ActionExample,
    Content,
    IAgentRuntime,
    Memory,
    State,
    type Action,
    HandlerCallback,
} from "@elizaos/core";

interface QueryGaussianKnowledgeContent extends Content {
    text: string;
}

export const queryGaussianKnowledgeAction: Action = {
    name: "QUERY_GAUSSIAN_KNOWLEDGE",
    similes: [
        "ASK_ABOUT_CALCULATIONS",
        "SEARCH_QUANTUM_DATA", 
        "FIND_MOLECULAR_DATA",
        "GET_CALCULATION_INFO",
        "SHOW_KNOWLEDGE_STATS",
        "WHAT_CALCULATIONS",
        "HOW_MANY_MOLECULES",
        "THERMOCHEMICAL_DATA",
        "SPECTROSCOPIC_DATA",
        "BASIS_SET_INFO"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const content = message.content as QueryGaussianKnowledgeContent;
        const text = content.text?.toLowerCase() || '';
        
        // Enhanced keywords for cclib data
        const queryKeywords = [
            'how many', 'what', 'show me', 'find', 'search', 'tell me about',
            'energy', 'energies', 'molecule', 'molecules', 'calculation', 'calculations',
            'homo', 'lumo', 'gap', 'frequency', 'frequencies', 'atom', 'atoms',
            'scf', 'dft', 'basis', 'method', 'gaussian', 'quantum', 'knowledge graph',
            'stats', 'statistics', 'summary', 'thermochemical', 'thermochemistry',
            'enthalpy', 'entropy', 'free energy', 'zpve', 'transition', 'transitions',
            'spectroscopy', 'spectroscopic', 'ir', 'raman', 'oscillator', 'optimization',
            'converged', 'molecular orbital', 'orbitals', 'basis functions'
        ];
        
        return queryKeywords.some(keyword => text.includes(keyword));
    },
    description: "Query the comprehensive Gaussian knowledge graph with cclib data to answer questions about calculations, molecules, energies, thermochemistry, and spectroscopic properties",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<unknown> => {
        try {
            const content = message.content as QueryGaussianKnowledgeContent;
            const query = content.text || "";
            
            // Get the knowledge service
            const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
            if (!knowledgeService) {
                const errorMemory = await runtime.messageManager.createMemory({
                    userId: message.userId,
                    agentId: message.agentId,
                    content: {
                        text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized."
                    },
                    roomId: message.roomId,
                });
                if (callback) {
                    await callback({
                        text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized."
                    });
                }
                return false;
            }

            let responseText = "";
            
            // Handle different types of queries with enhanced cclib support
            if (query.toLowerCase().includes('stats') || query.toLowerCase().includes('summary')) {
                // Get overall statistics including cclib enhancements
                const stats = await knowledgeService.getKnowledgeGraphStats();
                if (stats.error) {
                    responseText = `❌ Error getting knowledge graph stats: ${stats.error}`;
                } else {
                    responseText = `📊 **Enhanced Gaussian Knowledge Graph Statistics**

📁 **Storage & Parser**:
- 📦 **File Size**: ${(stats.fileSize / 1024).toFixed(1)} KB
- 🔬 **Parser**: ${stats.parser || 'basic'} ${stats.enhanced ? '(cclib enhanced)' : ''}
- 🧮 **Total RDF Triples**: ${stats.totalTriples}

🧪 **Molecular Data**:
- 🧬 **Molecules Analyzed**: ${stats.molecules}
- ⚡ **SCF Energies**: ${stats.scfEnergies}
- 🔗 **HOMO-LUMO Gaps**: ${stats.homoLumoGaps}
- 🎵 **Vibrational Frequencies**: ${stats.frequencies}
- ⚛️ **Total Atoms**: ${stats.atoms}

📄 **Files & Updates**:
- 📁 **Files Processed**: ${stats.processedFiles}
- 🕒 **Last Updated**: ${new Date(stats.lastModified).toLocaleString()}`;

                    // Add enhanced cclib statistics if available
                    if (stats.enhanced && stats.thermochemistry) {
                        responseText += `\n\n🌡️ **Thermochemical Properties** (cclib):
- 🔥 **Enthalpy Calculations**: ${stats.thermochemistry.enthalpy}
- 📊 **Entropy Calculations**: ${stats.thermochemistry.entropy}
- ⚡ **Free Energy Data**: ${stats.thermochemistry.freeEnergy}
- 🔬 **ZPVE Corrections**: ${stats.thermochemistry.zpve}`;
                    }

                    if (stats.enhanced && stats.spectroscopy) {
                        responseText += `\n\n🌈 **Spectroscopic Data** (cclib):
- 🌟 **Electronic Transitions**: ${stats.spectroscopy.electronicTransitions}
- 📊 **IR Intensities**: ${stats.spectroscopy.irIntensities}
- 🔍 **Raman Activities**: ${stats.spectroscopy.ramanActivities}
- 💫 **Oscillator Strengths**: ${stats.spectroscopy.oscillatorStrengths}`;
                    }

                    if (stats.enhanced && stats.basisSet) {
                        responseText += `\n\n🧮 **Basis Set Information** (cclib):
- 🌐 **Molecular Orbitals**: ${stats.basisSet.molecularOrbitals}
- 🎯 **Basis Functions**: ${stats.basisSet.basisFunctions}
- ⚛️ **Atomic Orbitals**: ${stats.basisSet.atomicOrbitals}`;
                    }

                    if (stats.enhanced && stats.optimization) {
                        responseText += `\n\n🎯 **Optimization Status** (cclib):
- ✅ **Converged**: ${stats.optimization.convergedCalculations}
- ❌ **Failed**: ${stats.optimization.failedOptimizations}`;
                    }

                    if (stats.enhanced && stats.molecularProperties) {
                        responseText += `\n\n🧬 **Molecular Properties** (cclib):
- 📋 **Molecular Formulas**: ${stats.molecularProperties.molecularFormulas}
- ⚡ **System Charges**: ${stats.molecularProperties.charges}
- 🎭 **Multiplicities**: ${stats.molecularProperties.multiplicities}`;
                    }
                }
            } else {
                // Query the knowledge graph with enhanced patterns
                const result = await knowledgeService.queryKnowledgeGraph(query);
                
                if (result.error) {
                    responseText = `❌ Error querying knowledge graph: ${result.error}`;
                } else {
                    responseText = `🔍 **Query Results for**: "${query}"

📊 **Current Knowledge Base**:
- 🧪 **${result.stats.molecules}** molecules analyzed
- ⚡ **${result.stats.scfEnergies}** SCF energies
- 🎵 **${result.stats.frequencies}** vibrational frequencies  
- ⚛️ **${result.stats.atoms}** atoms total
- 🔬 **Parser**: ${result.enhanced ? 'cclib (enhanced)' : 'basic'}`;

                    // Add enhanced statistics if available
                    if (result.enhanced && result.stats.thermochemistry) {
                        responseText += `\n- 🌡️ **${result.stats.thermochemistry.enthalpy}** enthalpy values
- 📊 **${result.stats.thermochemistry.entropy}** entropy values
- ⚡ **${result.stats.thermochemistry.freeEnergy}** free energy values`;
                    }

                    if (result.enhanced && result.stats.spectroscopy) {
                        responseText += `\n- 🌟 **${result.stats.spectroscopy.transitions}** electronic transitions
- 📊 **${result.stats.spectroscopy.irIntensities}** IR intensities
- 🔍 **${result.stats.spectroscopy.ramanActivities}** Raman activities`;
                    }

                    if (result.relevantData && result.relevantData.length > 0) {
                        responseText += `\n\n🎯 **Relevant Data Found**:`;
                        result.relevantData.forEach((line: string, index: number) => {
                            if (line.trim() && !line.startsWith('#')) {
                                // Enhanced parsing for better display
                                let displayLine = line.trim();
                                
                                // Format common patterns more readably
                                displayLine = displayLine.replace(/ontocompchem:hasSCFEnergy\s+(-?\d+\.?\d*)/, 'SCF Energy: $1 Hartree');
                                displayLine = displayLine.replace(/ontocompchem:hasHOMOLUMOGap\s+(-?\d+\.?\d*)/, 'HOMO-LUMO Gap: $1 eV');
                                displayLine = displayLine.replace(/ontocompchem:hasFrequency\s+(-?\d+\.?\d*)/, 'Frequency: $1 cm⁻¹');
                                displayLine = displayLine.replace(/ontocompchem:hasEnthalpy\s+(-?\d+\.?\d*)/, 'Enthalpy: $1 Hartree');
                                displayLine = displayLine.replace(/ontocompchem:hasEntropy\s+(-?\d+\.?\d*)/, 'Entropy: $1 Hartree/K');
                                displayLine = displayLine.replace(/ontocompchem:hasFreeEnergy\s+(-?\d+\.?\d*)/, 'Free Energy: $1 Hartree');
                                displayLine = displayLine.replace(/ontocompchem:hasIRIntensity\s+(-?\d+\.?\d*)/, 'IR Intensity: $1 km/mol');
                                displayLine = displayLine.replace(/ontocompchem:hasRamanActivity\s+(-?\d+\.?\d*)/, 'Raman Activity: $1 Ų/Da');
                                
                                responseText += `\n${index + 1}. ${displayLine}`;
                            }
                        });
                    } else {
                        responseText += `\n\n💡 **No specific matches found**. Try queries like:`;
                        
                        if (result.enhanced) {
                            responseText += `
- "How many molecules with thermochemical data?"
- "Show me electronic transitions"
- "What IR intensities are available?"
- "Tell me about optimization status"
- "What basis set information do we have?"
- "Show me Raman activities"`;
                        } else {
                            responseText += `
- "How many molecules?"
- "Show me SCF energies"
- "What about HOMO-LUMO gaps?"
- "Find frequency data"`;
                        }
                    }
                }
            }

            await runtime.messageManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                content: {
                    text: responseText
                },
                roomId: message.roomId,
            });

            if (callback) {
                await callback({
                    text: responseText
                });
            }

            return true;
        } catch (error) {
            console.error("Error in queryGaussianKnowledgeAction:", error);
            
            await runtime.messageManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                content: {
                    text: `❌ Error processing your query: ${error instanceof Error ? error.message : 'Unknown error'}`
                },
                roomId: message.roomId,
            });
            
            if (callback) {
                await callback({
                    text: `❌ Error processing your query: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How many molecules are in the knowledge graph?"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the knowledge graph statistics for you.",
                    action: "QUERY_GAUSSIAN_KNOWLEDGE",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "🔍 Query Results for: \"How many molecules are in the knowledge graph?\"\n\n📊 Current Knowledge Base:\n- 🧪 **3** molecules analyzed\n- ⚡ **3** SCF energies\n- 🎵 **87** vibrational frequencies\n- ⚛️ **45** atoms total\n- 🔬 **Parser**: cclib (enhanced)",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me thermochemical data"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for thermochemical properties in the knowledge graph.",
                    action: "QUERY_GAUSSIAN_KNOWLEDGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What electronic transitions do we have?"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Searching for electronic transition data and spectroscopic properties.",
                    action: "QUERY_GAUSSIAN_KNOWLEDGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me about basis set information"
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll look for molecular orbital and basis function data in the knowledge graph.",
                    action: "QUERY_GAUSSIAN_KNOWLEDGE",
                },
            },
        ],
    ] as ActionExample[][],
}; 