import { Plugin, Service, IAgentRuntime, Action } from '@elizaos/core';

declare class CompchemService extends Service {
    static serviceType: string;
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<CompchemService>;
    static stop(runtime: IAgentRuntime): Promise<void>;
    stop(): Promise<void>;
}
declare const myCompchemPlugin: Plugin;

declare class AutoKnowledgeService extends Service {
    static serviceType: string;
    capabilityDescription: string;
    private knowledgeGraphPath;
    private watchedDirectory;
    private processedFiles;
    private isInitialized;
    private fileWatcher;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<AutoKnowledgeService>;
    initialize(): Promise<void>;
    static stop(runtime: IAgentRuntime): Promise<void>;
    stop(): Promise<void>;
    private stopWatching;
    private loadOrCreateKnowledgeGraph;
    private createInitialKnowledgeGraph;
    private scanExistingFiles;
    private startFileWatcher;
    private processFileAutomatically;
    getStats(): Promise<any>;
    searchKnowledgeGraph(query: string): Promise<any>;
    getEnergies(): Promise<any>;
    getMolecularData(): Promise<any>;
    isFileProcessed(filename: string): boolean;
}

declare const autoKnowledgeAction: Action;

declare class PythonService extends Service {
    static serviceType: string;
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<PythonService>;
    stop(): Promise<void>;
    /**
     * Execute a Python script using execFile (for simple scripts that return JSON)
     */
    executePythonScript(scriptPath: string, args?: string[], options?: {
        timeout?: number;
    }): Promise<string>;
    /**
     * Execute Python script with streaming output (for long-running processes)
     */
    executePythonScriptStreaming(scriptPath: string, args?: string[], onData?: (data: string) => void, onError?: (data: string) => void): Promise<string>;
    /**
     * Analyze molecular data using Python
     */
    analyzeMolecularData(molecularData: any, analysisType?: 'molecular' | 'energy' | 'visualization'): Promise<any>;
    /**
     * Generate visualization charts using Python matplotlib
     */
    generateVisualization(chartType: string, plotData: any, outputDir: string): Promise<any>;
    /**
     * Parse Gaussian log files using cclib
     */
    parseGaussianFile(filePath: string, metadata?: any, outputFormat?: 'json' | 'turtle'): Promise<any>;
    /**
     * Generate analysis plots using matplotlib
     */
    generateAnalysisPlots(chartType: string, data: any, outputPath?: string): Promise<any>;
    /**
     * Generate comprehensive report using Python
     */
    generateComprehensiveReport(reportData: any, outputDir: string): Promise<any>;
    /**
     * Check if Python and required packages are available
     */
    checkPythonEnvironment(): Promise<{
        pythonAvailable: boolean;
        pythonVersion?: string;
        packagesAvailable: string[];
        packagesMissing: string[];
        cclibAvailable: boolean;
    }>;
    /**
     * Ensure Python files are deployed and available
     */
    private ensurePythonFilesDeployed;
}

/**
 * Action for analyzing molecular data using Python computational chemistry tools
 */
declare const analyzeMolecularDataAction: Action;

declare const generateVisualizationAction: Action;

declare const generateReportAction: Action;

/**
 * Action for parsing Gaussian log files using cclib
 */
declare const parseGaussianFileAction: Action;

/**
 * Diagnostic action to help debug path and environment issues
 */
declare const diagnosticsAction: Action;

export { AutoKnowledgeService, CompchemService, PythonService, analyzeMolecularDataAction, autoKnowledgeAction, myCompchemPlugin as default, diagnosticsAction, generateReportAction, generateVisualizationAction, myCompchemPlugin, parseGaussianFileAction };
