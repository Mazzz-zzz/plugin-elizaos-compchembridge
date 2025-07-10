import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';
import { StarterPluginTestSuite } from './tests';

// Import Python service and actions
import { PythonService } from './services/pythonService';
import { analyzeMolecularDataAction } from './actions/analyzeMolecularData';
import { generateVisualizationAction } from './actions/generateVisualization';
import { parseGaussianFileAction } from './actions/parseGaussianFile';

/**
 * Defines the configuration schema for the computational chemistry plugin
 */
const configSchema = z.object({
  PYTHON_PATH: z
    .string()
    .optional()
    .default('python3')
    .transform((val) => {
      if (!val) {
        logger.info('Using default Python path: python3');
      }
      return val || 'python3';
    }),
  PYTHON_DEBUG: z
    .string()
    .optional()
    .transform((val) => {
      return val === 'true' ? 'true' : 'false';
    }),
  COMPCHEM_DATA_DIR: z
    .string()
    .optional()
    .default('./data')
    .transform((val) => {
      return val || './data';
    }),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
/**
 * Action representing a hello world message.
 * @typedef {Object} Action
 * @property {string} name - The name of the action.
 * @property {string[]} similes - An array of related actions.
 * @property {string} description - A brief description of the action.
 * @property {Function} validate - Asynchronous function to validate the action.
 * @property {Function} handler - Asynchronous function to handle the action and generate a response.
 * @property {Object[]} examples - An array of example inputs and expected outputs for the action.
 */
const helloWorldAction: Action = {
  name: 'HELLO_WORLD',
  similes: ['GREET', 'SAY_HELLO'],
  description: 'Responds with a simple hello world message',

  validate: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    // Always valid
    return true;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: any,
    callback?: HandlerCallback,
    _responses?: Memory[]
  ) => {
    try {
      logger.info('Handling HELLO_WORLD action');

      // Simple response content
      const responseContent: Content = {
        text: 'hello world!',
        actions: ['HELLO_WORLD'],
        source: message.content.source,
      };

      // Call back with the hello world message if callback is provided
      if (callback) {
        await callback(responseContent);
      }

      return responseContent;
    } catch (error) {
      logger.error('Error in HELLO_WORLD action:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Can you say hello?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'hello world!',
          actions: ['HELLO_WORLD'],
        },
      },
    ],
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'A simple example provider',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State | undefined
  ): Promise<ProviderResult> => {
    return {
      text: 'I am a provider',
      values: {},
      data: {},
    };
  },
};

export class CompchemService extends Service {
  static serviceType = 'compchem-manager';
  capabilityDescription =
    'Computational chemistry management service that coordinates molecular analysis and Python integration.';
  
  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info(`🧪 Starting computational chemistry service: ${new Date().toISOString()}`);
    const service = new CompchemService(runtime);
    
    // Check if Python service is available
    const pythonService = runtime.getService<PythonService>('python-execution');
    if (pythonService) {
      logger.info('✅ Python integration available');
      
      // Check Python environment
      try {
        const pythonEnv = await pythonService.checkPythonEnvironment();
        if (pythonEnv.pythonAvailable) {
          logger.info(`🐍 Python ${pythonEnv.pythonVersion} detected`);
          logger.info(`📦 Available packages: ${pythonEnv.packagesAvailable.join(', ')}`);
          if (pythonEnv.packagesMissing.length > 0) {
            logger.warn(`⚠️  Missing packages: ${pythonEnv.packagesMissing.join(', ')}`);
          }
        } else {
          logger.warn('⚠️  Python environment not available');
        }
      } catch (error) {
        logger.warn('⚠️  Could not check Python environment:', error);
      }
    } else {
      logger.warn('⚠️  Python service not available');
    }
    
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('🧪 Stopping computational chemistry service');
    const service = runtime.getService(CompchemService.serviceType);
    if (!service) {
      throw new Error('Computational chemistry service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('🧪 Computational chemistry service stopped');
  }
}

export const myCompchemPlugin: Plugin = {
  name: 'my-compchem-plugin-v2',
  description: 'Advanced computational chemistry plugin for ElizaOS with Python integration',
  config: {
    PYTHON_PATH: process.env.PYTHON_PATH,
    PYTHON_DEBUG: process.env.PYTHON_DEBUG,
    COMPCHEM_DATA_DIR: process.env.COMPCHEM_DATA_DIR,
  },
  async init(config: Record<string, string>) {
    logger.info('🧪 Initializing computational chemistry plugin v2');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
      
      logger.info('✅ Plugin configuration validated successfully');
      logger.info(`🐍 Python path: ${validatedConfig.PYTHON_PATH}`);
      logger.info(`📁 Data directory: ${validatedConfig.COMPCHEM_DATA_DIR}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'Never gonna give you up, never gonna let you down, never gonna run around and desert you...';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...';
    },
  },
  routes: [
    {
      name: 'hello-world-route',
      path: '/helloworld',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        // send a response
        res.json({
          message: 'Hello World!',
        });
      },
    },
    {
      name: 'current-time-route',
      path: '/api/time',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        // Return current time in various formats
        const now = new Date();
        res.json({
          timestamp: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          formatted: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug('MESSAGE_RECEIVED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.debug('WORLD_CONNECTED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.debug('WORLD_JOINED event received');
        // print the keys
        logger.debug(Object.keys(params));
      },
    ],
  },
  services: [PythonService, CompchemService],
  actions: [helloWorldAction, analyzeMolecularDataAction, generateVisualizationAction, parseGaussianFileAction],
  providers: [helloWorldProvider],
  tests: [StarterPluginTestSuite],
  // dependencies: ['@elizaos/plugin-knowledge'], <--- plugin dependecies go here (if requires another plugin)
};

export default myCompchemPlugin;
