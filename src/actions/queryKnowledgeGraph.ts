import {
  ActionExample,
  Content,
  IAgentRuntime,
  Memory,
  State,
  type Action,
} from "../types/eliza-core.js";

interface QueryKnowledgeGraphContent extends Content {
  query: string;
  format?: "sparql" | "natural";
}

async function queryQuantumChemistryData(
  runtime: IAgentRuntime,
  query: string,
  format: "sparql" | "natural" = "natural",
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const knowledgeService = runtime.getService("knowledge");
    if (!knowledgeService) {
      throw new Error("Knowledge service not available");
    }

    let results;

    if (format === "sparql") {
      // Direct SPARQL query
      results = await knowledgeService.query(query);
    } else {
      // Natural language query - let Eliza's RAG layer handle translation
      results = await knowledgeService.search(query, {
        limit: 10,
        threshold: 0.7,
        filters: {
          source: "gaussian-kg-plugin",
        },
      });
    }

    return {
      success: true,
      message: "Successfully queried quantum chemistry knowledge graph",
      data: {
        query,
        format,
        results,
        count: Array.isArray(results) ? results.length : 1,
      },
    };
  } catch (error) {
    console.error("Error querying knowledge graph:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Query failed",
    };
  }
}

export const queryKnowledgeGraphAction: Action = {
  name: "QUERY_QUANTUM_CHEMISTRY",
  similes: [
    "SEARCH_QUANTUM_DATA",
    "QUERY_GAUSSIAN_DATA",
    "FIND_CALCULATIONS",
    "SEARCH_MOLECULES",
    "GET_SCF_ENERGIES",
    "FIND_HOMO_LUMO_GAPS",
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const content = message.content as QueryKnowledgeGraphContent;

    // Check if message contains quantum chemistry related query terms
    const queryTerms = [
      "scf energy",
      "homo lumo",
      "b3lyp",
      "dft",
      "quantum",
      "molecular",
      "frequency",
      "optimization",
      "basis set",
      "gaussian",
      "calculation",
      "dipole moment",
      "geometry",
      "orbital",
      "electron",
    ];

    const text =
      content.text?.toLowerCase() || content.query?.toLowerCase() || "";
    const hasQuantumTerms = queryTerms.some((term) => text.includes(term));
    const hasQuery = !!(content.query || content.text);

    return hasQuery && hasQuantumTerms;
  },
  description:
    "Query the quantum chemistry knowledge graph for calculation data and molecular properties",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown } = {},
    callback?: () => void,
  ): Promise<boolean> => {
    try {
      const content = message.content as QueryKnowledgeGraphContent;
      const query = content.query || content.text || "";
      const format = content.format || "natural";

      const result = await queryQuantumChemistryData(runtime, query, format);

      if (result.success) {
        // Format and present results
        let responseText = `🔍 Found ${result.data?.count || 0} results for your quantum chemistry query:\n\n`;

        if (result.data?.results && Array.isArray(result.data.results)) {
          result.data.results
            .slice(0, 5)
            .forEach((item: any, index: number) => {
              responseText += `${index + 1}. ${item.title || item.name || "Calculation"}\n`;
              if (item.scf_energy)
                responseText += `   SCF Energy: ${item.scf_energy} eV\n`;
              if (item.method) responseText += `   Method: ${item.method}\n`;
              if (item.basis_set)
                responseText += `   Basis Set: ${item.basis_set}\n`;
              responseText += "\n";
            });
        } else if (result.data?.results) {
          responseText += JSON.stringify(result.data.results, null, 2);
        }

        await runtime.messageManager.createMemory({
          userId: message.userId,
          content: {
            text: responseText,
            metadata: result.data,
          },
          roomId: message.roomId,
        });
      } else {
        await runtime.messageManager.createMemory({
          userId: message.userId,
          content: {
            text: `❌ Failed to query knowledge graph: ${result.message}`,
            error: result.message,
          },
          roomId: message.roomId,
        });
      }

      if (callback) {
        callback();
      }

      return result.success;
    } catch (error) {
      console.error("Error in queryKnowledgeGraphAction:", error);
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "What are the SCF energies for all B3LYP calculations?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll search the quantum chemistry knowledge graph for B3LYP calculations and their SCF energies.",
          action: "QUERY_QUANTUM_CHEMISTRY",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "🔍 Found 3 results for your quantum chemistry query:\n\n1. Benzene B3LYP Optimization\n   SCF Energy: -232.24 eV\n   Method: B3LYP\n   Basis Set: 6-31G(d)\n\n2. Methane B3LYP Calculation\n   SCF Energy: -40.52 eV\n   Method: B3LYP\n   Basis Set: 6-31G(d)",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show me molecular geometries with HOMO-LUMO gaps larger than 4 eV",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll search for molecules with HOMO-LUMO gaps above 4 eV in the quantum chemistry database.",
          action: "QUERY_QUANTUM_CHEMISTRY",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Find all frequency calculations for organic molecules",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll look for vibrational frequency calculations on organic molecules.",
          action: "QUERY_QUANTUM_CHEMISTRY",
        },
      },
    ],
  ] as ActionExample[][],
};
