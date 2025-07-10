import { describe, expect, it, beforeEach } from 'bun:test';
import { myCompchemPlugin, CompchemService, PythonService } from '../index';
import { createMockRuntime } from './test-utils';
import { HandlerCallback, IAgentRuntime, Memory, State, UUID } from '@elizaos/core';

/**
 * Integration tests for the Computational Chemistry Plugin V2.
 * These tests verify that components work together properly.
 */

describe('Integration: Computational Chemistry Plugin', () => {
  let mockRuntime: any;

  beforeEach(() => {
    // Create a mock runtime with our services
    mockRuntime = createMockRuntime({
      getService: (serviceType: string) => {
        if (serviceType === 'python-execution') {
          return {
            checkPythonEnvironment: async () => ({
              pythonAvailable: true,
              pythonVersion: 'Python 3.9.0',
              packagesAvailable: ['numpy', 'cclib'],
              packagesMissing: [],
              cclibAvailable: true
            }),
            parseGaussianFile: async (filePath: string) => ({
              molecular_formula: 'C2H2O2',
              natom: 6,
              charge: 0,
              mult: 1,
              scfenergies: [-123.456],
              metadata: {
                cclib_version: '1.8.1',
                parsed_at: new Date().toISOString()
              }
            })
          };
        }
        if (serviceType === 'compchem') {
          return {
            capabilityDescription: 'Computational chemistry service for analyzing molecular structures'
          };
        }
        return null;
      }
    });
  });

  it('should have all required services', () => {
    expect(myCompchemPlugin.services).toBeDefined();
    expect(myCompchemPlugin.services?.length).toBeGreaterThan(0);
    
    const serviceTypes = myCompchemPlugin.services?.map(service => service.serviceType);
    expect(serviceTypes).toContain('python-execution');
    expect(serviceTypes).toContain('compchem');
  });

  it('should have all required actions', () => {
    expect(myCompchemPlugin.actions).toBeDefined();
    expect(myCompchemPlugin.actions?.length).toBeGreaterThan(0);
    
    const actionNames = myCompchemPlugin.actions?.map(action => action.name);
    expect(actionNames).toContain('ANALYZE_MOLECULAR_DATA');
    expect(actionNames).toContain('GENERATE_MOLECULAR_VISUALIZATION');
    expect(actionNames).toContain('PARSE_GAUSSIAN_FILE');
  });

  it('should initialize plugin with computational chemistry config', async () => {
    if (myCompchemPlugin.init) {
      await expect(myCompchemPlugin.init({
        PYTHON_PATH: 'python3',
        PYTHON_DEBUG: 'false',
        COMPCHEM_DATA_DIR: './data'
      }, mockRuntime as IAgentRuntime)).resolves.not.toThrow();
    }
  });

  it('should handle Gaussian file parsing action integration', async () => {
    // Find the Gaussian parsing action
    const parseAction = myCompchemPlugin.actions?.find(
      action => action.name === 'PARSE_GAUSSIAN_FILE'
    );
    expect(parseAction).toBeDefined();

    // Test validation
    const mockMessage: Memory = {
      id: '12345678-1234-1234-1234-123456789012' as UUID,
      roomId: '12345678-1234-1234-1234-123456789012' as UUID,
      entityId: '12345678-1234-1234-1234-123456789012' as UUID,
      agentId: '12345678-1234-1234-1234-123456789012' as UUID,
      content: {
        text: 'Please parse the lactone.log Gaussian file',
        source: 'test',
      },
      createdAt: Date.now(),
    };

    const mockState: State = {
      values: {},
      data: {},
      text: '',
    };

    // Test that the action validates correctly
    if (parseAction?.validate) {
      const isValid = await parseAction.validate(
        mockRuntime as IAgentRuntime,
        mockMessage,
        mockState
      );
      expect(isValid).toBe(true);
    }
  });

  it('should handle molecular analysis action integration', async () => {
    // Find the molecular analysis action
    const analysisAction = myCompchemPlugin.actions?.find(
      action => action.name === 'ANALYZE_MOLECULAR_DATA'
    );
    expect(analysisAction).toBeDefined();

    // Test validation with molecular data
    const mockMessage: Memory = {
      id: '12345678-1234-1234-1234-123456789012' as UUID,
      roomId: '12345678-1234-1234-1234-123456789012' as UUID,
      entityId: '12345678-1234-1234-1234-123456789012' as UUID,
      agentId: '12345678-1234-1234-1234-123456789012' as UUID,
      content: {
        text: 'Analyze this molecule: C6H6 benzene ring',
        source: 'test',
      },
      createdAt: Date.now(),
    };

    const mockState: State = {
      values: {},
      data: {},
      text: '',
    };

    // Test validation
    if (analysisAction?.validate) {
      const isValid = await analysisAction.validate(
        mockRuntime as IAgentRuntime,
        mockMessage,
        mockState
      );
      expect(isValid).toBe(true);
    }
  });
});

describe('Integration: Service Interaction', () => {
  it('should allow Python service and CompchemService to work together', async () => {
    const mockRuntime = createMockRuntime();
    
    // Start both services
    const pythonService = await PythonService.start(mockRuntime as IAgentRuntime);
    const compchemService = await CompchemService.start(mockRuntime as IAgentRuntime);
    
    expect(pythonService).toBeDefined();
    expect(compchemService).toBeDefined();
    
    // Verify they have the expected interfaces
    expect(pythonService.capabilityDescription).toBeDefined();
    expect(compchemService.capabilityDescription).toBeDefined();
    
    // Verify Python service has the methods we need
    expect(typeof pythonService.checkPythonEnvironment).toBe('function');
    expect(typeof pythonService.parseGaussianFile).toBe('function');
  });
});
