import type { Plugin } from "@elizaos/core";
import { queryGaussianKnowledgeAction } from "./actions/queryGaussianKnowledge.js";
import { plotKnowledgeGraphAction } from "./actions/plotKnowledgeGraph.js";
import { analyzeMolecularDataAction } from "./actions/analyzeMolecularData.js";
import { exportKnowledgeDataAction } from "./actions/exportKnowledgeData.js";
import { generateComprehensiveReportAction } from "./actions/generateComprehensiveReport.js";
import { GaussianKnowledgeService } from "./services/gaussianKnowledgeService.js";

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
        // Register the service with the runtime using a direct approach
        runtime.services.set("gaussian-knowledge", service);
        console.log("✅ Gaussian Knowledge Plugin initialized successfully");
        console.log("🎯 Available actions:");
        console.log("   - Query knowledge graph data");
        console.log("   - Plot and visualize molecular networks");
        console.log("   - Analyze molecular data trends");
        console.log("   - Export data in multiple formats");
        console.log("   - Generate comprehensive research reports");
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
    GaussianKnowledgeService 
}; 