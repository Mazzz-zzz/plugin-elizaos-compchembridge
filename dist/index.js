// src/plugin.ts
import {
  ModelType,
  Service,
  logger
} from "@elizaos/core";
import { z } from "zod";

// src/__tests__/e2e/starter-plugin.ts
var StarterPluginTestSuite = {
  name: "plugin_starter_test_suite",
  description: "E2E tests for the starter plugin",
  tests: [
    /**
     * Basic Plugin Verification Test
     * ------------------------------
     * This test verifies that the plugin is properly loaded and initialized
     * within the runtime environment.
     */
    {
      name: "example_test",
      fn: async (runtime) => {
        if (runtime.character.name !== "Eliza") {
          throw new Error(
            `Expected character name to be "Eliza" but got "${runtime.character.name}"`
          );
        }
        const service = runtime.getService("starter");
        if (!service) {
          throw new Error("Starter service not found");
        }
      }
    },
    /**
     * Action Registration Test
     * ------------------------
     * Verifies that custom actions are properly registered with the runtime.
     * This is important to ensure actions are available for the agent to use.
     */
    {
      name: "should_have_hello_world_action",
      fn: async (runtime) => {
        const actionExists = runtime.actions?.some((a) => a.name === "HELLO_WORLD");
        if (!actionExists) {
          throw new Error("Hello world action not found in runtime actions");
        }
      }
    },
    /**
     * Hello World Action Response Test
     * ---------------------------------
     * This test demonstrates a complete scenario where:
     * 1. The agent is asked to say "hello"
     * 2. The HELLO_WORLD action is triggered
     * 3. The agent responds with text containing "hello world"
     *
     * This is a key pattern for testing agent behaviors - you simulate
     * a user message and verify the agent's response.
     */
    {
      name: "hello_world_action_test",
      fn: async (runtime) => {
        const testMessage = {
          entityId: "12345678-1234-1234-1234-123456789012",
          roomId: "12345678-1234-1234-1234-123456789012",
          content: {
            text: "Can you say hello?",
            source: "test",
            actions: ["HELLO_WORLD"]
            // Specify which action we expect to trigger
          }
        };
        const testState = {
          values: {},
          data: {},
          text: ""
        };
        let responseText = "";
        let responseReceived = false;
        const helloWorldAction2 = runtime.actions?.find((a) => a.name === "HELLO_WORLD");
        if (!helloWorldAction2) {
          throw new Error("Hello world action not found in runtime actions");
        }
        const callback = async (response) => {
          responseReceived = true;
          responseText = response.text || "";
          if (!response.actions?.includes("HELLO_WORLD")) {
            throw new Error("Response did not include HELLO_WORLD action");
          }
          return Promise.resolve([]);
        };
        await helloWorldAction2.handler(runtime, testMessage, testState, {}, callback);
        if (!responseReceived) {
          throw new Error("Hello world action did not produce a response");
        }
        if (!responseText.toLowerCase().includes("hello world")) {
          throw new Error(`Expected response to contain "hello world" but got: "${responseText}"`);
        }
      }
    },
    /**
     * Provider Functionality Test
     * ---------------------------
     * Tests that providers can supply data to the agent when needed.
     * Providers are used to fetch external data or compute values.
     */
    {
      name: "hello_world_provider_test",
      fn: async (runtime) => {
        const testMessage = {
          entityId: "12345678-1234-1234-1234-123456789012",
          roomId: "12345678-1234-1234-1234-123456789012",
          content: {
            text: "What can you provide?",
            source: "test"
          }
        };
        const testState = {
          values: {},
          data: {},
          text: ""
        };
        const helloWorldProvider2 = runtime.providers?.find(
          (p) => p.name === "HELLO_WORLD_PROVIDER"
        );
        if (!helloWorldProvider2) {
          throw new Error("Hello world provider not found in runtime providers");
        }
        const result = await helloWorldProvider2.get(runtime, testMessage, testState);
        if (result.text !== "I am a provider") {
          throw new Error(`Expected provider to return "I am a provider", got "${result.text}"`);
        }
      }
    },
    /**
     * Service Lifecycle Test
     * ----------------------
     * Verifies that services can be started, accessed, and stopped properly.
     * Services run background tasks or manage long-lived resources.
     */
    {
      name: "starter_service_test",
      fn: async (runtime) => {
        const service = runtime.getService("starter");
        if (!service) {
          throw new Error("Starter service not found");
        }
        if (service.capabilityDescription !== "This is a starter service which is attached to the agent through the starter plugin.") {
          throw new Error("Incorrect service capability description");
        }
        await service.stop();
      }
    }
    /**
     * ADD YOUR CUSTOM TESTS HERE
     * --------------------------
     * To add a new test:
     *
     * 1. Copy this template:
     * ```typescript
     * {
     *   name: 'your_test_name',
     *   fn: async (runtime) => {
     *     // Setup: Create any test data needed
     *
     *     // Action: Perform the operation you want to test
     *
     *     // Assert: Check the results
     *     if (result !== expected) {
     *       throw new Error(`Expected ${expected} but got ${result}`);
     *     }
     *   }
     * }
     * ```
     *
     * 2. Common test patterns:
     *    - Test action responses to specific prompts
     *    - Verify provider data under different conditions
     *    - Check service behavior during lifecycle events
     *    - Validate plugin configuration handling
     *    - Test error cases and edge conditions
     *
     * 3. Tips:
     *    - Use meaningful variable names
     *    - Include helpful error messages
     *    - Test one thing per test
     *    - Consider both success and failure scenarios
     */
  ]
};

// src/plugin.ts
var configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z.string().min(1, "Example plugin variable is not provided").optional().transform((val) => {
    if (!val) {
      logger.warn("Example plugin variable is not provided (this is expected)");
    }
    return val;
  })
});
var helloWorldAction = {
  name: "HELLO_WORLD",
  similes: ["GREET", "SAY_HELLO"],
  description: "Responds with a simple hello world message",
  validate: async (_runtime, _message, _state) => {
    return true;
  },
  handler: async (_runtime, message, _state, _options, callback, _responses) => {
    try {
      logger.info("Handling HELLO_WORLD action");
      const responseContent = {
        text: "hello world!",
        actions: ["HELLO_WORLD"],
        source: message.content.source
      };
      if (callback) {
        await callback(responseContent);
      }
      return responseContent;
    } catch (error) {
      logger.error("Error in HELLO_WORLD action:", error);
      throw error;
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you say hello?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "hello world!",
          actions: ["HELLO_WORLD"]
        }
      }
    ]
  ]
};
var helloWorldProvider = {
  name: "HELLO_WORLD_PROVIDER",
  description: "A simple example provider",
  get: async (_runtime, _message, _state) => {
    return {
      text: "I am a provider",
      values: {},
      data: {}
    };
  }
};
var StarterService = class _StarterService extends Service {
  constructor(runtime) {
    super(runtime);
    this.runtime = runtime;
  }
  static serviceType = "compchem";
  capabilityDescription = "Computational chemistry service for analyzing molecular structures and properties.";
  static async start(runtime) {
    logger.info(`*** Starting computational chemistry service: ${(/* @__PURE__ */ new Date()).toISOString()} ***`);
    const service = new _StarterService(runtime);
    return service;
  }
  static async stop(runtime) {
    logger.info("*** Stopping computational chemistry service ***");
    const service = runtime.getService(_StarterService.serviceType);
    if (!service) {
      throw new Error("Computational chemistry service not found");
    }
    service.stop();
  }
  async stop() {
    logger.info("*** Computational chemistry service stopped ***");
  }
};
var myCompchemPlugin = {
  name: "my-compchem-plugin",
  description: "Computational chemistry plugin for elizaOS",
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE
  },
  async init(config) {
    logger.info("*** Initializing computational chemistry plugin ***");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (_runtime, { prompt, stopSequences = [] }) => {
      return "Never gonna give you up, never gonna let you down, never gonna run around and desert you...";
    },
    [ModelType.TEXT_LARGE]: async (_runtime, {
      prompt,
      stopSequences = [],
      maxTokens = 8192,
      temperature = 0.7,
      frequencyPenalty = 0.7,
      presencePenalty = 0.7
    }) => {
      return "Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...";
    }
  },
  routes: [
    {
      name: "hello-world-route",
      path: "/helloworld",
      type: "GET",
      handler: async (_req, res) => {
        res.json({
          message: "Hello World!"
        });
      }
    },
    {
      name: "current-time-route",
      path: "/api/time",
      type: "GET",
      handler: async (_req, res) => {
        const now = /* @__PURE__ */ new Date();
        res.json({
          timestamp: now.toISOString(),
          unix: Math.floor(now.getTime() / 1e3),
          formatted: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    }
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug("MESSAGE_RECEIVED event received");
        logger.debug(Object.keys(params));
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug("VOICE_MESSAGE_RECEIVED event received");
        logger.debug(Object.keys(params));
      }
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.debug("WORLD_CONNECTED event received");
        logger.debug(Object.keys(params));
      }
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.debug("WORLD_JOINED event received");
        logger.debug(Object.keys(params));
      }
    ]
  },
  services: [StarterService],
  actions: [helloWorldAction],
  providers: [helloWorldProvider],
  tests: [StarterPluginTestSuite]
  // dependencies: ['@elizaos/plugin-knowledge'], <--- plugin dependecies go here (if requires another plugin)
};

// src/index.ts
var index_default = myCompchemPlugin;
export {
  StarterService,
  index_default as default,
  myCompchemPlugin
};
//# sourceMappingURL=index.js.map