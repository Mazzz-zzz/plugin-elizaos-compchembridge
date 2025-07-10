import { describe, expect, it, beforeAll } from 'bun:test';
import { myCompchemPlugin, CompchemService, PythonService } from '../index';
import { logger } from '@elizaos/core';
import dotenv from 'dotenv';

// Setup environment variables
dotenv.config();

// Mock logger for testing
beforeAll(() => {
  // Setup any test configuration here
});

// Create a mock runtime for testing
function createMockRuntime() {
  const services = new Map();

  return {
    character: {
      name: 'Test Character',
      system: 'You are a computational chemistry assistant for testing.',
      plugins: [],
      settings: {},
    },
    getSetting: (key: string) => {
      if (key === 'PYTHON_PATH') return 'python3';
      if (key === 'PYTHON_DEBUG') return 'false';
      if (key === 'COMPCHEM_DATA_DIR') return './data';
      return null;
    },
    models: myCompchemPlugin.models || {},
    db: {
      get: async (key: string) => null,
      set: async (key: string, value: any) => true,
      delete: async (key: string) => true,
      getKeys: async (pattern: string) => [],
    },
    getService: (serviceType: string) => {
      return services.get(serviceType) || null;
    },
    registerService: (serviceType: string, service: any) => {
      services.set(serviceType, service);
    },
  };
}

describe('Computational Chemistry Plugin Configuration', () => {
  it('should have correct plugin metadata', () => {
    expect(myCompchemPlugin.name).toBe('my-compchem-plugin-v2');
    expect(myCompchemPlugin.description).toBe('Advanced computational chemistry plugin for ElizaOS with integrated Python analysis capabilities.');
    expect(myCompchemPlugin.config).toBeDefined();
  });

  it('should include the PYTHON_PATH in config', () => {
    expect(myCompchemPlugin.config).toHaveProperty('PYTHON_PATH');
  });

  it('should include the PYTHON_DEBUG in config', () => {
    expect(myCompchemPlugin.config).toHaveProperty('PYTHON_DEBUG');
  });

  it('should include the COMPCHEM_DATA_DIR in config', () => {
    expect(myCompchemPlugin.config).toHaveProperty('COMPCHEM_DATA_DIR');
  });

  it('should initialize properly', async () => {
    const originalEnvs = {
      PYTHON_PATH: process.env.PYTHON_PATH,
      PYTHON_DEBUG: process.env.PYTHON_DEBUG,
      COMPCHEM_DATA_DIR: process.env.COMPCHEM_DATA_DIR,
    };

    try {
      process.env.PYTHON_PATH = 'python3';
      process.env.PYTHON_DEBUG = 'false';
      process.env.COMPCHEM_DATA_DIR = './data';

      // Initialize with config - using mock runtime
      const runtime = createMockRuntime();

      if (myCompchemPlugin.init) {
        await myCompchemPlugin.init({
          PYTHON_PATH: 'python3',
          PYTHON_DEBUG: 'false',
          COMPCHEM_DATA_DIR: './data'
        }, runtime as any);
        expect(true).toBe(true); // If we got here, init succeeded
      }
    } finally {
      // Restore original environment variables
      Object.entries(originalEnvs).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      });
    }
  });

  it('should have services defined', () => {
    expect(myCompchemPlugin.services).toBeDefined();
    expect(Array.isArray(myCompchemPlugin.services)).toBe(true);
    expect(myCompchemPlugin.services?.length).toBeGreaterThan(0);
  });

  it('should have actions defined', () => {
    expect(myCompchemPlugin.actions).toBeDefined();
    expect(Array.isArray(myCompchemPlugin.actions)).toBe(true);
    expect(myCompchemPlugin.actions?.length).toBeGreaterThan(0);
  });
});

describe('CompchemService', () => {
  it('should have correct service type', () => {
    expect(CompchemService.serviceType).toBe('compchem');
  });

  it('should start the service', async () => {
    const runtime = createMockRuntime();
    const startResult = await CompchemService.start(runtime as any);

    expect(startResult).toBeDefined();
    expect(startResult.constructor.name).toBe('CompchemService');
  });
});

describe('PythonService', () => {
  it('should have correct service type', () => {
    expect(PythonService.serviceType).toBe('python-execution');
  });

  it('should start the service', async () => {
    const runtime = createMockRuntime();
    const startResult = await PythonService.start(runtime as any);

    expect(startResult).toBeDefined();
    expect(startResult.constructor.name).toBe('PythonService');
  });

  it('should have capability description', () => {
    const runtime = createMockRuntime();
    const service = new PythonService(runtime as any);
    expect(service.capabilityDescription).toBeDefined();
    expect(typeof service.capabilityDescription).toBe('string');
    expect(service.capabilityDescription.length).toBeGreaterThan(0);
  });
});

describe('Plugin Actions', () => {
  it('should include molecular analysis action', () => {
    const actions = myCompchemPlugin.actions || [];
    const analysisAction = actions.find(action => action.name === 'ANALYZE_MOLECULAR_DATA');
    expect(analysisAction).toBeDefined();
  });

  it('should include visualization action', () => {
    const actions = myCompchemPlugin.actions || [];
    const vizAction = actions.find(action => action.name === 'GENERATE_MOLECULAR_VISUALIZATION');
    expect(vizAction).toBeDefined();
  });

  it('should include Gaussian parsing action', () => {
    const actions = myCompchemPlugin.actions || [];
    const parseAction = actions.find(action => action.name === 'PARSE_GAUSSIAN_FILE');
    expect(parseAction).toBeDefined();
  });
});



