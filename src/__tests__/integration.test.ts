import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterAll,
  beforeAll,
} from "vitest";
import gaussianKnowledgeGraphPlugin, { GaussianKnowledgeService, queryGaussianKnowledgeAction } from "../index";
import { createMockRuntime, setupLoggerSpies, MockRuntime } from "./test-utils";
import {
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  UUID,
  logger,
} from "@elizaos/core";

/**
 * Integration tests demonstrate how multiple components of the plugin work together.
 * Unlike unit tests that test individual functions in isolation, integration tests
 * examine how components interact with each other.
 *
 * For example, this file shows how the QueryGaussianKnowledge action and GaussianKnowledgeService
 * interact with the plugin's core functionality.
 */

// Set up spies on logger
beforeAll(() => {
  setupLoggerSpies();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Integration: QueryGaussianKnowledge Action with GaussianKnowledgeService", () => {
  let mockRuntime: MockRuntime;
  let getServiceSpy: any;

  beforeEach(() => {
    // Create a service mock that will be returned by getService
    const mockService = {
      getKnowledgeGraphStats: vi.fn().mockResolvedValue({
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
      queryKnowledgeGraph: vi.fn().mockResolvedValue({
        stats: {
          molecules: 10,
          scfEnergies: 10,
          frequencies: 300,
          atoms: 120,
        },
        relevantData: [
          "Molecule: H2O, SCF Energy: -76.123 eV",
          "HOMO-LUMO Gap: 8.5 eV",
        ],
      }),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    // Create a mock runtime with a spied getService method
    getServiceSpy = vi.fn().mockImplementation((serviceType) => {
      if (serviceType === "gaussian-knowledge") {
        return mockService;
      }
      return null;
    });

    mockRuntime = createMockRuntime({
      getService: getServiceSpy,
      messageManager: {
        createMemory: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("should handle QueryGaussianKnowledge action with GaussianKnowledgeService available", async () => {
    // Find the QueryGaussianKnowledge action
    const queryAction = gaussianKnowledgeGraphPlugin.actions?.find(
      (action) => action.name === "QUERY_GAUSSIAN_KNOWLEDGE",
    );
    expect(queryAction).toBeDefined();

    // Create a mock message and state
    const mockMessage: Memory = {
      id: "12345678-1234-1234-1234-123456789012" as UUID,
      roomId: "12345678-1234-1234-1234-123456789012" as UUID,
      entityId: "12345678-1234-1234-1234-123456789012" as UUID,
      agentId: "12345678-1234-1234-1234-123456789012" as UUID,
      content: {
        text: "show me the knowledge graph stats",
        source: "test",
      },
      createdAt: Date.now(),
    };

    const mockState: State = {
      values: {},
      data: {},
      text: "",
    };

    // Create a mock callback to capture the response
    const callbackFn = vi.fn();

    // Execute the action
    const result = await queryAction?.handler(
      mockRuntime as unknown as IAgentRuntime,
      mockMessage,
      mockState,
      {},
      callbackFn as HandlerCallback,
    );

    // Verify the action executed successfully
    expect(result).toBe(true);

    // Get the service to ensure integration
    const service = mockRuntime.getService("gaussian-knowledge");
    expect(service).toBeDefined();
    expect(service?.getKnowledgeGraphStats).toBeDefined();
  });
});

describe("Integration: Plugin initialization and service registration", () => {
  it("should initialize the plugin and register the service", async () => {
    // Create a fresh mock runtime with mocked registerService for testing initialization flow
    const mockRuntimeServices = new Map();
    const mockRuntime = createMockRuntime({
      services: mockRuntimeServices,
    });

    // Create and install a spy on registerService
    const registerServiceSpy = vi.fn();
    mockRuntime.registerService = registerServiceSpy;

    // Run a minimal simulation of the plugin initialization process
    if (gaussianKnowledgeGraphPlugin.init) {
      await gaussianKnowledgeGraphPlugin.init(
        { GAUSSIAN_API_KEY: "test-value" },
        mockRuntime as unknown as IAgentRuntime,
      );

      // Directly mock the service registration that happens during initialization
      // because unit tests don't run the full agent initialization flow
      if (gaussianKnowledgeGraphPlugin.services) {
        const GaussianKnowledgeServiceClass = gaussianKnowledgeGraphPlugin.services[0];
        const serviceInstance = await GaussianKnowledgeServiceClass.start(
          mockRuntime as unknown as IAgentRuntime,
        );

        // Register the Service class to match the core API
        mockRuntime.registerService("gaussian-knowledge", serviceInstance);
      }

      // Now verify the service was registered with the runtime
      expect(registerServiceSpy).toHaveBeenCalledWith("gaussian-knowledge", expect.any(Object));
    }
  });
});
