import {
  ActionExample,
  Content,
  IAgentRuntime,
  Memory,
  State,
  type Action,
  HandlerCallback,
} from "@elizaos/core";

interface QueryGaussianKnowledgeContent extends Content {
  text: string;
}

export const queryGaussianKnowledgeAction: Action = {
  name: "QUERY_GAUSSIAN_KNOWLEDGE",
  similes: [
    "ASK_ABOUT_CALCULATIONS",
    "SEARCH_QUANTUM_DATA",
    "FIND_MOLECULAR_DATA",
    "GET_CALCULATION_INFO",
    "SHOW_KNOWLEDGE_STATS",
    "WHAT_CALCULATIONS",
    "HOW_MANY_MOLECULES",
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const content = message.content as QueryGaussianKnowledgeContent;
    const text = content.text?.toLowerCase() || "";

    // Keywords that indicate a query about the knowledge graph
    const queryKeywords = [
      "how many",
      "what",
      "show me",
      "find",
      "search",
      "tell me about",
      "energy",
      "energies",
      "molecule",
      "molecules",
      "calculation",
      "calculations",
      "homo",
      "lumo",
      "gap",
      "frequency",
      "frequencies",
      "atom",
      "atoms",
      "scf",
      "dft",
      "basis",
      "method",
      "gaussian",
      "quantum",
      "knowledge graph",
      "stats",
      "statistics",
      "summary",
    ];

    return queryKeywords.some((keyword) => text.includes(keyword));
  },
  description:
    "Query the accumulated Gaussian knowledge graph to answer questions about calculations, molecules, and energies",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback,
  ): Promise<unknown> => {
    try {
      const content = message.content as QueryGaussianKnowledgeContent;
      const query = content.text || "";

      // Get the knowledge service - using any since it's a custom service
      const knowledgeService = runtime.services.get(
        "gaussian-knowledge" as any,
      ) as any;
      if (!knowledgeService) {
        const errorMemory = await runtime.messageManager.createMemory({
          userId: message.userId,
          agentId: message.agentId,
          content: {
            text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized.",
          },
          roomId: message.roomId,
        });
        if (callback) {
          await callback({
            text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized.",
          });
        }
        return false;
      }

      let responseText = "";

      // Handle different types of queries
      if (
        query.toLowerCase().includes("stats") ||
        query.toLowerCase().includes("summary")
      ) {
        // Get overall statistics
        const stats = await knowledgeService.getKnowledgeGraphStats();
        if (stats.error) {
          responseText = `❌ Error getting knowledge graph stats: ${stats.error}`;
        } else {
          responseText = `📊 **Gaussian Knowledge Graph Statistics**

📁 **Storage**: ${(stats.fileSize / 1024).toFixed(1)} KB
🧮 **Total RDF Triples**: ${stats.totalTriples}
🧪 **Molecules Analyzed**: ${stats.molecules}
⚡ **SCF Energies**: ${stats.scfEnergies}
🔗 **HOMO-LUMO Gaps**: ${stats.homoLumoGaps}
🎵 **Vibrational Frequencies**: ${stats.frequencies}
⚛️  **Total Atoms**: ${stats.atoms}
📄 **Files Processed**: ${stats.processedFiles}
🕒 **Last Updated**: ${new Date(stats.lastModified).toLocaleString()}`;
        }
      } else {
        // Query the knowledge graph
        const result = await knowledgeService.queryKnowledgeGraph(query);

        if (result.error) {
          responseText = `❌ Error querying knowledge graph: ${result.error}`;
        } else {
          responseText = `🔍 **Query Results for**: "${query}"

📊 **Current Knowledge Base**:
- 🧪 **${result.stats.molecules}** molecules analyzed
- ⚡ **${result.stats.scfEnergies}** SCF energies
- 🎵 **${result.stats.frequencies}** vibrational frequencies  
- ⚛️  **${result.stats.atoms}** atoms total`;

          if (result.relevantData && result.relevantData.length > 0) {
            responseText += `\n\n🎯 **Relevant Data Found**:`;
            result.relevantData.forEach((line: string, index: number) => {
              if (line.trim() && !line.startsWith("#")) {
                responseText += `\n${index + 1}. ${line.trim()}`;
              }
            });
          } else {
            responseText += `\n\n💡 No specific matches found. Try queries like:
- "How many molecules?"
- "Show me SCF energies"
- "What about HOMO-LUMO gaps?"
- "Find frequency data"`;
          }
        }
      }

      await runtime.messageManager.createMemory({
        userId: message.userId,
        agentId: message.agentId,
        content: {
          text: responseText,
        },
        roomId: message.roomId,
      });

      if (callback) {
        await callback({
          text: responseText,
        });
      }

      return true;
    } catch (error) {
      console.error("Error in queryGaussianKnowledgeAction:", error);

      await runtime.messageManager.createMemory({
        userId: message.userId,
        agentId: message.agentId,
        content: {
          text: `❌ Error processing your query: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
        roomId: message.roomId,
      });

      if (callback) {
        await callback({
          text: `❌ Error processing your query: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }

      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "How many molecules are in the knowledge graph?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll check the knowledge graph statistics for you.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: '🔍 Query Results for: "How many molecules are in the knowledge graph?"\n\n📊 Current Knowledge Base:\n- 🧪 **1** molecules analyzed\n- ⚡ **1** SCF energies\n- 🎵 **39** vibrational frequencies\n- ⚛️  **15** atoms total',
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show me the knowledge graph stats",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll get the current knowledge graph statistics.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What SCF energies do we have?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll search for SCF energy data in the knowledge graph.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Tell me about HOMO-LUMO gaps",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll look for HOMO-LUMO gap information in our quantum chemistry database.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
  ] as ActionExample[][],
};
