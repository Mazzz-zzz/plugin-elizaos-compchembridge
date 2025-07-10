import type { Plugin } from "@elizaos/core";
import { queryGaussianKnowledgeAction } from "./actions/queryGaussianKnowledge.js";
import { plotKnowledgeGraphAction } from "./actions/plotKnowledgeGraph.js";
import { analyzeMolecularDataAction } from "./actions/analyzeMolecularData.js";
import { exportKnowledgeDataAction } from "./actions/exportKnowledgeData.js";
import { generateComprehensiveReportAction } from "./actions/generateComprehensiveReport.js";

import { GaussianKnowledgeService } from "./services/gaussianKnowledgeService.js";
import { GaussianParserService } from "./services/gaussianParser.js";

const gaussianKnowledgeGraphPlugin: Plugin = {
    name: "gaussian-kg",
    description: "Comprehensive Gaussian computational chemistry plugin with knowledge graph management, visualization, analysis, and export capabilities",
    actions: [
        queryGaussianKnowledgeAction,
        plotKnowledgeGraphAction,
        analyzeMolecularDataAction,
        exportKnowledgeDataAction,
        generateComprehensiveReportAction,
    ],
    evaluators: [],
    providers: [],
};

// Custom initialization function for the plugin
export async function initializeGaussianKnowledgePlugin(runtime: any) {
    try {
        const service = await GaussianKnowledgeService.start(runtime);
        const parserService = await GaussianParserService.start(runtime);
        
        // Register services with the runtime
        runtime.services.set("gaussian-knowledge", service);
        runtime.services.set("gaussian-parser", parserService);
        
        console.log("✅ Gaussian Knowledge Plugin initialized successfully");
        console.log("🎯 Available actions:");
        console.log("   - Query knowledge graph data");
        console.log("   - Plot and visualize molecular networks");
        console.log("   - Analyze molecular data trends");
        console.log("   - Export data in multiple formats");
        console.log("   - Generate comprehensive research reports");
        console.log("🔧 Services:");
        console.log("   - Gaussian Knowledge Service (auto file monitoring)");
        console.log("   - Gaussian Parser Service (standalone parsing)");
        console.log("🔬 Enhanced capabilities:");
        console.log("   - Dual parser support (basic + cclib)");
        console.log("   - Professional matplotlib visualizations");
        console.log("   - Statistical analysis tools");
        console.log("   - Data quality assessment");
    } catch (error) {
        console.error("❌ Failed to initialize Gaussian Knowledge Plugin:", error);
    }
}

export default gaussianKnowledgeGraphPlugin;

// Export individual components for modularity
export { 
    queryGaussianKnowledgeAction, 
    plotKnowledgeGraphAction,
    analyzeMolecularDataAction,
    exportKnowledgeDataAction,
    generateComprehensiveReportAction,
    GaussianKnowledgeService,
    GaussianParserService
}; 