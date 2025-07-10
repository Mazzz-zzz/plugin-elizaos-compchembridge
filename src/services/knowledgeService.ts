import { IAgentRuntime, Service, logger } from "@elizaos/core";
import { promises as fs } from "fs";
import * as path from "path";

export class CompchemKnowledgeService extends Service {
    static serviceType = 'compchem-knowledge';
    capabilityDescription = "Manages persistent knowledge graph storage for computational chemistry data using RDF/Turtle format";
    
    private knowledgeGraphPath: string;
    private processedFiles: Set<string> = new Set();
    private isInitialized = false;

    constructor(runtime: IAgentRuntime) {
        super(runtime);
        this.knowledgeGraphPath = "";
    }

    static async start(runtime: IAgentRuntime): Promise<CompchemKnowledgeService> {
        const service = new CompchemKnowledgeService(runtime);
        await service.initialize(runtime);
        logger.info("🧠 Computational Chemistry Knowledge Service started with persistent TTL storage");
        return service;
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
        if (this.isInitialized) return;
        
        // Set up knowledge graph path
        const dataDir = this.runtime.getSetting('COMPCHEM_DATA_DIR') || './data';
        this.knowledgeGraphPath = path.join(dataDir, "compchem-knowledge-graph.ttl");

        try {
            // Ensure data directory exists
            await fs.mkdir(path.dirname(this.knowledgeGraphPath), { recursive: true });
            
            // Load existing knowledge graph or create new one
            await this.loadOrCreateKnowledgeGraph();
            
            this.isInitialized = true;
            logger.info(`📊 Knowledge graph initialized: ${this.knowledgeGraphPath}`);
            
        } catch (error) {
            logger.error("❌ Failed to initialize Computational Chemistry Knowledge Service:", error);
            throw error;
        }
    }

    static async stop(runtime: IAgentRuntime): Promise<void> {
        logger.info('🧠 Computational Chemistry Knowledge Service stopped');
    }

    async stop(): Promise<void> {
        logger.info('🧠 Computational Chemistry Knowledge Service stopped');
    }

    private async loadOrCreateKnowledgeGraph(): Promise<void> {
        try {
            const stats = await fs.stat(this.knowledgeGraphPath);
            if (stats.isFile()) {
                logger.info("📖 Loading existing knowledge graph...");
                const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
                logger.info(`📊 Loaded knowledge graph (${content.length} bytes)`);
                
                // Extract processed files from existing content
                this.extractProcessedFiles(content);
            }
        } catch (error) {
            // File doesn't exist, create initial knowledge graph
            logger.info("🆕 Creating new knowledge graph...");
            await this.createInitialKnowledgeGraph();
        }
    }

    private async createInitialKnowledgeGraph(): Promise<void> {
        const initialRDF = `@prefix cheminf: <http://semanticscience.org/resource/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix ex: <https://example.org/compchem#> .
@prefix ontocompchem: <http://www.theworldavatar.com/ontology/ontocompchem/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix units: <http://www.ontology-of-units-of-measure.org/resource/om-2/> .

# Computational Chemistry Knowledge Graph - ElizaOS Plugin v2
# Created: ${new Date().toISOString()}
# Auto-generated knowledge base for molecular calculations

ex:knowledgeBase a ontocompchem:KnowledgeBase ;
    dcterms:title "Computational Chemistry Knowledge Graph" ;
    dcterms:created "${new Date().toISOString()}"^^xsd:dateTime ;
    dcterms:description "Persistent knowledge graph for computational chemistry calculations" ;
    ontocompchem:hasVersion "2.0" ;
    prov:wasGeneratedBy ex:elizaosPlugin .

ex:elizaosPlugin a prov:SoftwareAgent ;
    rdfs:label "ElizaOS Computational Chemistry Plugin v2" ;
    prov:actedOnBehalfOf ex:user .

ex:user a prov:Agent ;
    rdfs:label "ElizaOS User" .

`;
        await fs.writeFile(this.knowledgeGraphPath, initialRDF, 'utf-8');
        logger.info("✅ Initial knowledge graph created");
    }

    private extractProcessedFiles(content: string): void {
        // Extract filenames from RDF comments to track processed files
        const fileMatches = content.match(/# Data from: (.+?) \(/g);
        if (fileMatches) {
            for (const match of fileMatches) {
                const filename = match.replace('# Data from: ', '').replace(' (', '');
                this.processedFiles.add(filename);
            }
        }
        logger.info(`📝 Found ${this.processedFiles.size} previously processed files`);
    }

    /**
     * Add RDF data to the knowledge graph
     */
    async addKnowledgeData(rdfContent: string, sourcePath: string): Promise<void> {
        try {
            const filename = path.basename(sourcePath);
            
            // Check if already processed
            if (this.processedFiles.has(filename)) {
                logger.warn(`⚠️  File ${filename} already processed, skipping...`);
                return;
            }

            // Add comment header for this file
            const header = `\n# Data from: ${filename} (processed ${new Date().toISOString()})\n`;
            const contentToAppend = header + rdfContent + '\n';
            
            await fs.appendFile(this.knowledgeGraphPath, contentToAppend, 'utf-8');
            
            // Mark as processed
            this.processedFiles.add(filename);
            
            const tripleCount = (rdfContent.match(/\./g) || []).length;
            logger.info(`✅ Added ${tripleCount} triples from ${filename} to knowledge graph`);
        } catch (error) {
            logger.error("❌ Error adding knowledge data:", error);
            throw error;
        }
    }

    /**
     * Query the knowledge graph (basic text search for now)
     */
    async queryKnowledgeGraph(query: string): Promise<any> {
        try {
            const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
            
            // Enhanced statistics
            const stats = {
                totalTriples: (content.match(/\./g) || []).length,
                molecules: (content.match(/ontocompchem:QuantumCalculation/g) || []).length,
                scfEnergies: (content.match(/ontocompchem:hasSCFEnergy/g) || []).length,
                homoLumoGaps: (content.match(/ontocompchem:hasHOMOLUMOGap/g) || []).length,
                frequencies: (content.match(/ontocompchem:hasFrequency/g) || []).length,
                atoms: (content.match(/cheminf:Atom/g) || []).length,
                processedFiles: this.processedFiles.size,
                lastUpdated: new Date().toISOString()
            };

            // Simple text search for queries
            const queryLower = query.toLowerCase();
            const lines = content.split('\n');
            
            const results = [];
            let currentMolecule = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.includes('# Data from:')) {
                    currentMolecule = line.replace('# Data from:', '').trim();
                }
                
                if (line.toLowerCase().includes(queryLower)) {
                    results.push({
                        line: line.trim(),
                        source: currentMolecule,
                        lineNumber: i + 1
                    });
                }
            }

            return {
                query,
                stats,
                results: results.slice(0, 10), // Limit results
                totalMatches: results.length
            };
        } catch (error) {
            logger.error("❌ Error querying knowledge graph:", error);
            return { error: error.message };
        }
    }

    /**
     * Get knowledge graph statistics
     */
    async getKnowledgeGraphStats(): Promise<any> {
        try {
            const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
            const stats = await fs.stat(this.knowledgeGraphPath);
            
            return {
                file: {
                    path: this.knowledgeGraphPath,
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString()
                },
                content: {
                    totalLines: content.split('\n').length,
                    totalTriples: (content.match(/\./g) || []).length,
                    totalBytes: content.length
                },
                entities: {
                    molecules: (content.match(/ontocompchem:QuantumCalculation/g) || []).length,
                    scfEnergies: (content.match(/ontocompchem:SCFEnergy/g) || []).length,
                    homoLumoGaps: (content.match(/ontocompchem:HOMOLUMOGap/g) || []).length,
                    frequencies: (content.match(/ontocompchem:VibrationalFrequency/g) || []).length,
                    atoms: (content.match(/cheminf:Atom/g) || []).length
                },
                processing: {
                    processedFiles: this.processedFiles.size,
                    processedFilesList: Array.from(this.processedFiles)
                }
            };
        } catch (error) {
            logger.error("❌ Error getting knowledge graph stats:", error);
            return { error: error.message };
        }
    }

    /**
     * Check if a file has been processed
     */
    isFileProcessed(filename: string): boolean {
        return this.processedFiles.has(filename);
    }

    /**
     * Get the knowledge graph file path
     */
    getKnowledgeGraphPath(): string {
        return this.knowledgeGraphPath;
    }

    /**
     * Read the full knowledge graph content
     */
    async getKnowledgeGraphContent(): Promise<string> {
        try {
            return await fs.readFile(this.knowledgeGraphPath, 'utf-8');
        } catch (error) {
            logger.error("❌ Error reading knowledge graph content:", error);
            return '';
        }
    }
} 