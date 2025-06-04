import type { Plugin } from "@elizaos/core";
import { queryGaussianKnowledgeAction } from "./actions/queryGaussianKnowledge.js";
import { GaussianKnowledgeService } from "./services/gaussianKnowledgeService.js";

const gaussianKnowledgeGraphPlugin: Plugin = {
    name: "gaussian-kg",
    description: "Automatically monitors example_logs directory, parses Gaussian files, and maintains a persistent knowledge graph for natural language querying",
    actions: [
        queryGaussianKnowledgeAction,
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
    } catch (error) {
        console.error("❌ Failed to initialize Gaussian Knowledge Plugin:", error);
    }
}

export default gaussianKnowledgeGraphPlugin;

// Export individual components for modularity
export { queryGaussianKnowledgeAction, GaussianKnowledgeService }; 