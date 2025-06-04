import { queryGaussianKnowledgeAction } from "../actions/queryGaussianKnowledge";
import { type Content, type HandlerCallback } from "@elizaos/core";

// Define a minimal TestSuite interface that matches what's needed
interface TestSuite {
  name: string;
  description?: string;
  tests: Array<{
    name: string;
    fn: (runtime: any) => Promise<any>;
  }>;
}

// Define minimal interfaces for the types we need
type UUID = `${string}-${string}-${string}-${string}-${string}`;

interface Memory {
  entityId: UUID;
  roomId: UUID;
  content: {
    text: string;
    source: string;
    actions?: string[];
  };
}

interface State {
  values: Record<string, any>;
  data: Record<string, any>;
  text: string;
}

export const QueryGaussianKnowledgeTestSuite: TestSuite = {
  name: "query_gaussian_knowledge_test_suite",
  description: "E2E tests for the Query Gaussian Knowledge action",

  tests: [
    {
      name: "should_have_query_gaussian_knowledge_action",
      fn: async (runtime) => {
        // Check if the action exists and has correct metadata
        if (queryGaussianKnowledgeAction.name !== "QUERY_GAUSSIAN_KNOWLEDGE") {
          throw new Error(
            `Expected action name to be "QUERY_GAUSSIAN_KNOWLEDGE" but got "${queryGaussianKnowledgeAction.name}"`,
          );
        }

        if (
          !queryGaussianKnowledgeAction.description.includes("knowledge graph")
        ) {
          throw new Error("Action description should mention knowledge graph");
        }

        if (
          !Array.isArray(queryGaussianKnowledgeAction.similes) ||
          queryGaussianKnowledgeAction.similes.length === 0
        ) {
          throw new Error("Action should have similes defined");
        }

        if (
          !Array.isArray(queryGaussianKnowledgeAction.examples) ||
          queryGaussianKnowledgeAction.examples.length === 0
        ) {
          throw new Error("Action should have examples defined");
        }
      },
    },
    {
      name: "should_validate_query_keywords",
      fn: async (runtime) => {
        const testCases = [
          { text: "how many molecules", shouldValidate: true },
          { text: "show me stats", shouldValidate: true },
          { text: "find energy data", shouldValidate: true },
          { text: "tell me about homo lumo gap", shouldValidate: true },
          { text: "what calculations do we have", shouldValidate: true },
          { text: "hello there", shouldValidate: false },
          { text: "how are you", shouldValidate: false },
          { text: "random conversation", shouldValidate: false },
        ];

        for (const testCase of testCases) {
          const testMessage: Memory = {
            entityId: "12345678-1234-1234-1234-123456789012" as UUID,
            roomId: "12345678-1234-1234-1234-123456789012" as UUID,
            content: {
              text: testCase.text,
              source: "test",
            },
          };

          const result = await queryGaussianKnowledgeAction.validate(
            runtime,
            testMessage,
          );

          if (result !== testCase.shouldValidate) {
            throw new Error(
              `Validation failed for "${testCase.text}". Expected ${testCase.shouldValidate}, got ${result}`,
            );
          }
        }
      },
    },
    {
      name: "should_handle_missing_knowledge_service",
      fn: async (runtime) => {
        // Create a test message for a stats query
        const testMessage: Memory = {
          entityId: "12345678-1234-1234-1234-123456789012" as UUID,
          roomId: "12345678-1234-1234-1234-123456789012" as UUID,
          content: {
            text: "show me the knowledge graph stats",
            source: "test",
            actions: ["QUERY_GAUSSIAN_KNOWLEDGE"],
          },
        };

        // Create a test state
        const testState: State = {
          values: {},
          data: {},
          text: "",
        };

        let responseReceived = false;
        let errorResponse = "";

        // Create a callback that meets the HandlerCallback interface
        const callback: HandlerCallback = async (response: Content) => {
          if (response.text) {
            responseReceived = true;
            errorResponse = response.text;
          }
          // Return Promise<Memory[]> as required by the HandlerCallback interface
          return Promise.resolve([]);
        };

        // Test the action with a runtime that doesn't have the gaussian-knowledge service
        const result = await queryGaussianKnowledgeAction.handler(
          runtime,
          testMessage,
          testState,
          {},
          callback,
          [],
        );

        // Should return an error result when service is missing
        if (
          typeof result === "object" &&
          result !== null &&
          "success" in result
        ) {
          const typedResult = result as { success: boolean; text: string };
          if (typedResult.success !== false) {
            throw new Error(
              "Expected handler to return success: false when service is missing",
            );
          }
          if (!typedResult.text.includes("not available")) {
            throw new Error(
              "Expected error message about service not being available",
            );
          }
        } else {
          throw new Error(
            "Expected handler to return an object with success and text properties",
          );
        }
      },
    },
    {
      name: "should_handle_knowledge_service_with_stats",
      fn: async (runtime) => {
        // Mock the gaussian-knowledge service
        const mockKnowledgeService = {
          getKnowledgeGraphStats: async () => ({
            fileSize: 2048,
            totalTriples: 1500,
            molecules: 25,
            scfEnergies: 25,
            homoLumoGaps: 20,
            frequencies: 750,
            atoms: 300,
            processedFiles: 5,
            lastModified: Date.now(),
          }),
          queryKnowledgeGraph: async (query: string) => ({
            stats: {
              molecules: 25,
              scfEnergies: 25,
              frequencies: 750,
              atoms: 300,
            },
            relevantData: [
              "Molecule: H2O, SCF Energy: -76.123 eV",
              "HOMO-LUMO Gap: 8.5 eV",
            ],
          }),
        };

        // Register the mock service
        runtime.registerService("gaussian-knowledge", mockKnowledgeService);

        // Create a test message for stats query
        const testMessage: Memory = {
          entityId: "12345678-1234-1234-1234-123456789012" as UUID,
          roomId: "12345678-1234-1234-1234-123456789012" as UUID,
          content: {
            text: "show me the knowledge graph stats",
            source: "test",
            actions: ["QUERY_GAUSSIAN_KNOWLEDGE"],
          },
        };

        // Create a test state
        const testState: State = {
          values: {},
          data: {},
          text: "",
        };

        let responseReceived = false;
        let responseText = "";

        // Create a callback that meets the HandlerCallback interface
        const callback: HandlerCallback = async (response: Content) => {
          if (response.text) {
            responseReceived = true;
            responseText = response.text;
          }
          // Return Promise<Memory[]> as required by the HandlerCallback interface
          return Promise.resolve([]);
        };

        // Test the action
        const result = await queryGaussianKnowledgeAction.handler(
          runtime,
          testMessage,
          testState,
          {},
          callback,
          [],
        );

        // Should return successful result with stats
        if (
          typeof result === "object" &&
          result !== null &&
          "success" in result
        ) {
          const typedResult = result as { success: boolean; text: string };
          if (typedResult.success !== true) {
            throw new Error(
              "Expected handler to return success: true for stats query",
            );
          }
          if (!typedResult.text.includes("Knowledge Graph Statistics")) {
            throw new Error(
              "Expected response to include knowledge graph statistics",
            );
          }
          if (!typedResult.text.includes("25 molecules analyzed")) {
            throw new Error("Expected response to include molecule count");
          }
        } else {
          throw new Error(
            "Expected handler to return an object with success and text properties",
          );
        }
      },
    },
    {
      name: "should_handle_general_query",
      fn: async (runtime) => {
        // Mock the gaussian-knowledge service
        const mockKnowledgeService = {
          getKnowledgeGraphStats: async () => ({
            fileSize: 1024,
            totalTriples: 500,
            molecules: 10,
            scfEnergies: 10,
            homoLumoGaps: 8,
            frequencies: 300,
            atoms: 120,
            processedFiles: 3,
            lastModified: Date.now(),
          }),
          queryKnowledgeGraph: async (query: string) => ({
            stats: {
              molecules: 10,
              scfEnergies: 10,
              frequencies: 300,
              atoms: 120,
            },
            relevantData: [
              "Molecule: CH4, SCF Energy: -40.456 eV",
              "Molecule: NH3, SCF Energy: -56.789 eV",
              "HOMO-LUMO Gap: 7.2 eV",
            ],
          }),
        };

        // Register the mock service
        runtime.registerService("gaussian-knowledge", mockKnowledgeService);

        // Create a test message for general query
        const testMessage: Memory = {
          entityId: "12345678-1234-1234-1234-123456789012" as UUID,
          roomId: "12345678-1234-1234-1234-123456789012" as UUID,
          content: {
            text: "find energy data for molecules",
            source: "test",
            actions: ["QUERY_GAUSSIAN_KNOWLEDGE"],
          },
        };

        // Create a test state
        const testState: State = {
          values: {},
          data: {},
          text: "",
        };

        let responseReceived = false;
        let responseText = "";

        // Create a callback that meets the HandlerCallback interface
        const callback: HandlerCallback = async (response: Content) => {
          if (response.text) {
            responseReceived = true;
            responseText = response.text;
          }
          // Return Promise<Memory[]> as required by the HandlerCallback interface
          return Promise.resolve([]);
        };

        // Test the action
        const result = await queryGaussianKnowledgeAction.handler(
          runtime,
          testMessage,
          testState,
          {},
          callback,
          [],
        );

        // Should return successful result with query results
        if (
          typeof result === "object" &&
          result !== null &&
          "success" in result
        ) {
          const typedResult = result as { success: boolean; text: string };
          if (typedResult.success !== true) {
            throw new Error(
              "Expected handler to return success: true for general query",
            );
          }
          if (!typedResult.text.includes("Query Results for")) {
            throw new Error(
              "Expected response to include query results header",
            );
          }
          if (!typedResult.text.includes("Current Knowledge Base")) {
            throw new Error(
              "Expected response to include knowledge base summary",
            );
          }
          if (!typedResult.text.includes("Relevant Data Found")) {
            throw new Error(
              "Expected response to include relevant data section",
            );
          }
          if (!typedResult.text.includes("CH4, SCF Energy: -40.456 eV")) {
            throw new Error(
              "Expected response to include specific molecule data",
            );
          }
        } else {
          throw new Error(
            "Expected handler to return an object with success and text properties",
          );
        }
      },
    },
    {
      name: "should_handle_service_errors",
      fn: async (runtime) => {
        // Mock the gaussian-knowledge service with error responses
        const mockKnowledgeService = {
          getKnowledgeGraphStats: async () => ({
            error: "Failed to read knowledge graph file",
          }),
          queryKnowledgeGraph: async (query: string) => ({
            error: "SPARQL query execution failed",
          }),
        };

        // Register the mock service
        runtime.registerService("gaussian-knowledge", mockKnowledgeService);

        // Test stats query with service error
        const statsMessage: Memory = {
          entityId: "12345678-1234-1234-1234-123456789012" as UUID,
          roomId: "12345678-1234-1234-1234-123456789012" as UUID,
          content: {
            text: "show stats",
            source: "test",
            actions: ["QUERY_GAUSSIAN_KNOWLEDGE"],
          },
        };

        const testState: State = {
          values: {},
          data: {},
          text: "",
        };

        const callback: HandlerCallback = async (response: Content) => {
          return Promise.resolve([]);
        };

        const statsResult = await queryGaussianKnowledgeAction.handler(
          runtime,
          statsMessage,
          testState,
          {},
          callback,
          [],
        );

        if (
          typeof statsResult === "object" &&
          statsResult !== null &&
          "text" in statsResult
        ) {
          const typedResult = statsResult as { text: string };
          if (
            !typedResult.text.includes("Error getting knowledge graph stats")
          ) {
            throw new Error("Expected error message for stats query failure");
          }
        }

        // Test general query with service error
        const queryMessage: Memory = {
          entityId: "12345678-1234-1234-1234-123456789012" as UUID,
          roomId: "12345678-1234-1234-1234-123456789012" as UUID,
          content: {
            text: "find molecules",
            source: "test",
            actions: ["QUERY_GAUSSIAN_KNOWLEDGE"],
          },
        };

        const queryResult = await queryGaussianKnowledgeAction.handler(
          runtime,
          queryMessage,
          testState,
          {},
          callback,
          [],
        );

        if (
          typeof queryResult === "object" &&
          queryResult !== null &&
          "text" in queryResult
        ) {
          const typedResult = queryResult as { text: string };
          if (!typedResult.text.includes("Error querying knowledge graph")) {
            throw new Error("Expected error message for query failure");
          }
        }
      },
    },
  ],
};

// Export a default instance of the test suite for the E2E test runner
export default QueryGaussianKnowledgeTestSuite;
