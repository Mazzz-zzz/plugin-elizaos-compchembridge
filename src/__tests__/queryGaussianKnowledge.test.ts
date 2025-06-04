import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { queryGaussianKnowledgeAction } from "../actions/queryGaussianKnowledge";
import {
  createMockRuntime,
  createMockMemory,
  createMockState,
  setupLoggerSpies,
} from "./test-utils";
import { Content, Memory, State, IAgentRuntime } from "@elizaos/core";

// Setup logger spies
const restoreLoggerSpies = setupLoggerSpies();

afterEach(() => {
  vi.clearAllMocks();
});

describe("queryGaussianKnowledgeAction", () => {
  describe("validate", () => {
    it("should validate messages with query keywords", async () => {
      const mockRuntime = createMockRuntime();

      const queryKeywords = [
        "how many molecules",
        "what calculations",
        "show me stats",
        "find energy",
        "search quantum data",
        "tell me about homo",
        "lumo gap",
        "frequency data",
        "atom count",
        "scf energies",
        "dft method",
        "gaussian calculation",
        "knowledge graph summary",
      ];

      for (const keyword of queryKeywords) {
        const message = createMockMemory({
          content: { text: keyword, source: "test" },
        });

        const result = await queryGaussianKnowledgeAction.validate(
          mockRuntime as unknown as IAgentRuntime,
          message as Memory,
        );

        expect(result).toBe(true);
      }
    });

    it("should not validate messages without query keywords", async () => {
      const mockRuntime = createMockRuntime();

      const nonQueryTexts = [
        "hello there",
        "how are you doing",
        "the weather today",
        "random conversation",
        "tell me a joke",
      ];

      for (const text of nonQueryTexts) {
        const message = createMockMemory({
          content: { text, source: "test" },
        });

        const result = await queryGaussianKnowledgeAction.validate(
          mockRuntime as unknown as IAgentRuntime,
          message as Memory,
        );

        expect(result).toBe(false);
      }
    });

    it("should handle empty or missing text", async () => {
      const mockRuntime = createMockRuntime();

      const emptyMessage = createMockMemory({
        content: { text: "", source: "test" },
      });

      const result = await queryGaussianKnowledgeAction.validate(
        mockRuntime as unknown as IAgentRuntime,
        emptyMessage as Memory,
      );

      expect(result).toBe(false);
    });
  });

  describe("handler", () => {
    let mockRuntime: any;
    let mockKnowledgeService: any;
    let consoleSpy: any;

    beforeEach(() => {
      // Create mock knowledge service
      mockKnowledgeService = {
        getKnowledgeGraphStats: vi.fn(),
        queryKnowledgeGraph: vi.fn(),
      };

      // Create mock runtime with the knowledge service
      mockRuntime = createMockRuntime({
        services: new Map([["gaussian-knowledge", mockKnowledgeService]]),
      });

      // Mock the getService method
      mockRuntime.getService = vi.fn().mockImplementation((serviceName) => {
        if (serviceName === "gaussian-knowledge") {
          return mockKnowledgeService;
        }
        return null;
      });

      // Spy on console.log to verify output
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it("should return false when knowledge service is not available", async () => {
      // Create runtime without the service
      const runtimeWithoutService = createMockRuntime();
      runtimeWithoutService.getService = vi.fn().mockReturnValue(null);

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "how many molecules", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        runtimeWithoutService as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Error Response:",
        expect.stringContaining("Gaussian knowledge service is not available")
      );
    });

    it("should handle stats query successfully", async () => {
      // Mock successful stats response
      const mockStats = {
        fileSize: 2048,
        totalTriples: 1500,
        molecules: 25,
        scfEnergies: 25,
        homoLumoGaps: 20,
        frequencies: 750,
        atoms: 300,
        processedFiles: 5,
        lastModified: Date.now(),
      };

      mockKnowledgeService.getKnowledgeGraphStats.mockResolvedValue(mockStats);

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "show me the stats", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(true);
      expect(mockKnowledgeService.getKnowledgeGraphStats).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Gaussian Knowledge Graph Statistics")
      );
    });

    it("should handle stats query with error", async () => {
      // Mock error response
      mockKnowledgeService.getKnowledgeGraphStats.mockResolvedValue({
        error: "Failed to read knowledge graph file",
      });

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "show stats", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(true); // Still successful even with service error
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Error getting knowledge graph stats")
      );
    });

    it("should handle general query successfully", async () => {
      // Mock successful query response
      const mockQueryResult = {
        stats: {
          molecules: 15,
          scfEnergies: 15,
          frequencies: 450,
          atoms: 180,
        },
        relevantData: [
          "Molecule: H2O, SCF Energy: -76.123 eV",
          "Molecule: CH4, SCF Energy: -40.456 eV",
          "HOMO-LUMO Gap: 8.5 eV",
        ],
      };

      mockKnowledgeService.queryKnowledgeGraph.mockResolvedValue(
        mockQueryResult,
      );

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "find energy data", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(true);
      expect(mockKnowledgeService.queryKnowledgeGraph).toHaveBeenCalledWith(
        "find energy data",
      );

      // Check console output for expected content
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Query Results for")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("**15** molecules analyzed")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Relevant Data Found")
      );
    });

    it("should handle query with no relevant data", async () => {
      // Mock query response with no relevant data
      const mockQueryResult = {
        stats: {
          molecules: 10,
          scfEnergies: 10,
          frequencies: 300,
          atoms: 120,
        },
        relevantData: [],
      };

      mockKnowledgeService.queryKnowledgeGraph.mockResolvedValue(
        mockQueryResult,
      );

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "find rare data", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("No specific matches found")
      );
    });

    it("should handle query service error", async () => {
      // Mock error response
      mockKnowledgeService.queryKnowledgeGraph.mockResolvedValue({
        error: "SPARQL query failed",
      });

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "find molecules", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Error querying knowledge graph")
      );
    });

    it("should handle handler exceptions", async () => {
      // Mock service to throw an exception
      mockKnowledgeService.getKnowledgeGraphStats.mockRejectedValue(
        new Error("Service unavailable"),
      );

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "show stats", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Error Response:",
        expect.stringContaining("Error processing your query")
      );
    });

    it("should handle callback properly", async () => {
      // Mock successful stats response
      const mockStats = {
        fileSize: 1024,
        totalTriples: 500,
        molecules: 5,
        scfEnergies: 5,
        homoLumoGaps: 5,
        frequencies: 150,
        atoms: 60,
        processedFiles: 2,
        lastModified: Date.now(),
      };

      mockKnowledgeService.getKnowledgeGraphStats.mockResolvedValue(mockStats);

      const message = createMockMemory({
        entityId: "12345678-1234-1234-1234-123456789012",
        roomId: "12345678-1234-1234-1234-123456789013",
        content: { text: "show summary", source: "test" },
      });
      const state = createMockState();

      const result = await queryGaussianKnowledgeAction.handler(
        mockRuntime as unknown as IAgentRuntime,
        message as Memory,
        state as State,
        {},
      );

      // Verify the handler completed successfully
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "📤 Response:",
        expect.stringContaining("Gaussian Knowledge Graph Statistics")
      );
    });
  });

  describe("action metadata", () => {
    it("should have correct action name", () => {
      expect(queryGaussianKnowledgeAction.name).toBe(
        "QUERY_GAUSSIAN_KNOWLEDGE",
      );
    });

    it("should have appropriate similes", () => {
      expect(queryGaussianKnowledgeAction.similes).toContain(
        "ASK_ABOUT_CALCULATIONS",
      );
      expect(queryGaussianKnowledgeAction.similes).toContain(
        "SEARCH_QUANTUM_DATA",
      );
      expect(queryGaussianKnowledgeAction.similes).toContain(
        "FIND_MOLECULAR_DATA",
      );
      expect(queryGaussianKnowledgeAction.similes).toContain(
        "SHOW_KNOWLEDGE_STATS",
      );
    });

    it("should have a description", () => {
      expect(queryGaussianKnowledgeAction.description).toContain(
        "knowledge graph",
      );
      expect(queryGaussianKnowledgeAction.description).toContain(
        "calculations",
      );
    });

    it("should have examples", () => {
      expect(queryGaussianKnowledgeAction.examples).toBeDefined();
      expect(Array.isArray(queryGaussianKnowledgeAction.examples)).toBe(true);
      expect(queryGaussianKnowledgeAction.examples.length).toBeGreaterThan(0);
    });
  });
});
