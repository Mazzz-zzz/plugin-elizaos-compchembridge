import {
  ActionExample,
  Content,
  IAgentRuntime,
  Memory,
  State,
  type Action,
  HandlerCallback,
} from "@elizaos/core";

import {
  QueryGaussianKnowledgeContent,
  GaussianKnowledgeService,
  QUERY_KEYWORDS,
  ACTION_SIMILES,
} from "../types/queryGaussianKnowledge";

export const queryGaussianKnowledgeAction: Action = {
  name: "QUERY_GAUSSIAN_KNOWLEDGE",
  similes: [...ACTION_SIMILES],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const content = message.content as QueryGaussianKnowledgeContent;
    const text = content.text?.toLowerCase() || "";

    // Check if the message contains any of the query keywords
    return QUERY_KEYWORDS.some((keyword) => text.includes(keyword));
  },
  description:
    "Query the accumulated Gaussian knowledge graph to answer questions about calculations, molecules, and energies",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: { [key: string]: unknown } = {},
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    try {
      const content = message.content as QueryGaussianKnowledgeContent;
      const query = content.text || "";

      // Get the knowledge service
      const knowledgeService = runtime.getService("gaussian-knowledge") as unknown as GaussianKnowledgeService | null;
      if (!knowledgeService) {
        await callback?.({
          text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        });
        return true;
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

      await callback?.({
        text: responseText,
        action: "REPLY",
      });

      return true;
    } catch (err: any) {
      await callback?.({
        text: `❌ Error: ${err.message ?? "unknown"}`,
        action: "REPLY",
      });
      return true;
    }
  },
  examples: [
    [
      {
        content: {
          text: "How many molecules are in the knowledge graph?",
        },
      },
      {
        content: {
          text: "I'll check the knowledge graph statistics for you.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
      {
        content: {
          text: '🔍 Query Results for: "How many molecules are in the knowledge graph?"\n\n📊 Current Knowledge Base:\n- 🧪 **1** molecules analyzed\n- ⚡ **1** SCF energies\n- 🎵 **39** vibrational frequencies\n- ⚛️  **15** atoms total',
        },
      },
    ],
    [
      {
        content: {
          text: "Show me the knowledge graph stats",
        },
      },
      {
        content: {
          text: "I'll get the current knowledge graph statistics.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
    [
      {
        content: {
        text: "What SCF energies do we have?",
        },
      },
      {
        content: {
          text: "I'll search for SCF energy data in the knowledge graph.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
    [
      {
        content: {
          text: "Tell me about HOMO-LUMO gaps",
        },
      },
      {
        content: {
          text: "I'll look for HOMO-LUMO gap information in our quantum chemistry database.",
          action: "QUERY_GAUSSIAN_KNOWLEDGE",
        },
      },
    ],
  ] as ActionExample[][],
};
