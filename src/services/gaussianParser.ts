import { IAgentRuntime, Service } from "../types/eliza-core.js";

export class GaussianParserService extends Service {
    static serviceType = "gaussian-parser";
    
    capabilityDescription = "Enables the agent to parse Gaussian 16 quantum chemistry logfiles into RDF knowledge graphs using standard ontologies";
    
    private runtime!: IAgentRuntime;

    static async start(runtime: IAgentRuntime): Promise<GaussianParserService> {
        const service = new GaussianParserService();
        service.runtime = runtime;
        
        // Initialize service with runtime settings
        const debugMode = runtime.getSetting("GAUSSIAN_PARSER_DEBUG") === "true";
        const pythonPath = runtime.getSetting("GAUSSIAN_PARSER_PYTHON_PATH") || "python";
        const maxFileSize = runtime.getSetting("GAUSSIAN_PARSER_MAX_FILE_SIZE") || "500";
        
        if (debugMode) {
            console.log("🧪 Gaussian Parser Service initialized with debug mode");
            console.log(`   Python path: ${pythonPath}`);
            console.log(`   Max file size: ${maxFileSize}MB`);
        }
        
        return service;
    }

    async stop(): Promise<void> {
        // Clean up any resources if needed
        console.log("🧪 Gaussian Parser Service stopped");
    }

    async parseGaussianFile(filePath: string, metadata: any = {}): Promise<string> {
        // This method can be called by other services or actions
        const { execFile } = await import("child_process");
        const { promisify } = await import("util");
        const path = await import("path");
        
        const execFileAsync = promisify(execFile);
        const pythonScript = path.join(process.cwd(), "py", "parse_gaussian.py");
        
        try {
            const { stdout: rdfOutput } = await execFileAsync("python", [
                pythonScript,
                filePath,
                JSON.stringify(metadata)
            ]);
            
            return rdfOutput;
        } catch (error) {
            console.error("Error in Gaussian parser service:", error);
            throw error;
        }
    }

    async validateGaussianFile(filePath: string): Promise<boolean> {
        try {
            // Basic validation - check if file contains Gaussian signatures
            const fs = await import("fs/promises");
            const content = await fs.readFile(filePath, 'utf-8');
            
            const gaussianSignatures = [
                'Entering Gaussian',
                'Gaussian 16',
                'Gaussian 09', 
                'Gaussian 03',
                '# ',  // Gaussian route section
                'SCF Done',
                'Normal termination'
            ];

            return gaussianSignatures.some(signature => content.includes(signature));
        } catch (error) {
            console.error("Error validating Gaussian file:", error);
            return false;
        }
    }

    getSupportedFormats(): string[] {
        return ['.log', '.out', '.fchk'];
    }

    // Required Service interface methods
    get serviceType(): string {
        return "gaussian-parser";
    }
} 