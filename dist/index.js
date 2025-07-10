var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/plugin.ts
import {
  ModelType,
  Service as Service2,
  logger as logger6
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

// src/services/pythonService.ts
import {
  Service,
  logger
} from "@elizaos/core";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var execFileAsync = promisify(execFile);
var PythonService = class _PythonService extends Service {
  static serviceType = "python-execution";
  capabilityDescription = "Enables the agent to execute Python scripts for molecular analysis and computational chemistry calculations";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    const service = new _PythonService(runtime);
    const debugMode = runtime.getSetting("PYTHON_DEBUG") === "true";
    const pythonPath = runtime.getSetting("PYTHON_PATH") || "python3";
    if (debugMode) {
      logger.info("\u{1F40D} Python Service initialized with debug mode");
      logger.info(`   Python path: ${pythonPath}`);
    }
    return service;
  }
  async stop() {
    logger.info("\u{1F40D} Python Service stopped");
  }
  /**
   * Execute a Python script using execFile (for simple scripts that return JSON)
   */
  async executePythonScript(scriptPath, args = [], options = {}) {
    try {
      const pythonInterpreter = this.runtime.getSetting("PYTHON_PATH") || "python3";
      const absoluteScriptPath = path.resolve(scriptPath);
      await fs.access(absoluteScriptPath);
      const { stdout } = await execFileAsync(pythonInterpreter, [absoluteScriptPath, ...args], {
        timeout: options.timeout || 3e4,
        // 30 second default timeout
        encoding: "utf8"
      });
      return stdout;
    } catch (error) {
      logger.error("Python script execution failed:", error);
      throw error;
    }
  }
  /**
   * Execute Python script with streaming output (for long-running processes)
   */
  async executePythonScriptStreaming(scriptPath, args = [], onData, onError) {
    return new Promise((resolve2, reject) => {
      const pythonInterpreter = this.runtime.getSetting("PYTHON_PATH") || "python3";
      const absoluteScriptPath = path.resolve(scriptPath);
      const pythonProcess = spawn(pythonInterpreter, [absoluteScriptPath, ...args], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        if (onData) onData(output);
      });
      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        if (onError) onError(error);
      });
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve2(stdout.trim());
        } else {
          logger.error(`\u274C Python process failed with code ${code}: ${stderr}`);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      pythonProcess.on("error", (error) => {
        logger.error(`\u274C Failed to start Python process: ${error}`);
        reject(error);
      });
    });
  }
  /**
   * Analyze molecular data using Python
   */
  async analyzeMolecularData(molecularData, analysisType = "molecular") {
    try {
      const possibleScriptPaths = [
        path.join(process.cwd(), "py", "molecular_analyzer.py"),
        path.join(__dirname, "..", "..", "py", "molecular_analyzer.py"),
        path.join(__dirname, "..", "..", "..", "py", "molecular_analyzer.py"),
        path.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "molecular_analyzer.py"),
        "./py/molecular_analyzer.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const dataJson = JSON.stringify(molecularData);
      const result = await this.executePythonScript(scriptPath, [
        dataJson,
        "--analysis_type",
        analysisType
      ]);
      return JSON.parse(result);
    } catch (error) {
      logger.error("Molecular data analysis failed:", error);
      throw error;
    }
  }
  /**
   * Generate visualization data using Python
   */
  async generateVisualization(molecularData, outputPath) {
    try {
      const possibleScriptPaths = [
        path.join(process.cwd(), "py", "molecular_analyzer.py"),
        path.join(__dirname, "..", "..", "py", "molecular_analyzer.py"),
        path.join(__dirname, "..", "..", "..", "py", "molecular_analyzer.py"),
        path.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "molecular_analyzer.py"),
        "./py/molecular_analyzer.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const dataJson = JSON.stringify(molecularData);
      const args = [dataJson, "--analysis_type", "visualization"];
      if (outputPath) {
        args.push("--output", outputPath);
      }
      const result = await this.executePythonScript(scriptPath, args);
      if (outputPath) {
        return { success: true, outputPath };
      } else {
        return JSON.parse(result);
      }
    } catch (error) {
      logger.error("Visualization generation failed:", error);
      throw error;
    }
  }
  /**
   * Parse Gaussian log files using cclib
   */
  async parseGaussianFile(filePath, metadata = {}, outputFormat = "json") {
    try {
      const possibleScriptPaths = [
        path.join(process.cwd(), "py", "parse_gaussian_cclib.py"),
        path.join(__dirname, "..", "..", "py", "parse_gaussian_cclib.py"),
        path.join(__dirname, "..", "..", "..", "py", "parse_gaussian_cclib.py"),
        path.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "parse_gaussian_cclib.py"),
        "./py/parse_gaussian_cclib.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const metadataJson = JSON.stringify(metadata);
      const args = [filePath, metadataJson, "--format", outputFormat];
      const result = await this.executePythonScript(scriptPath, args);
      if (outputFormat === "json") {
        return JSON.parse(result);
      } else {
        return { rdf: result, success: true };
      }
    } catch (error) {
      logger.error("Gaussian file parsing failed:", error);
      return { error: error instanceof Error ? error.message : "Unknown error", success: false };
    }
  }
  /**
   * Generate analysis plots using matplotlib
   */
  async generateAnalysisPlots(chartType, data, outputPath) {
    try {
      const possibleScriptPaths = [
        path.join(process.cwd(), "py", "plot_gaussian_analysis.py"),
        path.join(__dirname, "..", "..", "py", "plot_gaussian_analysis.py"),
        path.join(__dirname, "..", "..", "..", "py", "plot_gaussian_analysis.py"),
        path.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "plot_gaussian_analysis.py"),
        "./py/plot_gaussian_analysis.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const dataJson = JSON.stringify(data);
      const args = outputPath ? [chartType, dataJson, outputPath] : [chartType, dataJson];
      const result = await this.executePythonScript(scriptPath, args);
      if (outputPath) {
        return { success: true, outputPath, message: result };
      } else {
        return { success: true, output: result };
      }
    } catch (error) {
      logger.error("Analysis plot generation failed:", error);
      return { error: error instanceof Error ? error.message : "Unknown error", success: false };
    }
  }
  /**
   * Check if Python and required packages are available
   */
  async checkPythonEnvironment() {
    try {
      const pythonInterpreter = this.runtime.getSetting("PYTHON_PATH") || "python3";
      const { stdout: versionOutput } = await execFileAsync(pythonInterpreter, ["--version"]);
      const pythonVersion = versionOutput.trim();
      const requiredPackages = ["numpy", "matplotlib", "scipy", "pandas", "seaborn", "cclib"];
      const packagesAvailable = [];
      const packagesMissing = [];
      for (const pkg of requiredPackages) {
        try {
          await execFileAsync(pythonInterpreter, ["-c", `import ${pkg}; print(${pkg}.__version__)`]);
          packagesAvailable.push(pkg);
        } catch {
          packagesMissing.push(pkg);
        }
      }
      const cclibAvailable = packagesAvailable.includes("cclib");
      return {
        pythonAvailable: true,
        pythonVersion,
        packagesAvailable,
        packagesMissing,
        cclibAvailable
      };
    } catch (error) {
      logger.warn("Python environment check failed:", error);
      return {
        pythonAvailable: false,
        packagesAvailable: [],
        packagesMissing: ["numpy", "matplotlib", "scipy", "pandas", "seaborn", "cclib"],
        cclibAvailable: false
      };
    }
  }
};

// src/actions/analyzeMolecularData.ts
import { logger as logger2 } from "@elizaos/core";
var analyzeMolecularDataAction = {
  name: "ANALYZE_MOLECULAR_DATA",
  similes: ["ANALYZE_MOLECULE", "MOLECULAR_ANALYSIS", "COMPUTE_PROPERTIES"],
  description: "Analyzes molecular data and computes chemical properties using Python tools",
  validate: async (runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const molecularKeywords = [
      "analyze molecule",
      "molecular analysis",
      "compute properties",
      "molecular weight",
      "stability",
      "energy",
      "chemical properties",
      "molecular structure",
      "atoms",
      "bonds",
      "homo lumo"
    ];
    return molecularKeywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger2.info("\u{1F9EA} Analyzing molecular data...");
      const pythonService = runtime.getService("python-execution");
      if (!pythonService) {
        throw new Error("Python service not available");
      }
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent = {
          text: "\u274C Python environment is not available. Please ensure Python 3 and required packages (numpy, matplotlib, scipy) are installed.",
          actions: ["ANALYZE_MOLECULAR_DATA"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const molecularData = extractMolecularDataFromMessage(message) || {
        formula: "C6H6",
        atoms: [
          { id: 1, element: "C", x: 0, y: 0, z: 0 },
          { id: 2, element: "C", x: 1.4, y: 0, z: 0 },
          { id: 3, element: "C", x: 2.1, y: 1.2, z: 0 },
          { id: 4, element: "C", x: 1.4, y: 2.4, z: 0 },
          { id: 5, element: "C", x: 0, y: 2.4, z: 0 },
          { id: 6, element: "C", x: -0.7, y: 1.2, z: 0 },
          { id: 7, element: "H", x: -0.5, y: -0.9, z: 0 },
          { id: 8, element: "H", x: 1.9, y: -0.9, z: 0 },
          { id: 9, element: "H", x: 3.2, y: 1.2, z: 0 },
          { id: 10, element: "H", x: 1.9, y: 3.3, z: 0 },
          { id: 11, element: "H", x: -0.5, y: 3.3, z: 0 },
          { id: 12, element: "H", x: -1.8, y: 1.2, z: 0 }
        ],
        bonds: [
          { from: 1, to: 2 },
          { from: 2, to: 3 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
          { from: 5, to: 6 },
          { from: 6, to: 1 },
          { from: 1, to: 7 },
          { from: 2, to: 8 },
          { from: 3, to: 9 },
          { from: 4, to: 10 },
          { from: 5, to: 11 },
          { from: 6, to: 12 }
        ],
        scf_energy: -231.5,
        homo_lumo_gap: 5.2,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const analysisResult = await pythonService.analyzeMolecularData(molecularData, "molecular");
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Analysis failed");
      }
      let energyAnalysis = null;
      if (molecularData.scf_energy || molecularData.homo_lumo_gap) {
        energyAnalysis = await pythonService.analyzeMolecularData(molecularData, "energy");
      }
      let responseText = `\u{1F9EA} **Molecular Analysis Results**

`;
      responseText += `**Formula:** ${analysisResult.formula}
`;
      responseText += `**Atom Count:** ${analysisResult.atom_count}
`;
      responseText += `**Bond Count:** ${analysisResult.bond_count}
`;
      responseText += `**Molecular Weight:** ${analysisResult.molecular_weight} g/mol

`;
      responseText += `**Computed Properties:**
`;
      responseText += `\u2022 Density Estimate: ${analysisResult.properties.density_estimate} g/cm\xB3
`;
      responseText += `\u2022 Complexity Score: ${analysisResult.properties.complexity_score}/100
`;
      responseText += `\u2022 Stability: ${analysisResult.properties.stability_estimate}
`;
      if (energyAnalysis && energyAnalysis.success) {
        responseText += `
**Energy Analysis:**
`;
        if (energyAnalysis.scf_energy) {
          responseText += `\u2022 SCF Energy: ${energyAnalysis.scf_energy} hartree
`;
          responseText += `\u2022 Energy Classification: ${energyAnalysis.energy_classification}
`;
        }
        if (energyAnalysis.homo_lumo_gap) {
          responseText += `\u2022 HOMO-LUMO Gap: ${energyAnalysis.homo_lumo_gap} eV
`;
          responseText += `\u2022 Conductivity Prediction: ${energyAnalysis.conductivity_prediction}
`;
        }
      }
      if (pythonEnv.packagesMissing.length > 0) {
        responseText += `
**Note:** Some advanced features require additional Python packages: ${pythonEnv.packagesMissing.join(", ")}`;
      }
      const responseContent = {
        text: responseText,
        actions: ["ANALYZE_MOLECULAR_DATA"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger2.error("Error in molecular data analysis:", error);
      const errorContent = {
        text: `\u274C Failed to analyze molecular data: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["ANALYZE_MOLECULAR_DATA"],
        source: message.content.source
      };
      if (callback) await callback(errorContent);
      return errorContent;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Can you analyze this molecular structure and compute its properties?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F9EA} **Molecular Analysis Results**\n\n**Formula:** C6H6\n**Atom Count:** 12\n**Bond Count:** 12\n**Molecular Weight:** 78.11 g/mol\n\n**Computed Properties:**\n\u2022 Density Estimate: 7.81 g/cm\xB3\n\u2022 Complexity Score: 24/100\n\u2022 Stability: stable",
          actions: ["ANALYZE_MOLECULAR_DATA"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "What are the chemical properties of benzene?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F9EA} **Molecular Analysis Results**\n\n**Formula:** C6H6\n**Atom Count:** 12\n**Bond Count:** 12\n**Molecular Weight:** 78.11 g/mol\n\n**Computed Properties:**\n\u2022 Density Estimate: 7.81 g/cm\xB3\n\u2022 Complexity Score: 24/100\n\u2022 Stability: stable\n\n**Energy Analysis:**\n\u2022 SCF Energy: -231.5 hartree\n\u2022 Energy Classification: unstable\n\u2022 HOMO-LUMO Gap: 5.2 eV\n\u2022 Conductivity Prediction: insulator",
          actions: ["ANALYZE_MOLECULAR_DATA"]
        }
      }
    ]
  ]
};
function extractMolecularDataFromMessage(message) {
  const text = message.content.text;
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
  }
  const formulaMatch = text.match(/([A-Z][a-z]?\d*)+/);
  if (formulaMatch) {
    return {
      formula: formulaMatch[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return null;
}

// src/actions/generateVisualization.ts
import { logger as logger3 } from "@elizaos/core";
var generateVisualizationAction = {
  name: "GENERATE_MOLECULAR_VISUALIZATION",
  similes: ["VISUALIZE_MOLECULE", "PLOT_STRUCTURE", "MOLECULAR_VIZ", "SHOW_MOLECULE"],
  description: "Generates molecular visualizations and structure diagrams using Python visualization tools",
  validate: async (runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const visualizationKeywords = [
      "visualize",
      "plot",
      "show",
      "display",
      "diagram",
      "structure",
      "molecular visualization",
      "molecular diagram",
      "plot molecule",
      "show structure",
      "visualize structure",
      "molecular plot"
    ];
    const molecularKeywords = [
      "molecule",
      "molecular",
      "chemical",
      "structure",
      "compound",
      "atoms",
      "bonds"
    ];
    const hasVisualizationKeyword = visualizationKeywords.some((keyword) => text.includes(keyword));
    const hasMolecularKeyword = molecularKeywords.some((keyword) => text.includes(keyword));
    return hasVisualizationKeyword && hasMolecularKeyword;
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger3.info("\u{1F3A8} Generating molecular visualization...");
      const pythonService = runtime.getService("python-execution");
      if (!pythonService) {
        throw new Error("Python service not available");
      }
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent = {
          text: "\u274C Python environment is not available. Please ensure Python 3 and required packages (numpy, matplotlib) are installed for visualizations.",
          actions: ["GENERATE_MOLECULAR_VISUALIZATION"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const molecularData = extractMolecularDataFromMessage2(message) || {
        formula: "C6H6",
        name: "Benzene",
        atoms: [
          { id: 1, element: "C", x: 0, y: 0 },
          { id: 2, element: "C", x: 1.4, y: 0 },
          { id: 3, element: "C", x: 2.1, y: 1.2 },
          { id: 4, element: "C", x: 1.4, y: 2.4 },
          { id: 5, element: "C", x: 0, y: 2.4 },
          { id: 6, element: "C", x: -0.7, y: 1.2 },
          { id: 7, element: "H", x: -0.5, y: -0.9 },
          { id: 8, element: "H", x: 1.9, y: -0.9 },
          { id: 9, element: "H", x: 3.2, y: 1.2 },
          { id: 10, element: "H", x: 1.9, y: 3.3 },
          { id: 11, element: "H", x: -0.5, y: 3.3 },
          { id: 12, element: "H", x: -1.8, y: 1.2 }
        ],
        bonds: [
          { from: 1, to: 2 },
          { from: 2, to: 3 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
          { from: 5, to: 6 },
          { from: 6, to: 1 },
          { from: 1, to: 7 },
          { from: 2, to: 8 },
          { from: 3, to: 9 },
          { from: 4, to: 10 },
          { from: 5, to: 11 },
          { from: 6, to: 12 }
        ]
      };
      const visualizationResult = await pythonService.generateVisualization(molecularData);
      if (!visualizationResult.success && visualizationResult.error) {
        throw new Error(visualizationResult.error);
      }
      let responseText = `\u{1F3A8} **Molecular Visualization Generated**

`;
      responseText += `**Molecule:** ${molecularData.formula} ${molecularData.name ? `(${molecularData.name})` : ""}
`;
      responseText += `**Structure:**

`;
      if (visualizationResult.atoms && visualizationResult.atoms.length > 0) {
        responseText += generateASCIIStructure(visualizationResult);
        responseText += `

**Atoms:** ${visualizationResult.atoms.length}
`;
        responseText += `**Bonds:** ${molecularData.bonds ? molecularData.bonds.length : 0}

`;
        responseText += `**Atom Details:**
`;
        const elementCounts = {};
        visualizationResult.atoms.forEach((atom) => {
          elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
        });
        Object.entries(elementCounts).forEach(([element, count]) => {
          responseText += `\u2022 ${element}: ${count}
`;
        });
        responseText += `
**Coordinate System:** 2D Layout
`;
        const bounds = calculateBounds(visualizationResult.atoms);
        responseText += `\u2022 X range: ${bounds.minX.toFixed(2)} to ${bounds.maxX.toFixed(2)}
`;
        responseText += `\u2022 Y range: ${bounds.minY.toFixed(2)} to ${bounds.maxY.toFixed(2)}
`;
      }
      if (pythonEnv.packagesMissing.includes("matplotlib")) {
        responseText += `
**Note:** Install matplotlib for enhanced graphical visualizations: \`pip install matplotlib\``;
      }
      const responseContent = {
        text: responseText,
        actions: ["GENERATE_MOLECULAR_VISUALIZATION"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger3.error("Error in molecular visualization:", error);
      const errorContent = {
        text: `\u274C Failed to generate molecular visualization: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["GENERATE_MOLECULAR_VISUALIZATION"],
        source: message.content.source
      };
      if (callback) await callback(errorContent);
      return errorContent;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Can you visualize the molecular structure of benzene?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F3A8} **Molecular Visualization Generated**\n\n**Molecule:** C6H6 (Benzene)\n**Structure:**\n\n```\n    H\n    |\nH-C=C-H\n |   |\nH-C=C-H\n    |\n    H\n```\n\n**Atoms:** 12\n**Bonds:** 12\n\n**Atom Details:**\n\u2022 C: 6\n\u2022 H: 6",
          actions: ["GENERATE_MOLECULAR_VISUALIZATION"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Show me a diagram of this molecule"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F3A8} **Molecular Visualization Generated**\n\n**Molecule:** C6H6\n**Structure:**\n\n```\n       C\n     /   \\\n   C       C\n   |       |\n   C       C\n     \\   /\n       C\n```\n\n**Atoms:** 12\n**Bonds:** 12\n\n**Coordinate System:** 2D Layout\n\u2022 X range: -1.80 to 3.20\n\u2022 Y range: -0.90 to 3.30",
          actions: ["GENERATE_MOLECULAR_VISUALIZATION"]
        }
      }
    ]
  ]
};
function extractMolecularDataFromMessage2(message) {
  const text = message.content.text;
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
  }
  const formulaMatch = text.match(/([A-Z][a-z]?\d*)+/);
  if (formulaMatch) {
    return {
      formula: formulaMatch[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return null;
}
function generateASCIIStructure(visualizationData) {
  if (!visualizationData.atoms || visualizationData.atoms.length === 0) {
    return "```\nNo structure data available\n```";
  }
  const atomCount = visualizationData.atoms.length;
  const elements = visualizationData.atoms.map((atom) => atom.element);
  const uniqueElements = [...new Set(elements)];
  let ascii = "```\n";
  if (atomCount <= 20) {
    ascii += visualizationData.atoms.map((atom, index) => {
      const symbol = atom.element;
      const position = `(${atom.x?.toFixed(1) || "0"}, ${atom.y?.toFixed(1) || "0"})`;
      return `${symbol}${index + 1} ${position}`;
    }).join(" - ");
  } else {
    ascii += `Large molecule with ${atomCount} atoms:
`;
    uniqueElements.forEach((element) => {
      const count = elements.filter((e) => e === element).length;
      ascii += `${element}: ${count} atoms
`;
    });
  }
  ascii += "\n```";
  return ascii;
}
function calculateBounds(atoms) {
  if (!atoms || atoms.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  let minX = atoms[0].x || 0;
  let maxX = atoms[0].x || 0;
  let minY = atoms[0].y || 0;
  let maxY = atoms[0].y || 0;
  atoms.forEach((atom) => {
    const x = atom.x || 0;
    const y = atom.y || 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY };
}

// src/actions/parseGaussianFile.ts
import { logger as logger4 } from "@elizaos/core";
import * as path2 from "path";
import * as fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var parseGaussianFileAction = {
  name: "PARSE_GAUSSIAN_FILE",
  similes: ["PARSE_GAUSSIAN", "ANALYZE_GAUSSIAN_LOG", "READ_GAUSSIAN_FILE"],
  description: "Parses Gaussian computational chemistry log files using cclib to extract molecular properties and energies",
  validate: async (runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const gaussianKeywords = [
      "parse gaussian",
      "gaussian log",
      "gaussian file",
      ".log",
      ".out",
      "scf energy",
      "computational chemistry",
      "quantum chemistry",
      "parse log file",
      "gaussian output",
      "cclib",
      "analyze calculation"
    ];
    return gaussianKeywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger4.info("\u{1F9EC} Parsing Gaussian file...");
      const pythonService = runtime.getService("python-execution");
      if (!pythonService) {
        throw new Error("Python service not available");
      }
      const pythonEnv = await pythonService.checkPythonEnvironment();
      if (!pythonEnv.pythonAvailable) {
        const errorContent = {
          text: "\u274C Python environment is not available. Please install Python 3 and required packages.",
          actions: ["PARSE_GAUSSIAN_FILE"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      if (!pythonEnv.cclibAvailable) {
        const errorContent = {
          text: "\u274C cclib is required for Gaussian file parsing. Please install it with: `pip install cclib`",
          actions: ["PARSE_GAUSSIAN_FILE"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      logger4.info(`\u{1F50D} Attempting to extract file path from message: "${message.content.text}"`);
      const extractedPath = extractFilePathFromMessage(message);
      logger4.info(`\u{1F4DD} Extracted path result: ${extractedPath}`);
      let filePath = extractedPath;
      if (!filePath) {
        logger4.info("\u{1F50D} No file path extracted from message, looking for example files...");
        filePath = findExampleLogFile();
        logger4.info(`\u{1F4C1} Example file search result: ${filePath}`);
      }
      if (!filePath) {
        const currentDir = process.cwd();
        logger4.error(`\u274C No file found. CWD: ${currentDir}, __dirname: ${__dirname2}`);
        const testDir = path2.join(currentDir, "data", "examples");
        try {
          const files = __require("fs").readdirSync(testDir);
          logger4.info(`\u{1F4C2} Files in ${testDir}: ${files.join(", ")}`);
        } catch (error) {
          logger4.error(`\u274C Cannot read directory ${testDir}: ${error.message}`);
        }
        const errorContent = {
          text: `\u274C No Gaussian log file specified. Please provide a file path or add log files to the data/examples/ directory.

\u{1F50D} **Current working directory:** ${currentDir}

\u{1F4C1} **Looking for files in:**
\u2022 ${path2.join(currentDir, "data", "examples")}
\u2022 ./data/examples/
\u2022 Plugin directory data/examples/

\u{1F4A1} **Example usage:** "Parse the lactone.log file" or "Analyze TolueneEnergy.log"`,
          actions: ["PARSE_GAUSSIAN_FILE"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const metadata = {
        user_request: message.content.text,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: "eliza_agent"
      };
      const parseResult = await pythonService.parseGaussianFile(filePath, metadata, "json");
      if (parseResult.error) {
        throw new Error(parseResult.error);
      }
      let responseText = `\u{1F9EC} **Gaussian File Analysis Complete**

`;
      responseText += `**File:** ${path2.basename(filePath)}
`;
      if (parseResult.metadata) {
        responseText += `**Parser:** cclib v${parseResult.metadata.cclib_version}
`;
        responseText += `**Parsed:** ${new Date(parseResult.metadata.parsed_at).toLocaleString()}

`;
      }
      if (parseResult.molecular_formula) {
        responseText += `**Molecular Formula:** ${parseResult.molecular_formula}
`;
      }
      if (parseResult.natom) {
        responseText += `**Number of Atoms:** ${parseResult.natom}
`;
      }
      if (parseResult.charge !== void 0) {
        responseText += `**Charge:** ${parseResult.charge}
`;
      }
      if (parseResult.mult) {
        responseText += `**Multiplicity:** ${parseResult.mult}
`;
      }
      if (parseResult.scfenergies && parseResult.scfenergies.length > 0) {
        responseText += `
**Energies:**
`;
        const finalEnergy = parseResult.scfenergies[parseResult.scfenergies.length - 1];
        const finalEnergyHartree = finalEnergy / 27.211;
        responseText += `\u2022 Final SCF Energy: ${finalEnergy.toFixed(6)} eV (${finalEnergyHartree.toFixed(8)} hartree)
`;
        if (parseResult.scfenergies.length > 1) {
          responseText += `\u2022 Total SCF Cycles: ${parseResult.scfenergies.length}
`;
        }
      }
      if (parseResult.homo_lumo_gaps && parseResult.homo_lumo_gaps.length > 0) {
        const gap = parseResult.homo_lumo_gaps[0];
        responseText += `\u2022 HOMO-LUMO Gap: ${gap.gap_ev.toFixed(3)} eV
`;
        responseText += `\u2022 HOMO Energy: ${gap.homo_energy_ev.toFixed(3)} eV
`;
        responseText += `\u2022 LUMO Energy: ${gap.lumo_energy_ev.toFixed(3)} eV
`;
      }
      if (parseResult.vibfreqs && parseResult.vibfreqs.length > 0) {
        responseText += `
**Vibrational Analysis:**
`;
        responseText += `\u2022 Number of Frequencies: ${parseResult.vibfreqs.length}
`;
        const freqsToShow = parseResult.vibfreqs.slice(0, 5);
        responseText += `\u2022 Frequencies (cm\u207B\xB9): ${freqsToShow.map((f) => f.toFixed(1)).join(", ")}`;
        if (parseResult.vibfreqs.length > 5) {
          responseText += ` ... (${parseResult.vibfreqs.length - 5} more)`;
        }
        responseText += `
`;
      }
      if (parseResult.enthalpy || parseResult.entropy || parseResult.freeenergy) {
        responseText += `
**Thermochemistry:**
`;
        if (parseResult.enthalpy) {
          responseText += `\u2022 Enthalpy: ${parseResult.enthalpy.toFixed(6)} hartree
`;
        }
        if (parseResult.entropy) {
          responseText += `\u2022 Entropy: ${parseResult.entropy.toFixed(6)} cal/(mol\xB7K)
`;
        }
        if (parseResult.freeenergy) {
          responseText += `\u2022 Free Energy: ${parseResult.freeenergy.toFixed(6)} hartree
`;
        }
        if (parseResult.zpve) {
          responseText += `\u2022 Zero-Point Vibrational Energy: ${parseResult.zpve.toFixed(6)} hartree
`;
        }
      }
      if (parseResult.final_geometry) {
        responseText += `
**Final Geometry:** ${parseResult.final_geometry.length} atoms with optimized coordinates
`;
      }
      const availableProperties = Object.keys(parseResult).filter(
        (key) => !["metadata", "error"].includes(key) && parseResult[key] != null
      );
      responseText += `
**Available Data:** ${availableProperties.length} properties extracted
`;
      responseText += `Properties: ${availableProperties.slice(0, 8).join(", ")}`;
      if (availableProperties.length > 8) {
        responseText += ` ... (${availableProperties.length - 8} more)`;
      }
      const responseContent = {
        text: responseText,
        actions: ["PARSE_GAUSSIAN_FILE"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger4.error("Error in Gaussian file parsing:", error);
      const errorContent = {
        text: `\u274C Failed to parse Gaussian file: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["PARSE_GAUSSIAN_FILE"],
        source: message.content.source
      };
      if (callback) await callback(errorContent);
      return errorContent;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Can you parse the lactone.log Gaussian file?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F9EC} **Gaussian File Analysis Complete**\n\n**File:** lactone.log\n**Parser:** cclib v1.8.1\n\n**Molecular Formula:** C3H4O2\n**Number of Atoms:** 9\n**Charge:** 0\n**Multiplicity:** 1\n\n**Energies:**\n\u2022 Final SCF Energy: -6202.856269 eV (-227.856269 hartree)\n\u2022 HOMO-LUMO Gap: 8.245 eV\n\n**Available Data:** 15 properties extracted",
          actions: ["PARSE_GAUSSIAN_FILE"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Analyze the TolueneEnergy.log computational chemistry file"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F9EC} **Gaussian File Analysis Complete**\n\n**File:** TolueneEnergy.log\n**Parser:** cclib v1.8.1\n\n**Molecular Formula:** C7H8\n**Number of Atoms:** 15\n**Charge:** 0\n**Multiplicity:** 1\n\n**Energies:**\n\u2022 Final SCF Energy: -7384.636042 eV (-271.636042 hartree)\n\u2022 Total SCF Cycles: 5\n\n**Available Data:** 12 properties extracted",
          actions: ["PARSE_GAUSSIAN_FILE"]
        }
      }
    ]
  ]
};
function extractFilePathFromMessage(message) {
  const text = message.content.text;
  logger4.info(`\u{1F50D} extractFilePathFromMessage: text = "${text}"`);
  if (!text) return null;
  const filePatterns = [
    /(?:file:|path:)?\s*([^\s]+\.(?:log|out))/gi,
    /([^\s]*lactone\.log)/gi,
    /([^\s]*TolueneEnergy\.log)/gi,
    /([^\s]*\.(?:log|out))/gi
  ];
  for (let i = 0; i < filePatterns.length; i++) {
    const pattern = filePatterns[i];
    const match = text.match(pattern);
    logger4.info(`\u{1F50D} Pattern ${i + 1}: ${pattern} -> match: ${match ? match[0] : "none"}`);
    if (match) {
      let filePath = match[1] || match[0];
      filePath = filePath.replace(/^(file:|path:)/i, "").trim();
      logger4.info(`\u{1F4DD} Cleaned filename: "${filePath}"`);
      if (!filePath.includes("/") && !filePath.includes("\\")) {
        const possibleDataDirs = [
          path2.join(process.cwd(), "data", "examples"),
          path2.join(__dirname2, "..", "..", "data", "examples"),
          path2.join(__dirname2, "..", "..", "..", "data", "examples"),
          path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "data", "examples"),
          "./data/examples"
        ];
        for (const dataDir of possibleDataDirs) {
          const fullPath = path2.join(dataDir, filePath);
          try {
            fs2.accessSync(fullPath, fs2.constants.F_OK);
            logger4.info(`\u2705 Found file: ${fullPath}`);
            return fullPath;
          } catch {
            logger4.debug(`\u274C Not found: ${fullPath}`);
          }
        }
        const defaultPath = path2.join(process.cwd(), "data", "examples", filePath);
        logger4.info(`\u{1F504} Returning default path: ${defaultPath}`);
        return defaultPath;
      }
      return filePath;
    }
  }
  logger4.info("\u274C No file path patterns matched");
  return null;
}
function findExampleLogFile() {
  const possibleDataDirs = [
    // Current working directory
    path2.join(process.cwd(), "data", "examples"),
    // Plugin directory (if running from plugin root)
    path2.join(__dirname2, "..", "..", "data", "examples"),
    // Relative to dist directory (if running from built plugin)
    path2.join(__dirname2, "..", "..", "..", "data", "examples"),
    // ElizaOS plugin directory structure
    path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "data", "examples"),
    // Direct relative path
    "./data/examples"
  ];
  const exampleFiles = ["lactone.log", "TolueneEnergy.log"];
  for (const dataDir of possibleDataDirs) {
    for (const filename of exampleFiles) {
      const filePath = path2.join(dataDir, filename);
      try {
        fs2.accessSync(filePath, fs2.constants.F_OK);
        logger4.info(`\u2705 Found example file: ${filePath}`);
        return filePath;
      } catch (error) {
        logger4.debug(`\u274C File not found: ${filePath}`);
      }
    }
  }
  logger4.warn("\u274C No example log files found in any location");
  return null;
}

// src/actions/diagnostics.ts
import { logger as logger5 } from "@elizaos/core";
import * as path3 from "path";
import * as fs3 from "fs";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var diagnosticsAction = {
  name: "COMPCHEM_DIAGNOSTICS",
  similes: ["DIAGNOSTICS", "DEBUG_PATHS", "CHECK_ENVIRONMENT", "TROUBLESHOOT"],
  description: "Runs diagnostic checks for the computational chemistry plugin to help debug path and environment issues",
  validate: async (runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const diagnosticKeywords = [
      "diagnostic",
      "debug",
      "troubleshoot",
      "check environment",
      "path issues",
      "file not found",
      "python not working"
    ];
    return diagnosticKeywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger5.info("\u{1F50D} Running computational chemistry diagnostics...");
      let responseText = "\u{1F50D} **Computational Chemistry Plugin Diagnostics**\n\n";
      const currentDir = process.cwd();
      responseText += `\u{1F4C1} **Current Working Directory:**
\`${currentDir}\`

`;
      responseText += "\u{1F4CA} **Data Files Check:**\n";
      const possibleDataDirs = [
        path3.join(currentDir, "data", "examples"),
        path3.join(__dirname3, "..", "..", "data", "examples"),
        path3.join(__dirname3, "..", "..", "..", "data", "examples"),
        path3.join(currentDir, "plugins", "my-compchem-plugin-v2", "data", "examples"),
        "./data/examples"
      ];
      const dataFiles = ["lactone.log", "TolueneEnergy.log"];
      let foundDataFiles = false;
      for (const dataDir2 of possibleDataDirs) {
        for (const filename of dataFiles) {
          const filePath = path3.join(dataDir2, filename);
          try {
            fs3.accessSync(filePath);
            responseText += `  \u2705 Found: \`${filePath}\`
`;
            foundDataFiles = true;
          } catch {
            responseText += `  \u274C Missing: \`${filePath}\`
`;
          }
        }
      }
      if (!foundDataFiles) {
        responseText += "\n\u26A0\uFE0F  **No data files found!** Please ensure log files are in the data/examples/ directory.\n";
      }
      responseText += "\n\u{1F40D} **Python Scripts Check:**\n";
      const scriptNames = ["parse_gaussian_cclib.py", "molecular_analyzer.py", "plot_gaussian_analysis.py"];
      const possibleScriptDirs = [
        path3.join(currentDir, "py"),
        path3.join(__dirname3, "..", "..", "py"),
        path3.join(__dirname3, "..", "..", "..", "py"),
        path3.join(currentDir, "plugins", "my-compchem-plugin-v2", "py"),
        "./py"
      ];
      let foundScripts = false;
      for (const scriptDir of possibleScriptDirs) {
        for (const scriptName of scriptNames) {
          const scriptPath = path3.join(scriptDir, scriptName);
          try {
            fs3.accessSync(scriptPath);
            responseText += `  \u2705 Found: \`${scriptPath}\`
`;
            foundScripts = true;
          } catch {
            responseText += `  \u274C Missing: \`${scriptPath}\`
`;
          }
        }
      }
      if (!foundScripts) {
        responseText += "\n\u26A0\uFE0F  **No Python scripts found!** Please ensure scripts are in the py/ directory.\n";
      }
      responseText += "\n\u{1F40D} **Python Environment:**\n";
      const pythonService = runtime.getService("python-execution");
      if (pythonService) {
        try {
          const pythonEnv = await pythonService.checkPythonEnvironment();
          if (pythonEnv.pythonAvailable) {
            responseText += `  \u2705 Python: ${pythonEnv.pythonVersion}
`;
            if (pythonEnv.cclibAvailable) {
              responseText += `  \u2705 cclib: Available
`;
            } else {
              responseText += `  \u274C cclib: Missing (install with: pip install cclib)
`;
            }
            responseText += `  \u{1F4E6} **Available packages:** ${pythonEnv.packagesAvailable.join(", ")}
`;
            if (pythonEnv.packagesMissing.length > 0) {
              responseText += `  \u{1F4E6} **Missing packages:** ${pythonEnv.packagesMissing.join(", ")}
`;
            }
          } else {
            responseText += `  \u274C Python: Not available
`;
          }
        } catch (error) {
          responseText += `  \u274C Python check failed: ${error instanceof Error ? error.message : "Unknown error"}
`;
        }
      } else {
        responseText += `  \u274C PythonService: Not available
`;
      }
      responseText += "\n\u2699\uFE0F  **Runtime Settings:**\n";
      const pythonPath = runtime.getSetting("PYTHON_PATH");
      const pythonDebug = runtime.getSetting("PYTHON_DEBUG");
      const dataDir = runtime.getSetting("COMPCHEM_DATA_DIR");
      responseText += `  \u2022 PYTHON_PATH: ${pythonPath || "Not set (default: python3)"}
`;
      responseText += `  \u2022 PYTHON_DEBUG: ${pythonDebug || "Not set (default: false)"}
`;
      responseText += `  \u2022 COMPCHEM_DATA_DIR: ${dataDir || "Not set (default: ./data)"}
`;
      responseText += "\n\u{1F50C} **Plugin Info:**\n";
      responseText += `  \u2022 __dirname: \`${__dirname3}\`
`;
      responseText += `  \u2022 Plugin Name: my-compchem-plugin-v2
`;
      responseText += `  \u2022 Services: PythonService, CompchemService
`;
      responseText += `  \u2022 Actions: PARSE_GAUSSIAN_FILE, ANALYZE_MOLECULAR_DATA, GENERATE_MOLECULAR_VISUALIZATION
`;
      responseText += "\n\u{1F4A1} **Recommendations:**\n";
      if (!foundDataFiles) {
        responseText += `  \u2022 Copy log files to: \`${path3.join(currentDir, "data", "examples")}\`
`;
      }
      if (!foundScripts) {
        responseText += `  \u2022 Copy Python scripts to: \`${path3.join(currentDir, "py")}\`
`;
      }
      responseText += `  \u2022 Try: "Parse the lactone.log file"
`;
      responseText += `  \u2022 Try: "Analyze molecule C6H6"
`;
      const responseContent = {
        text: responseText,
        actions: ["COMPCHEM_DIAGNOSTICS"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger5.error("Error in diagnostics:", error);
      const errorContent = {
        text: `\u274C Diagnostics failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["COMPCHEM_DIAGNOSTICS"],
        source: message.content.source
      };
      if (callback) await callback(errorContent);
      return errorContent;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "Run diagnostics to check if everything is working"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F50D} **Computational Chemistry Plugin Diagnostics**\n\n\u{1F4C1} **Current Working Directory:** `/path/to/workspace`\n\n\u{1F4CA} **Data Files Check:**\n  \u2705 Found: `/path/to/data/examples/lactone.log`\n  \u2705 Found: `/path/to/data/examples/TolueneEnergy.log`\n\n\u{1F40D} **Python Environment:**\n  \u2705 Python: Python 3.9.0\n  \u2705 cclib: Available\n\n\u{1F4A1} All systems operational!",
          actions: ["COMPCHEM_DIAGNOSTICS"]
        }
      }
    ]
  ]
};

// src/plugin.ts
var configSchema = z.object({
  PYTHON_PATH: z.string().optional().default("python3").transform((val) => {
    if (!val) {
      logger6.info("Using default Python path: python3");
    }
    return val || "python3";
  }),
  PYTHON_DEBUG: z.string().optional().transform((val) => {
    return val === "true" ? "true" : "false";
  }),
  COMPCHEM_DATA_DIR: z.string().optional().default("./data").transform((val) => {
    return val || "./data";
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
      logger6.info("Handling HELLO_WORLD action");
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
      logger6.error("Error in HELLO_WORLD action:", error);
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
var CompchemService = class _CompchemService extends Service2 {
  static serviceType = "compchem-manager";
  capabilityDescription = "Computational chemistry management service that coordinates molecular analysis and Python integration.";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    logger6.info(`\u{1F9EA} Starting computational chemistry service: ${(/* @__PURE__ */ new Date()).toISOString()}`);
    const service = new _CompchemService(runtime);
    const pythonService = runtime.getService("python-execution");
    if (pythonService) {
      logger6.info("\u2705 Python integration available");
      try {
        const pythonEnv = await pythonService.checkPythonEnvironment();
        if (pythonEnv.pythonAvailable) {
          logger6.info(`\u{1F40D} Python ${pythonEnv.pythonVersion} detected`);
          logger6.info(`\u{1F4E6} Available packages: ${pythonEnv.packagesAvailable.join(", ")}`);
          if (pythonEnv.packagesMissing.length > 0) {
            logger6.warn(`\u26A0\uFE0F  Missing packages: ${pythonEnv.packagesMissing.join(", ")}`);
          }
        } else {
          logger6.warn("\u26A0\uFE0F  Python environment not available");
        }
      } catch (error) {
        logger6.warn("\u26A0\uFE0F  Could not check Python environment:", error);
      }
    } else {
      logger6.warn("\u26A0\uFE0F  Python service not available");
    }
    return service;
  }
  static async stop(runtime) {
    logger6.info("\u{1F9EA} Stopping computational chemistry service");
    const service = runtime.getService(_CompchemService.serviceType);
    if (!service) {
      throw new Error("Computational chemistry service not found");
    }
    service.stop();
  }
  async stop() {
    logger6.info("\u{1F9EA} Computational chemistry service stopped");
  }
};
var myCompchemPlugin = {
  name: "my-compchem-plugin-v2",
  description: "Advanced computational chemistry plugin for ElizaOS with Python integration",
  config: {
    PYTHON_PATH: process.env.PYTHON_PATH,
    PYTHON_DEBUG: process.env.PYTHON_DEBUG,
    COMPCHEM_DATA_DIR: process.env.COMPCHEM_DATA_DIR
  },
  async init(config) {
    logger6.info("\u{1F9EA} Initializing computational chemistry plugin v2");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
      logger6.info("\u2705 Plugin configuration validated successfully");
      logger6.info(`\u{1F40D} Python path: ${validatedConfig.PYTHON_PATH}`);
      logger6.info(`\u{1F4C1} Data directory: ${validatedConfig.COMPCHEM_DATA_DIR}`);
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
        logger6.debug("MESSAGE_RECEIVED event received");
        logger6.debug(Object.keys(params));
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger6.debug("VOICE_MESSAGE_RECEIVED event received");
        logger6.debug(Object.keys(params));
      }
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger6.debug("WORLD_CONNECTED event received");
        logger6.debug(Object.keys(params));
      }
    ],
    WORLD_JOINED: [
      async (params) => {
        logger6.debug("WORLD_JOINED event received");
        logger6.debug(Object.keys(params));
      }
    ]
  },
  services: [PythonService, CompchemService],
  actions: [helloWorldAction, analyzeMolecularDataAction, generateVisualizationAction, parseGaussianFileAction, diagnosticsAction],
  providers: [helloWorldProvider],
  tests: [StarterPluginTestSuite]
  // dependencies: ['@elizaos/plugin-knowledge'], <--- plugin dependecies go here (if requires another plugin)
};

// src/index.ts
var index_default = myCompchemPlugin;
export {
  CompchemService,
  PythonService,
  analyzeMolecularDataAction,
  index_default as default,
  diagnosticsAction,
  generateVisualizationAction,
  myCompchemPlugin,
  parseGaussianFileAction
};
//# sourceMappingURL=index.js.map