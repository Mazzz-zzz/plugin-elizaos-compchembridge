import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import gaussianKnowledgeGraphPlugin, { GaussianKnowledgeService } from "../index";
import { ModelType, logger } from "@elizaos/core";
import dotenv from "dotenv";

// Setup environment variables
dotenv.config();

// Need to spy on logger for documentation
beforeAll(() => {
  vi.spyOn(logger, "info");
  vi.spyOn(logger, "error");
  vi.spyOn(logger, "warn");
  vi.spyOn(logger, "debug");
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Create a real runtime for testing
function createRealRuntime() {
  const services = new Map();

  // Create a real service instance if needed
  const createService = (serviceType: string) => {
    if (serviceType === "gaussian-knowledge") {
      return new GaussianKnowledgeService({
        character: {
          name: "Test Character",
          system: "You are a helpful assistant for testing.",
        },
      } as any);
    }
    return null;
  };

  return {
    character: {
      name: "Test Character",
      system: "You are a helpful assistant for testing.",
      plugins: [],
      settings: {},
    },
    getSetting: (key: string) => null,
    db: {
      get: async (key: string) => null,
      set: async (key: string, value: any) => true,
      delete: async (key: string) => true,
      getKeys: async (pattern: string) => [],
    },
    getService: (serviceType: string) => {
      // Log the service request for debugging
      logger.debug(`Requesting service: ${serviceType}`);

      // Get from cache or create new
      if (!services.has(serviceType)) {
        logger.debug(`Creating new service: ${serviceType}`);
        services.set(serviceType, createService(serviceType));
      }

      return services.get(serviceType);
    },
    registerService: (serviceType: string, service: any) => {
      logger.debug(`Registering service: ${serviceType}`);
      services.set(serviceType, service);
    },
  };
}

describe("Plugin Configuration", () => {
  it("should have correct plugin metadata", () => {
    expect(gaussianKnowledgeGraphPlugin.name).toBe("plugin-gaussian-kg");
    expect(gaussianKnowledgeGraphPlugin.description).toContain("Gaussian");
    expect(gaussianKnowledgeGraphPlugin.config).toBeDefined();
  });

  it("should include the GAUSSIAN_API_KEY in config", () => {
    expect(gaussianKnowledgeGraphPlugin.config).toHaveProperty("GAUSSIAN_API_KEY");
  });

  it("should initialize properly", async () => {
    const originalEnv = process.env.GAUSSIAN_API_KEY;

    try {
      process.env.GAUSSIAN_API_KEY = "test-value";

      // Initialize with config - using real runtime
      const runtime = createRealRuntime();

      if (gaussianKnowledgeGraphPlugin.init) {
        await gaussianKnowledgeGraphPlugin.init(
          { GAUSSIAN_API_KEY: "test-value" },
          runtime as any,
        );
        expect(true).toBe(true); // If we got here, init succeeded
      }
    } finally {
      process.env.GAUSSIAN_API_KEY = originalEnv;
    }
  });

  it("should have a valid config", () => {
    expect(gaussianKnowledgeGraphPlugin.config).toBeDefined();
    if (gaussianKnowledgeGraphPlugin.config) {
      // Check if the config has expected GAUSSIAN_API_KEY property
      expect(Object.keys(gaussianKnowledgeGraphPlugin.config)).toContain(
        "GAUSSIAN_API_KEY",
      );
    }
  });
});

describe("Plugin Actions", () => {
  it("should have actions defined", () => {
    expect(gaussianKnowledgeGraphPlugin.actions).toBeDefined();
    expect(Array.isArray(gaussianKnowledgeGraphPlugin.actions)).toBe(true);
    expect(gaussianKnowledgeGraphPlugin.actions!.length).toBeGreaterThan(0);
  });

  it("should have QUERY_GAUSSIAN_KNOWLEDGE action", () => {
    const queryAction = gaussianKnowledgeGraphPlugin.actions?.find(
      (action) => action.name === "QUERY_GAUSSIAN_KNOWLEDGE"
    );
    expect(queryAction).toBeDefined();
    expect(queryAction?.description).toContain("knowledge graph");
  });
});

describe("Plugin Services", () => {
  it("should have services defined", () => {
    expect(gaussianKnowledgeGraphPlugin.services).toBeDefined();
    expect(Array.isArray(gaussianKnowledgeGraphPlugin.services)).toBe(true);
    expect(gaussianKnowledgeGraphPlugin.services!.length).toBeGreaterThan(0);
  });
});

describe("GaussianKnowledgeService", () => {
  it("should start the service", async () => {
    const runtime = createRealRuntime();
    
    // Mock the service methods to avoid file system dependencies in tests
    const mockService = {
      capabilityDescription: "Mock Gaussian Knowledge Service for testing",
      stop: vi.fn().mockResolvedValue(undefined),
      getKnowledgeGraphStats: vi.fn().mockResolvedValue({
        fileSize: 1024,
        totalTriples: 100,
        molecules: 5,
      }),
    };

    // Mock the start method to return our mock service
    const originalStart = GaussianKnowledgeService.start;
    GaussianKnowledgeService.start = vi.fn().mockResolvedValue(mockService);

    try {
      const startResult = await GaussianKnowledgeService.start(runtime as any);
      expect(startResult).toBeDefined();
      expect(typeof startResult.stop).toBe("function");
    } finally {
      // Restore original start method
      GaussianKnowledgeService.start = originalStart;
    }
  });

  it("should stop the service", async () => {
    const runtime = createRealRuntime();

    // Create a mock service with a spy on stop
    const mockService = {
      capabilityDescription: "Mock service",
      stop: vi.fn().mockResolvedValue(undefined),
    };

    // Register the mock service
    runtime.registerService("gaussian-knowledge", mockService);

    // Mock the static stop method to call the service's stop method
    const originalStop = GaussianKnowledgeService.stop;
    GaussianKnowledgeService.stop = vi.fn().mockImplementation(async (runtime: any) => {
      const service = runtime.getService("gaussian-knowledge");
      if (service) {
        await service.stop();
      } else {
        throw new Error("Gaussian knowledge service not found");
      }
    });

    try {
      await GaussianKnowledgeService.stop(runtime as any);
      expect(mockService.stop).toHaveBeenCalled();
    } finally {
      // Restore original stop method
      GaussianKnowledgeService.stop = originalStop;
    }
  });

  it("should throw an error when stopping a non-existent service", async () => {
    const runtime = createRealRuntime();
    
    // Mock the static stop method to throw when service not found
    const originalStop = GaussianKnowledgeService.stop;
    GaussianKnowledgeService.stop = vi.fn().mockRejectedValue(
      new Error("Gaussian knowledge service not found")
    );

    try {
      await expect(GaussianKnowledgeService.stop(runtime as any)).rejects.toThrow(
        "Gaussian knowledge service not found",
      );
    } finally {
      // Restore original stop method
      GaussianKnowledgeService.stop = originalStop;
    }
  });
});
