import { IAgentRuntime, Service, logger } from "@elizaos/core";
import { promises as fs } from "fs";
import { watch } from "fs";
import * as path from "path";
import { PythonService } from "./pythonService";

export class AutoKnowledgeService extends Service {
    static serviceType = 'auto-knowledge';
    capabilityDescription = "Automatically monitors data/examples directory and builds knowledge graph from Gaussian files";
    
    private knowledgeGraphPath: string;
    private watchedDirectory: string;
    private processedFiles: Set<string> = new Set();
    private isInitialized = false;
    private fileWatcher: any = null;

    constructor(runtime: IAgentRuntime) {
        super(runtime);
        this.knowledgeGraphPath = "";
        this.watchedDirectory = "";
    }

    static async start(runtime: IAgentRuntime): Promise<AutoKnowledgeService> {
        const service = new AutoKnowledgeService(runtime);
        await service.initialize();
        logger.info("🧠 Auto Knowledge Service started - watching data/examples/ for Gaussian files");
        return service;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        // Set up paths (simpler than v2 approach)
        this.knowledgeGraphPath = path.join(process.cwd(), "data", "auto-knowledge-graph.ttl");
        this.watchedDirectory = path.join(process.cwd(), "data", "examples");

        try {
            // Ensure directories exist
            await fs.mkdir(path.dirname(this.knowledgeGraphPath), { recursive: true });
            await fs.mkdir(this.watchedDirectory, { recursive: true });
            
            // Load or create knowledge graph
            await this.loadOrCreateKnowledgeGraph();
            
            // Process existing files
            await this.scanExistingFiles();
            
            // Start watching for new files (like v1)
            this.startFileWatcher();
            
            this.isInitialized = true;
            logger.info(`📊 Auto knowledge graph: ${this.knowledgeGraphPath}`);
            logger.info(`👀 Watching directory: ${this.watchedDirectory}`);
        } catch (error) {
            logger.error("❌ Failed to initialize Auto Knowledge Service:", error);
        }
    }

    static async stop(runtime: IAgentRuntime): Promise<void> {
        const service = runtime.getService('auto-knowledge') as AutoKnowledgeService;
        if (service) {
            service.stopWatching();
        }
        logger.info('🧠 Auto Knowledge Service stopped');
    }

    async stop(): Promise<void> {
        this.stopWatching();
    }

    private stopWatching(): void {
        if (this.fileWatcher) {
            this.fileWatcher.close();
            this.fileWatcher = null;
        }
    }

    private async loadOrCreateKnowledgeGraph(): Promise<void> {
        try {
            const stats = await fs.stat(this.knowledgeGraphPath);
            if (stats.isFile()) {
                logger.info("📖 Loading existing auto knowledge graph...");
                const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
                
                // Extract processed files from comments
                const fileMatches = content.match(/# File: (.+\.log)/g);
                if (fileMatches) {
                    for (const match of fileMatches) {
                        const filename = match.replace('# File: ', '');
                        this.processedFiles.add(filename);
                    }
                }
                logger.info(`📊 Found ${this.processedFiles.size} previously processed files`);
            }
        } catch (error) {
            // Create new knowledge graph
            logger.info("🆕 Creating new auto knowledge graph...");
            await this.createInitialKnowledgeGraph();
        }
    }

    private async createInitialKnowledgeGraph(): Promise<void> {
        const initialContent = `# Auto Knowledge Graph - ElizaOS Plugin v2
# Created: ${new Date().toISOString()}
# Files are automatically processed when added to data/examples/

@prefix ex: <https://example.org/auto#> .
@prefix ontocompchem: <http://www.theworldavatar.com/ontology/ontocompchem/> .
@prefix cheminf: <http://semanticscience.org/resource/> .

`;
        await fs.writeFile(this.knowledgeGraphPath, initialContent, 'utf-8');
        logger.info("✅ Auto knowledge graph created");
    }

    // Automatic file monitoring (like v1)
    private async scanExistingFiles(): Promise<void> {
        try {
            const files = await fs.readdir(this.watchedDirectory);
            const gaussianFiles = files.filter(file => 
                file.toLowerCase().endsWith('.log') || file.toLowerCase().endsWith('.out')
            );

            logger.info(`🔍 Found ${gaussianFiles.length} existing Gaussian files`);

            for (const file of gaussianFiles) {
                const filePath = path.join(this.watchedDirectory, file);
                if (!this.processedFiles.has(file)) {
                    await this.processFileAutomatically(filePath);
                }
            }
        } catch (error) {
            logger.warn("⚠️  Could not scan existing files:", error.message);
        }
    }

    private startFileWatcher(): void {
        try {
            this.fileWatcher = watch(this.watchedDirectory, { recursive: false }, async (eventType, filename) => {
                if (!filename) return;
                
                // Only process Gaussian files
                if (!filename.toLowerCase().endsWith('.log') && !filename.toLowerCase().endsWith('.out')) {
                    return;
                }

                const filePath = path.join(this.watchedDirectory, filename);

                if (eventType === 'rename' || eventType === 'change') {
                    try {
                        // Check if file exists and is accessible
                        await fs.access(filePath);
                        
                        // Skip if already processed
                        if (this.processedFiles.has(filename)) {
                            return;
                        }

                        logger.info(`🆕 New Gaussian file detected: ${filename}`);
                        await this.processFileAutomatically(filePath);
                    } catch (error) {
                        // File was deleted or inaccessible
                        logger.debug(`File no longer accessible: ${filename}`);
                    }
                }
            });
            
            logger.info("👀 File watcher started");
        } catch (error) {
            logger.warn("⚠️  Could not start file watcher:", error.message);
        }
    }

    private async processFileAutomatically(filePath: string): Promise<void> {
        const filename = path.basename(filePath);
        
        try {
            // Get Python service
            const pythonService = this.runtime.getService<PythonService>('python-execution');
            if (!pythonService) {
                logger.warn("⚠️  Python service not available, skipping file processing");
                return;
            }

            logger.info(`⚙️  Auto-processing: ${filename}`);

            const metadata = {
                filename,
                timestamp: new Date().toISOString(),
                source: "auto-monitor",
                parser: "cclib"
            };

            // Parse file to RDF
            logger.info(`🔍 Calling Python service to parse ${filename}...`);
            const rdfResult = await pythonService.parseGaussianFile(filePath, metadata, 'turtle');
            
            // Add detailed logging to see what we got back
            logger.info(`📝 Python service returned:`, {
                type: typeof rdfResult,
                isString: typeof rdfResult === 'string',
                hasError: rdfResult && typeof rdfResult === 'object' && 'error' in rdfResult,
                length: typeof rdfResult === 'string' ? rdfResult.length : 'N/A',
                preview: typeof rdfResult === 'string' ? rdfResult.substring(0, 100) + '...' : rdfResult
            });
            
            // Handle both string and object results from Python service
            let rdfContent: string | null = null;
            let success = false;

            if (typeof rdfResult === 'string') {
                // Direct string result
                rdfContent = rdfResult;
                success = true;
            } else if (rdfResult && typeof rdfResult === 'object') {
                if (rdfResult.error) {
                    logger.error(`❌ Python parsing error for ${filename}: ${rdfResult.error}`);
                } else if (rdfResult.rdf && typeof rdfResult.rdf === 'string') {
                    // Object with rdf property (turtle format)
                    rdfContent = rdfResult.rdf;
                    success = rdfResult.success !== false;
                } else {
                    logger.error(`❌ Unexpected object format for ${filename}:`, rdfResult);
                }
            } else {
                logger.error(`❌ No result returned from Python service for ${filename}`);
            }

            if (success && rdfContent && rdfContent.trim().length > 0) {
                // Add to knowledge graph
                const header = `\n# File: ${filename} (auto-processed ${new Date().toISOString()})\n`;
                const contentToAppend = header + rdfContent + '\n';
                
                await fs.appendFile(this.knowledgeGraphPath, contentToAppend, 'utf-8');
                
                // Mark as processed
                this.processedFiles.add(filename);
                
                const tripleCount = (rdfContent.match(/\./g) || []).length;
                logger.info(`✅ Auto-added ${tripleCount} triples from ${filename}`);
            } else {
                logger.error(`❌ Could not parse ${filename}: Invalid or empty RDF content`);
            }
        } catch (error) {
            logger.error(`❌ Error auto-processing ${filename}:`, {
                message: error.message,
                stack: error.stack,
                name: error.name,
                fullError: error
            });
        }
    }

    // Simple query method
    async getStats(): Promise<any> {
        try {
            const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
            
            return {
                totalFiles: this.processedFiles.size,
                filesList: Array.from(this.processedFiles),
                molecules: (content.match(/ontocompchem:QuantumCalculation/g) || []).length,
                scfEnergies: (content.match(/ontocompchem:SCFEnergy/g) || []).length,
                atoms: (content.match(/cheminf:Atom/g) || []).length,
                lastUpdate: new Date().toISOString(),
                knowledgeGraphPath: this.knowledgeGraphPath,
                watchedDirectory: this.watchedDirectory
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async searchKnowledgeGraph(query: string): Promise<any> {
        try {
            const content = await fs.readFile(this.knowledgeGraphPath, 'utf-8');
            const lines = content.split('\n');
            
            const results = lines
                .filter(line => line.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10);
            
            return {
                query,
                matches: results.length,
                results
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    isFileProcessed(filename: string): boolean {
        return this.processedFiles.has(filename);
    }
} 