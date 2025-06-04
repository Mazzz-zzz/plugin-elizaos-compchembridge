import type { Plugin } from "@elizaos/core";
import { IAgentRuntime, logger } from "@elizaos/core";
import { z } from "zod";

// Import the real plugin components
import { queryGaussianKnowledgeAction } from "./actions/queryGaussianKnowledge.js";
import { GaussianKnowledgeService } from "./services/gaussianKnowledgeService.js";

/**
 * Configuration schema for the Gaussian knowledge graph plugin
 */
const configSchema = z.object({
  GAUSSIAN_API_KEY: z
    .string()
    .min(1, "Gaussian API key is not provided")
    .optional()
    .transform((val) => {
      if (!val) {
        logger.warn(
          "Gaussian API key is not provided (optional for basic functionality)",
        );
      }
      return val;
    }),
});

/**
 * Custom initialization function for the plugin
 */
export async function initializeGaussianKnowledgePlugin(
  runtime: IAgentRuntime,
) {
  try {
    const service = await GaussianKnowledgeService.start(runtime);
    // Register the service with the runtime using a generic approach
    (runtime.services as any).set("gaussian-knowledge", service);
    logger.info("✅ Gaussian Knowledge Plugin initialized successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize Gaussian Knowledge Plugin:", error);
  }
}

/**
 * Main Gaussian Knowledge Graph Plugin
 * Automatically monitors example_logs directory, parses Gaussian files,
 * and maintains a persistent knowledge graph for natural language querying
 */
const gaussianKnowledgeGraphPlugin: Plugin = {
  name: "plugin-gaussian-kg",
  description:
    "Automatically monitors example_logs directory, parses Gaussian 16 files, and maintains a persistent knowledge graph for natural language querying of quantum chemistry calculations",
  config: {
    GAUSSIAN_API_KEY: process.env.GAUSSIAN_API_KEY,
  },

  async init(config: Record<string, string>) {
    logger.info("🧪 Initializing Gaussian Knowledge Graph Plugin...");
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set environment variables
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }

      logger.info("✅ Gaussian Knowledge Graph Plugin configuration validated");
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(", ")}`,
        );
      }
      throw error;
    }
  },

  // Plugin services - the knowledge service that monitors and processes files
  services: [GaussianKnowledgeService as any],

  // Plugin actions - queries and interactions with the knowledge graph
  actions: [queryGaussianKnowledgeAction],

  // Plugin providers - none needed for this plugin
  providers: [],

  // Plugin evaluators - none needed for this plugin
  evaluators: [],

  // Plugin dependencies
  dependencies: ["@elizaos/plugin-knowledge"],

  // Custom routes for API access
  routes: [
    {
      name: "gaussian-kg-stats",
      path: "/gaussian/stats",
      type: "GET",
      handler: async (req: any, res: any) => {
        try {
          // This would get the service from runtime if available
          res.json({
            message: "Gaussian Knowledge Graph Plugin is active",
            status: "monitoring",
            description:
              "Automatically parsing Gaussian files into knowledge graph",
          });
        } catch (error) {
          res.status(500).json({
            error: "Failed to get plugin stats",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    },
  ],

  // Event handlers for file monitoring and processing
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug("Gaussian KG Plugin: MESSAGE_RECEIVED event");
        // Could be used to trigger additional processing
      },
    ],
  },
};

// Export the plugin as default
export default gaussianKnowledgeGraphPlugin;

// Export individual components for modularity
export { queryGaussianKnowledgeAction, GaussianKnowledgeService };
