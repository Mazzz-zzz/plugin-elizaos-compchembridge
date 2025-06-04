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

interface ExportKnowledgeDataContent extends Content {
    text: string;
}

export const exportKnowledgeDataAction: Action = {
    name: "EXPORT_KNOWLEDGE_DATA",
    similes: [
        "EXPORT_DATA",
        "SAVE_DATA",
        "DOWNLOAD_DATA",
        "EXTRACT_DATA",
        "CONVERT_FORMAT",
        "EXPORT_CSV",
        "EXPORT_JSON",
        "DATA_BACKUP"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const content = message.content as ExportKnowledgeDataContent;
        const text = content.text?.toLowerCase() || '';
        
        const exportKeywords = [
            'export', 'save', 'download', 'extract', 'convert',
            'csv', 'json', 'excel', 'backup', 'format',
            'export data', 'save knowledge graph', 'download results'
        ];
        
        return exportKeywords.some(keyword => text.includes(keyword));
    },
    description: "Export knowledge graph data in various formats including CSV, JSON, Excel, and RDF for external analysis and sharing",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<unknown> => {
        try {
            const content = message.content as ExportKnowledgeDataContent;
            const query = content.text || "";
            
            const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
            if (!knowledgeService) {
                const errorText = "❌ Gaussian knowledge service is not available.";
                if (callback) await callback({ text: errorText });
                return false;
            }

            // Determine export format from query
            const format = determineExportFormat(query);
            
            // Perform data export
            const exportResult = await performDataExport(knowledgeService, format, query);
            
            let responseText = "";
            
            if (exportResult.error) {
                responseText = `❌ Error exporting data: ${exportResult.error}`;
            } else {
                responseText = `📤 **Knowledge Graph Data Export Complete**

📋 **Export Summary**:
- 📁 **Format**: ${exportResult.format.toUpperCase()}
- 📊 **Records Exported**: ${exportResult.recordCount}
- 📦 **File Size**: ${exportResult.fileSize}
- 🕒 **Export Time**: ${new Date().toLocaleString()}

📁 **Generated Files**:`;

                exportResult.files.forEach((file: any) => {
                    responseText += `\n- 📄 **${file.type}**: \`${file.path}\` (${file.size})`;
                });

                responseText += `\n\n📈 **Exported Data Categories**:
- 🧪 **Molecules**: ${exportResult.categories.molecules} entries
- ⚡ **Energies**: ${exportResult.categories.energies} values
- 🎵 **Frequencies**: ${exportResult.categories.frequencies} data points
- ⚛️ **Atoms**: ${exportResult.categories.atoms} atomic data
- 🔗 **Relationships**: ${exportResult.categories.relationships} connections

💡 **Usage Instructions**:
- Import CSV files into Excel, R, or Python pandas
- Use JSON files for web applications or APIs
- Load RDF files into semantic web tools
- Open Excel files for immediate analysis`;

                if (exportResult.metadata) {
                    responseText += `\n\n📝 **Metadata File**: \`${exportResult.metadata}\``;
                }
            }

            await runtime.messageManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                content: { text: responseText },
                roomId: message.roomId,
            });

            if (callback) {
                await callback({ text: responseText });
            }

            return true;
        } catch (error) {
            console.error("Error in exportKnowledgeDataAction:", error);
            const errorText = `❌ Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            if (callback) await callback({ text: errorText });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Export the knowledge graph data as CSV" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll export the knowledge graph data in CSV format.",
                    action: "EXPORT_KNOWLEDGE_DATA",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Download all molecular data in JSON format" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Exporting molecular data in JSON format for download.",
                    action: "EXPORT_KNOWLEDGE_DATA",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Save the data for backup" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Creating a comprehensive backup of all knowledge graph data.",
                    action: "EXPORT_KNOWLEDGE_DATA",
                },
            },
        ],
    ] as ActionExample[][],
};

function determineExportFormat(query: string): string {
    const text = query.toLowerCase();
    
    if (text.includes('csv')) return 'csv';
    if (text.includes('json')) return 'json';
    if (text.includes('excel') || text.includes('xlsx')) return 'excel';
    if (text.includes('rdf') || text.includes('turtle')) return 'rdf';
    if (text.includes('backup')) return 'all';
    
    // Default to CSV for general export requests
    return 'csv';
}

async function performDataExport(knowledgeService: any, format: string, query: string): Promise<any> {
    try {
        // Get knowledge graph data
        const stats = await knowledgeService.getKnowledgeGraphStats();
        const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
        const rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
        
        // Create export directory
        const exportDir = path.join(process.cwd(), "data", "exports");
        await fs.mkdir(exportDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const files: any[] = [];
        let recordCount = 0;
        
        // Parse RDF data
        const parsedData = parseRDFData(rdfContent);
        recordCount = parsedData.molecules.length + parsedData.energies.length + parsedData.frequencies.length;
        
        // Export based on format
        if (format === 'csv' || format === 'all') {
            const csvFiles = await exportToCSV(parsedData, exportDir, timestamp);
            files.push(...csvFiles);
        }
        
        if (format === 'json' || format === 'all') {
            const jsonFile = await exportToJSON(parsedData, exportDir, timestamp);
            files.push(jsonFile);
        }
        
        if (format === 'excel' || format === 'all') {
            const excelFile = await exportToExcel(parsedData, exportDir, timestamp);
            files.push(excelFile);
        }
        
        if (format === 'rdf' || format === 'all') {
            const rdfFile = await exportRDF(rdfContent, exportDir, timestamp);
            files.push(rdfFile);
        }
        
        // Create metadata file
        const metadataFile = await createMetadataFile(parsedData, stats, exportDir, timestamp);
        
        // Calculate total file size
        let totalSize = 0;
        for (const file of files) {
            const stat = await fs.stat(file.fullPath);
            file.size = formatFileSize(stat.size);
            totalSize += stat.size;
        }
        
        return {
            format,
            recordCount,
            fileSize: formatFileSize(totalSize),
            files,
            categories: {
                molecules: parsedData.molecules.length,
                energies: parsedData.energies.length,
                frequencies: parsedData.frequencies.length,
                atoms: parsedData.atoms.length,
                relationships: parsedData.relationships.length
            },
            metadata: metadataFile
        };
    } catch (error) {
        return { error: error.message };
    }
}

function parseRDFData(rdfContent: string): any {
    const molecules: any[] = [];
    const energies: any[] = [];
    const frequencies: any[] = [];
    const atoms: any[] = [];
    const relationships: any[] = [];
    
    const lines = rdfContent.split('\n');
    let currentMolecule = '';
    
    for (const line of lines) {
        if (line.trim() && !line.startsWith('#') && !line.startsWith('@')) {
            // Parse RDF triples
            const match = line.match(/^(\S+)\s+(\S+)\s+(.+?)\s*\.$/);
            if (match) {
                const [, subject, predicate, object] = match;
                
                // Track current molecule
                if (line.includes('QuantumCalculation')) {
                    currentMolecule = subject.split('#').pop() || subject;
                    molecules.push({
                        id: currentMolecule,
                        uri: subject,
                        calculation_type: 'DFT' // Default assumption
                    });
                }
                
                // Extract energies
                if (predicate.includes('hasSCFEnergy')) {
                    const energyValue = object.match(/"?(-?\d+\.?\d*)"?/)?.[1];
                    if (energyValue) {
                        energies.push({
                            molecule: currentMolecule,
                            energy_type: 'SCF',
                            value: parseFloat(energyValue),
                            unit: 'Hartree'
                        });
                    }
                }
                
                // Extract frequencies
                if (predicate.includes('hasFrequency')) {
                    const freqValue = object.match(/"?(-?\d+\.?\d*)"?/)?.[1];
                    if (freqValue) {
                        frequencies.push({
                            molecule: currentMolecule,
                            frequency: parseFloat(freqValue),
                            unit: 'cm-1',
                            type: parseFloat(freqValue) < 0 ? 'imaginary' : 'real'
                        });
                    }
                }
                
                // Extract atom data
                if (predicate.includes('hasAtom')) {
                    atoms.push({
                        molecule: currentMolecule,
                        atom_id: object.split('#').pop() || object,
                        type: 'atom'
                    });
                }
                
                // Track relationships
                relationships.push({
                    subject: subject.split('#').pop() || subject,
                    predicate: predicate.split('#').pop() || predicate,
                    object: object.split('#').pop() || object
                });
            }
        }
    }
    
    return { molecules, energies, frequencies, atoms, relationships };
}

async function exportToCSV(data: any, exportDir: string, timestamp: string): Promise<any[]> {
    const files: any[] = [];
    
    // Export molecules
    if (data.molecules.length > 0) {
        const moleculesCSV = 'id,uri,calculation_type\n' + 
            data.molecules.map((m: any) => `${m.id},${m.uri},${m.calculation_type}`).join('\n');
        const moleculesPath = path.join(exportDir, `molecules-${timestamp}.csv`);
        await fs.writeFile(moleculesPath, moleculesCSV);
        files.push({
            type: 'Molecules CSV',
            path: path.relative(process.cwd(), moleculesPath),
            fullPath: moleculesPath
        });
    }
    
    // Export energies
    if (data.energies.length > 0) {
        const energiesCSV = 'molecule,energy_type,value,unit\n' + 
            data.energies.map((e: any) => `${e.molecule},${e.energy_type},${e.value},${e.unit}`).join('\n');
        const energiesPath = path.join(exportDir, `energies-${timestamp}.csv`);
        await fs.writeFile(energiesPath, energiesCSV);
        files.push({
            type: 'Energies CSV',
            path: path.relative(process.cwd(), energiesPath),
            fullPath: energiesPath
        });
    }
    
    // Export frequencies
    if (data.frequencies.length > 0) {
        const frequenciesCSV = 'molecule,frequency,unit,type\n' + 
            data.frequencies.map((f: any) => `${f.molecule},${f.frequency},${f.unit},${f.type}`).join('\n');
        const frequenciesPath = path.join(exportDir, `frequencies-${timestamp}.csv`);
        await fs.writeFile(frequenciesPath, frequenciesCSV);
        files.push({
            type: 'Frequencies CSV',
            path: path.relative(process.cwd(), frequenciesPath),
            fullPath: frequenciesPath
        });
    }
    
    return files;
}

async function exportToJSON(data: any, exportDir: string, timestamp: string): Promise<any> {
    const jsonData = {
        metadata: {
            exportTime: new Date().toISOString(),
            recordCounts: {
                molecules: data.molecules.length,
                energies: data.energies.length,
                frequencies: data.frequencies.length,
                atoms: data.atoms.length
            }
        },
        data
    };
    
    const jsonPath = path.join(exportDir, `knowledge-graph-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    
    return {
        type: 'Complete JSON',
        path: path.relative(process.cwd(), jsonPath),
        fullPath: jsonPath
    };
}

async function exportToExcel(data: any, exportDir: string, timestamp: string): Promise<any> {
    // Simplified Excel export - in a real implementation, you'd use a library like xlsx
    const excelData = `# Gaussian Knowledge Graph Export
# Generated: ${new Date().toISOString()}

## Molecules
${data.molecules.map((m: any) => `${m.id}\t${m.calculation_type}`).join('\n')}

## Energies  
${data.energies.map((e: any) => `${e.molecule}\t${e.value}\t${e.unit}`).join('\n')}

## Frequencies
${data.frequencies.map((f: any) => `${f.molecule}\t${f.frequency}\t${f.type}`).join('\n')}
`;
    
    const excelPath = path.join(exportDir, `knowledge-graph-${timestamp}.txt`);
    await fs.writeFile(excelPath, excelData);
    
    return {
        type: 'Excel-compatible',
        path: path.relative(process.cwd(), excelPath),
        fullPath: excelPath
    };
}

async function exportRDF(rdfContent: string, exportDir: string, timestamp: string): Promise<any> {
    const rdfPath = path.join(exportDir, `knowledge-graph-${timestamp}.ttl`);
    await fs.writeFile(rdfPath, rdfContent);
    
    return {
        type: 'RDF Turtle',
        path: path.relative(process.cwd(), rdfPath),
        fullPath: rdfPath
    };
}

async function createMetadataFile(data: any, stats: any, exportDir: string, timestamp: string): Promise<string> {
    const metadata = {
        exportInfo: {
            timestamp: new Date().toISOString(),
            exportVersion: '1.0',
            source: 'Gaussian Knowledge Graph Plugin'
        },
        statistics: stats,
        dataCounts: {
            molecules: data.molecules.length,
            energies: data.energies.length,
            frequencies: data.frequencies.length,
            atoms: data.atoms.length,
            relationships: data.relationships.length
        },
        description: 'Exported data from Gaussian quantum chemistry calculations, including molecular structures, energies, frequencies, and atomic data.'
    };
    
    const metadataPath = path.join(exportDir, `metadata-${timestamp}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return path.relative(process.cwd(), metadataPath);
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 