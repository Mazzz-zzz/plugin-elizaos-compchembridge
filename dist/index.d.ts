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
     * Generate visualization data using Python
     */
    generateVisualization(molecularData: any, outputPath?: string): Promise<any>;
    /**
     * Parse Gaussian log files using cclib
     */
    parseGaussianFile(filePath: string, metadata?: any, outputFormat?: 'json' | 'turtle'): Promise<any>;
    /**
     * Generate analysis plots using matplotlib
     */
    generateAnalysisPlots(chartType: string, data: any, outputPath?: string): Promise<any>;
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
}

/**
 * Action for analyzing molecular data using Python computational chemistry tools
 */
declare const analyzeMolecularDataAction: Action;

/**
 * Action for generating molecular visualizations using Python tools
 */
declare const generateVisualizationAction: Action;

/**
 * Action for parsing Gaussian log files using cclib
 */
declare const parseGaussianFileAction: Action;

/**
 * Diagnostic action to help debug path and environment issues
 */
declare const diagnosticsAction: Action;

export { CompchemService, PythonService, analyzeMolecularDataAction, myCompchemPlugin as default, diagnosticsAction, generateVisualizationAction, myCompchemPlugin, parseGaussianFileAction };
