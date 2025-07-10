var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/plugin.ts
import {
  ModelType,
  Service as Service3,
  logger as logger10
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
  logger as logger2
} from "@elizaos/core";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import * as path2 from "path";
import { promises as fs2 } from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/services/deploymentService.ts
import * as fs from "fs";
import * as path from "path";
import { logger } from "@elizaos/core";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DeploymentService = class {
  /**
   * Deploy Python files from plugin to ElizaOS agent directory
   */
  static async deployPythonFiles() {
    try {
      logger.info("\u{1F680} Deploying Python files to agent directory...");
      const agentDir = process.cwd();
      let pluginPyDir = path.join(__dirname, "..", "..", "py");
      const targetPyDir = path.join(agentDir, "py");
      logger.info(`\u{1F50D} Initial plugin py directory: ${pluginPyDir}`);
      if (!fs.existsSync(pluginPyDir)) {
        const alternativePaths = [
          // Try relative to current working directory
          path.join(process.cwd(), "..", "plugin-my-compchem-plugin-v2", "py"),
          // Try relative to agent directory
          path.join(agentDir, "..", "plugin-my-compchem-plugin-v2", "py"),
          // Try if we're in a plugins directory structure
          path.join(agentDir, "plugins", "plugin-my-compchem-plugin-v2", "py"),
          // Try absolute path construction from __dirname
          path.join(path.dirname(path.dirname(path.dirname(__dirname))), "plugin-my-compchem-plugin-v2", "py")
        ];
        for (const altPath of alternativePaths) {
          if (fs.existsSync(altPath)) {
            logger.info(`\u{1F504} Using alternative path: ${altPath}`);
            pluginPyDir = altPath;
            break;
          }
        }
      }
      logger.info(`\u{1F4C1} Source directory: ${pluginPyDir}`);
      logger.info(`\u{1F4C1} Target directory: ${targetPyDir}`);
      if (!fs.existsSync(targetPyDir)) {
        fs.mkdirSync(targetPyDir, { recursive: true });
        logger.info(`\u{1F4C1} Created directory: ${targetPyDir}`);
      }
      const filesToDeploy = [
        "parse_gaussian_cclib.py",
        "plot_gaussian_analysis.py",
        "generate_comprehensive_report.py",
        "molecular_analyzer.py",
        "__init__.py"
      ];
      let deployedCount = 0;
      let skippedCount = 0;
      let missingCount = 0;
      for (const fileName of filesToDeploy) {
        const sourcePath = path.join(pluginPyDir, fileName);
        const targetPath = path.join(targetPyDir, fileName);
        if (fs.existsSync(sourcePath)) {
          let shouldCopy = true;
          if (fs.existsSync(targetPath)) {
            const sourceStats = fs.statSync(sourcePath);
            const targetStats = fs.statSync(targetPath);
            shouldCopy = sourceStats.mtime > targetStats.mtime;
          }
          if (shouldCopy) {
            fs.copyFileSync(sourcePath, targetPath);
            logger.info(`\u2705 Deployed: ${fileName}`);
            deployedCount++;
          } else {
            logger.info(`\u23ED\uFE0F  Skipped (up to date): ${fileName}`);
            skippedCount++;
          }
        } else {
          logger.warn(`\u26A0\uFE0F  Source file not found: ${sourcePath}`);
          missingCount++;
        }
      }
      logger.info(`\u{1F4CA} Deployment Summary: ${deployedCount} deployed, ${skippedCount} skipped, ${missingCount} missing`);
      await this.deployDataFiles();
      logger.info("\u{1F389} Python files deployment complete!");
    } catch (error) {
      logger.error("\u274C Failed to deploy Python files:", error);
      throw error;
    }
  }
  /**
   * Deploy example data files
   */
  static async deployDataFiles() {
    const agentDir = process.cwd();
    let pluginDataDir = path.join(__dirname, "..", "..", "data", "examples");
    const targetDataDir = path.join(agentDir, "data", "examples");
    if (!fs.existsSync(pluginDataDir)) {
      const alternativePaths = [
        // Try relative to current working directory
        path.join(process.cwd(), "..", "plugin-my-compchem-plugin-v2", "data", "examples"),
        // Try relative to agent directory
        path.join(agentDir, "..", "plugin-my-compchem-plugin-v2", "data", "examples"),
        // Try if we're in a plugins directory structure
        path.join(agentDir, "plugins", "plugin-my-compchem-plugin-v2", "data", "examples"),
        // Try absolute path construction from __dirname
        path.join(path.dirname(path.dirname(path.dirname(__dirname))), "plugin-my-compchem-plugin-v2", "data", "examples")
      ];
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          logger.info(`\u{1F504} Using alternative data path: ${altPath}`);
          pluginDataDir = altPath;
          break;
        }
      }
    }
    if (!fs.existsSync(targetDataDir)) {
      fs.mkdirSync(targetDataDir, { recursive: true });
      logger.info(`\u{1F4C1} Created data directory: ${targetDataDir}`);
    }
    if (fs.existsSync(pluginDataDir)) {
      const dataFiles = fs.readdirSync(pluginDataDir).filter((f) => f.endsWith(".log"));
      for (const fileName of dataFiles) {
        const sourcePath = path.join(pluginDataDir, fileName);
        const targetPath = path.join(targetDataDir, fileName);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          logger.info(`\u2705 Deployed data file: ${fileName}`);
        }
      }
    }
  }
  /**
   * Check if Python files are properly deployed
   */
  static checkDeployment() {
    const agentDir = process.cwd();
    const targetPyDir = path.join(agentDir, "py");
    const requiredFiles = [
      "parse_gaussian_cclib.py",
      "plot_gaussian_analysis.py",
      "generate_comprehensive_report.py",
      "molecular_analyzer.py"
    ];
    const missing = [];
    for (const fileName of requiredFiles) {
      const filePath = path.join(targetPyDir, fileName);
      if (!fs.existsSync(filePath)) {
        missing.push(fileName);
      }
    }
    return {
      deployed: missing.length === 0,
      missing
    };
  }
};

// src/services/pythonService.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
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
      logger2.info("\u{1F40D} Python Service initialized with debug mode");
      logger2.info(`   Python path: ${pythonPath}`);
    }
    return service;
  }
  async stop() {
    logger2.info("\u{1F40D} Python Service stopped");
  }
  /**
   * Execute a Python script using execFile (for simple scripts that return JSON)
   */
  async executePythonScript(scriptPath, args = [], options = {}) {
    try {
      const pythonInterpreter = this.runtime.getSetting("PYTHON_PATH") || "python3";
      const absoluteScriptPath = path2.resolve(scriptPath);
      await fs2.access(absoluteScriptPath);
      const { stdout } = await execFileAsync(pythonInterpreter, [absoluteScriptPath, ...args], {
        timeout: options.timeout || 3e4,
        // 30 second default timeout
        encoding: "utf8"
      });
      return stdout;
    } catch (error) {
      logger2.error("Python script execution failed:", error);
      throw error;
    }
  }
  /**
   * Execute Python script with streaming output (for long-running processes)
   */
  async executePythonScriptStreaming(scriptPath, args = [], onData, onError) {
    return new Promise((resolve2, reject) => {
      const pythonInterpreter = this.runtime.getSetting("PYTHON_PATH") || "python3";
      const absoluteScriptPath = path2.resolve(scriptPath);
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
          logger2.error(`\u274C Python process failed with code ${code}: ${stderr}`);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      pythonProcess.on("error", (error) => {
        logger2.error(`\u274C Failed to start Python process: ${error}`);
        reject(error);
      });
    });
  }
  /**
   * Analyze molecular data using Python
   */
  async analyzeMolecularData(molecularData, analysisType = "molecular") {
    try {
      await this.ensurePythonFilesDeployed();
      const possibleScriptPaths = [
        path2.join(process.cwd(), "py", "molecular_analyzer.py"),
        path2.join(__dirname2, "..", "..", "py", "molecular_analyzer.py"),
        path2.join(__dirname2, "..", "..", "..", "py", "molecular_analyzer.py"),
        path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "molecular_analyzer.py"),
        "./py/molecular_analyzer.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs2.access(possiblePath);
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
      logger2.error("Molecular data analysis failed:", error);
      throw error;
    }
  }
  /**
   * Generate visualization charts using Python matplotlib
   */
  async generateVisualization(chartType, plotData, outputDir) {
    try {
      await this.ensurePythonFilesDeployed();
      const possibleScriptPaths = [
        path2.join(process.cwd(), "py", "plot_gaussian_analysis.py"),
        path2.join(__dirname2, "..", "..", "py", "plot_gaussian_analysis.py"),
        path2.join(__dirname2, "..", "..", "..", "py", "plot_gaussian_analysis.py"),
        path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "plot_gaussian_analysis.py"),
        "./py/plot_gaussian_analysis.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs2.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python plotting script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const outputFileName = `${chartType}_chart.png`;
      const outputPath = path2.join(outputDir, outputFileName);
      const dataJson = JSON.stringify(plotData);
      const args = [chartType, dataJson, outputPath];
      const result = await this.executePythonScript(scriptPath, args);
      let dataPoints = 0;
      if (plotData.energyData) {
        const energyCount = Object.values(plotData.energyData).reduce((sum, energies) => sum + (Array.isArray(energies) ? energies.length : 0), 0);
        dataPoints += energyCount;
      }
      return {
        success: true,
        chartPath: outputPath,
        dataPoints,
        description: `${chartType} chart generated with ${dataPoints} data points`,
        message: result
      };
    } catch (error) {
      logger2.error("Visualization generation failed:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
    }
  }
  /**
   * Parse Gaussian log files using cclib
   */
  async parseGaussianFile(filePath, metadata = {}, outputFormat = "json") {
    try {
      await this.ensurePythonFilesDeployed();
      const possibleScriptPaths = [
        path2.join(process.cwd(), "py", "parse_gaussian_cclib.py"),
        path2.join(__dirname2, "..", "..", "py", "parse_gaussian_cclib.py"),
        path2.join(__dirname2, "..", "..", "..", "py", "parse_gaussian_cclib.py"),
        path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "parse_gaussian_cclib.py"),
        "./py/parse_gaussian_cclib.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs2.access(possiblePath);
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
      logger2.error("Gaussian file parsing failed:", error);
      return { error: error instanceof Error ? error.message : "Unknown error", success: false };
    }
  }
  /**
   * Generate analysis plots using matplotlib
   */
  async generateAnalysisPlots(chartType, data, outputPath) {
    try {
      await this.ensurePythonFilesDeployed();
      const possibleScriptPaths = [
        path2.join(process.cwd(), "py", "plot_gaussian_analysis.py"),
        path2.join(__dirname2, "..", "..", "py", "plot_gaussian_analysis.py"),
        path2.join(__dirname2, "..", "..", "..", "py", "plot_gaussian_analysis.py"),
        path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "plot_gaussian_analysis.py"),
        "./py/plot_gaussian_analysis.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs2.access(possiblePath);
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
      logger2.error("Analysis plot generation failed:", error);
      return { error: error instanceof Error ? error.message : "Unknown error", success: false };
    }
  }
  /**
   * Generate comprehensive report using Python
   */
  async generateComprehensiveReport(reportData, outputDir) {
    try {
      await this.ensurePythonFilesDeployed();
      const possibleScriptPaths = [
        path2.join(process.cwd(), "py", "generate_comprehensive_report.py"),
        path2.join(__dirname2, "..", "..", "py", "generate_comprehensive_report.py"),
        path2.join(__dirname2, "..", "..", "..", "py", "generate_comprehensive_report.py"),
        path2.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "py", "generate_comprehensive_report.py"),
        "./py/generate_comprehensive_report.py"
      ];
      let scriptPath = null;
      for (const possiblePath of possibleScriptPaths) {
        try {
          await fs2.access(possiblePath);
          scriptPath = possiblePath;
          break;
        } catch {
        }
      }
      if (!scriptPath) {
        throw new Error(`Python comprehensive report script not found. Tried paths: ${possibleScriptPaths.join(", ")}`);
      }
      const dataJson = JSON.stringify(reportData);
      const args = [dataJson, outputDir];
      const result = await this.executePythonScript(scriptPath, args);
      return JSON.parse(result);
    } catch (error) {
      logger2.error("Comprehensive report generation failed:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      };
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
      logger2.warn("Python environment check failed:", error);
      return {
        pythonAvailable: false,
        packagesAvailable: [],
        packagesMissing: ["numpy", "matplotlib", "scipy", "pandas", "seaborn", "cclib"],
        cclibAvailable: false
      };
    }
  }
  /**
   * Ensure Python files are deployed and available
   */
  async ensurePythonFilesDeployed() {
    const deployment = DeploymentService.checkDeployment();
    if (!deployment.deployed) {
      logger2.info(`\u{1F680} Auto-deploying missing Python files: ${deployment.missing.join(", ")}`);
      try {
        await DeploymentService.deployPythonFiles();
      } catch (error) {
        logger2.warn("\u26A0\uFE0F  Auto-deployment failed:", error);
        throw new Error(`Required Python files missing: ${deployment.missing.join(", ")}`);
      }
    }
  }
};

// src/services/autoKnowledgeService.ts
import { Service as Service2, logger as logger3 } from "@elizaos/core";
import { promises as fs3 } from "fs";
import { watch } from "fs";
import * as path3 from "path";
var AutoKnowledgeService = class _AutoKnowledgeService extends Service2 {
  static serviceType = "auto-knowledge";
  capabilityDescription = "Automatically monitors data/examples directory and builds knowledge graph from Gaussian files";
  knowledgeGraphPath;
  watchedDirectory;
  processedFiles = /* @__PURE__ */ new Set();
  isInitialized = false;
  fileWatcher = null;
  constructor(runtime) {
    super(runtime);
    this.knowledgeGraphPath = "";
    this.watchedDirectory = "";
  }
  static async start(runtime) {
    const service = new _AutoKnowledgeService(runtime);
    await service.initialize();
    logger3.info("\u{1F9E0} Auto Knowledge Service started - watching data/examples/ for Gaussian files");
    return service;
  }
  async initialize() {
    if (this.isInitialized) return;
    this.knowledgeGraphPath = path3.join(process.cwd(), "data", "auto-knowledge-graph.ttl");
    this.watchedDirectory = path3.join(process.cwd(), "data", "examples");
    try {
      await fs3.mkdir(path3.dirname(this.knowledgeGraphPath), { recursive: true });
      await fs3.mkdir(this.watchedDirectory, { recursive: true });
      await this.loadOrCreateKnowledgeGraph();
      await this.scanExistingFiles();
      this.startFileWatcher();
      this.isInitialized = true;
      logger3.info(`\u{1F4CA} Auto knowledge graph: ${this.knowledgeGraphPath}`);
      logger3.info(`\u{1F440} Watching directory: ${this.watchedDirectory}`);
    } catch (error) {
      logger3.error("\u274C Failed to initialize Auto Knowledge Service:", error);
    }
  }
  static async stop(runtime) {
    const service = runtime.getService("auto-knowledge");
    if (service) {
      service.stopWatching();
    }
    logger3.info("\u{1F9E0} Auto Knowledge Service stopped");
  }
  async stop() {
    this.stopWatching();
  }
  stopWatching() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
  }
  async loadOrCreateKnowledgeGraph() {
    try {
      const stats = await fs3.stat(this.knowledgeGraphPath);
      if (stats.isFile()) {
        logger3.info("\u{1F4D6} Loading existing auto knowledge graph...");
        const content = await fs3.readFile(this.knowledgeGraphPath, "utf-8");
        const fileMatches = content.match(/# File: (.+\.log)/g);
        if (fileMatches) {
          for (const match of fileMatches) {
            const filename = match.replace("# File: ", "");
            this.processedFiles.add(filename);
          }
        }
        logger3.info(`\u{1F4CA} Found ${this.processedFiles.size} previously processed files`);
      }
    } catch (error) {
      logger3.info("\u{1F195} Creating new auto knowledge graph...");
      await this.createInitialKnowledgeGraph();
    }
  }
  async createInitialKnowledgeGraph() {
    const initialContent = `# Auto Knowledge Graph - ElizaOS Plugin v2
# Created: ${(/* @__PURE__ */ new Date()).toISOString()}
# Files are automatically processed when added to data/examples/

@prefix ex: <https://example.org/auto#> .
@prefix ontocompchem: <http://www.theworldavatar.com/ontology/ontocompchem/> .
@prefix cheminf: <http://semanticscience.org/resource/> .

`;
    await fs3.writeFile(this.knowledgeGraphPath, initialContent, "utf-8");
    logger3.info("\u2705 Auto knowledge graph created");
  }
  // Automatic file monitoring (like v1)
  async scanExistingFiles() {
    try {
      const files = await fs3.readdir(this.watchedDirectory);
      const gaussianFiles = files.filter(
        (file) => file.toLowerCase().endsWith(".log") || file.toLowerCase().endsWith(".out")
      );
      logger3.info(`\u{1F50D} Found ${gaussianFiles.length} existing Gaussian files`);
      for (const file of gaussianFiles) {
        const filePath = path3.join(this.watchedDirectory, file);
        if (!this.processedFiles.has(file)) {
          await this.processFileAutomatically(filePath);
        }
      }
    } catch (error) {
      logger3.warn("\u26A0\uFE0F  Could not scan existing files:", error.message);
    }
  }
  startFileWatcher() {
    try {
      this.fileWatcher = watch(this.watchedDirectory, { recursive: false }, async (eventType, filename) => {
        if (!filename) return;
        if (!filename.toLowerCase().endsWith(".log") && !filename.toLowerCase().endsWith(".out")) {
          return;
        }
        const filePath = path3.join(this.watchedDirectory, filename);
        if (eventType === "rename" || eventType === "change") {
          try {
            await fs3.access(filePath);
            if (this.processedFiles.has(filename)) {
              return;
            }
            logger3.info(`\u{1F195} New Gaussian file detected: ${filename}`);
            await this.processFileAutomatically(filePath);
          } catch (error) {
            logger3.debug(`File no longer accessible: ${filename}`);
          }
        }
      });
      logger3.info("\u{1F440} File watcher started");
    } catch (error) {
      logger3.warn("\u26A0\uFE0F  Could not start file watcher:", error.message);
    }
  }
  async processFileAutomatically(filePath) {
    const filename = path3.basename(filePath);
    try {
      const pythonService = this.runtime.getService("python-execution");
      if (!pythonService) {
        logger3.warn("\u26A0\uFE0F  Python service not available, skipping file processing");
        return;
      }
      logger3.info(`\u2699\uFE0F  Auto-processing: ${filename}`);
      const metadata = {
        filename,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: "auto-monitor",
        parser: "cclib"
      };
      logger3.info(`\u{1F50D} Calling Python service to parse ${filename}...`);
      const rdfResult = await pythonService.parseGaussianFile(filePath, metadata, "turtle");
      logger3.info(`\u{1F4DD} Python service returned:`, {
        type: typeof rdfResult,
        isString: typeof rdfResult === "string",
        hasError: rdfResult && typeof rdfResult === "object" && "error" in rdfResult,
        length: typeof rdfResult === "string" ? rdfResult.length : "N/A",
        preview: typeof rdfResult === "string" ? rdfResult.substring(0, 100) + "..." : rdfResult
      });
      let rdfContent = null;
      let success = false;
      if (typeof rdfResult === "string") {
        rdfContent = rdfResult;
        success = true;
      } else if (rdfResult && typeof rdfResult === "object") {
        if (rdfResult.error) {
          logger3.error(`\u274C Python parsing error for ${filename}: ${rdfResult.error}`);
        } else if (rdfResult.rdf && typeof rdfResult.rdf === "string") {
          rdfContent = rdfResult.rdf;
          success = rdfResult.success !== false;
        } else {
          logger3.error(`\u274C Unexpected object format for ${filename}:`, rdfResult);
        }
      } else {
        logger3.error(`\u274C No result returned from Python service for ${filename}`);
      }
      if (success && rdfContent && rdfContent.trim().length > 0) {
        const header = `
# File: ${filename} (auto-processed ${(/* @__PURE__ */ new Date()).toISOString()})
`;
        const contentToAppend = header + rdfContent + "\n";
        await fs3.appendFile(this.knowledgeGraphPath, contentToAppend, "utf-8");
        this.processedFiles.add(filename);
        const tripleCount = (rdfContent.match(/\./g) || []).length;
        const successMessage = `\u2705 Auto-added ${tripleCount} triples from ${filename}`;
        logger3.info(successMessage);
        try {
          const chatMessage = `\u{1F9E0} **Auto Knowledge Update**

${successMessage}

\u{1F4C1} **File:** \`${filename}\`
\u{1F4CA} **Triples Added:** ${tripleCount}
\u23F0 **Processed:** ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
          const messageManager = this.runtime.messageManager;
          if (messageManager) {
            await messageManager.createMemory({
              userId: this.runtime.agentId,
              agentId: this.runtime.agentId,
              roomId: this.runtime.agentId,
              // Use agent's room for system messages
              content: {
                text: chatMessage,
                source: "auto-knowledge-service"
              },
              createdAt: Date.now()
            });
            logger3.debug(`\u{1F4E8} Sent chat message for ${filename}`);
          }
        } catch (chatError) {
          logger3.debug("Could not send message to chat:", chatError.message);
        }
      } else {
        logger3.error(`\u274C Could not parse ${filename}: Invalid or empty RDF content`);
      }
    } catch (error) {
      logger3.error(`\u274C Error auto-processing ${filename}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: error
      });
    }
  }
  // Simple query method
  async getStats() {
    try {
      const content = await fs3.readFile(this.knowledgeGraphPath, "utf-8");
      return {
        totalFiles: this.processedFiles.size,
        filesList: Array.from(this.processedFiles),
        molecules: (content.match(/ontocompchem:QuantumCalculation/g) || []).length,
        scfEnergies: (content.match(/ontocompchem:SCFEnergy/g) || []).length,
        atoms: (content.match(/cheminf:Atom/g) || []).length,
        lastUpdate: (/* @__PURE__ */ new Date()).toISOString(),
        knowledgeGraphPath: this.knowledgeGraphPath,
        watchedDirectory: this.watchedDirectory
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  async searchKnowledgeGraph(query) {
    try {
      const content = await fs3.readFile(this.knowledgeGraphPath, "utf-8");
      const lines = content.split("\n");
      const results = lines.filter((line) => line.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
      return {
        query,
        matches: results.length,
        results
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  async getEnergies() {
    try {
      const content = await fs3.readFile(this.knowledgeGraphPath, "utf-8");
      const energiesByFile = {};
      let currentFile = "unknown";
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("# File:")) {
          const match = line.match(/# File: (.+?) \(/);
          if (match) {
            currentFile = match[1];
            if (!energiesByFile[currentFile]) {
              energiesByFile[currentFile] = [];
            }
          }
        }
        if (line.includes("ontocompchem:hasValue") || line.includes("ontocompchem:hasValueEV")) {
          const valueMatch = line.match(/ontocompchem:hasValue\s+([+-]?\d+\.?\d*)/);
          const evMatch = line.match(/ontocompchem:hasValueEV\s+([+-]?\d+\.?\d*)/);
          if (valueMatch) {
            const energy = parseFloat(valueMatch[1]);
            energiesByFile[currentFile] = energiesByFile[currentFile] || [];
            let energyEntry = energiesByFile[currentFile].find((e) => Math.abs(e.hartree - energy) < 1e-6);
            if (!energyEntry) {
              energyEntry = {
                hartree: energy,
                eV: energy * 27.211
                // Convert hartree to eV
              };
              energiesByFile[currentFile].push(energyEntry);
            }
          }
          if (evMatch) {
            const energyEv = parseFloat(evMatch[1]);
            energiesByFile[currentFile] = energiesByFile[currentFile] || [];
            let energyEntry = energiesByFile[currentFile].find((e) => Math.abs(e.eV - energyEv) < 1e-3);
            if (!energyEntry) {
              energyEntry = {
                eV: energyEv,
                hartree: energyEv / 27.211
                // Convert eV to hartree
              };
              energiesByFile[currentFile].push(energyEntry);
            } else {
              energyEntry.eV = energyEv;
            }
          }
        }
      }
      return {
        energiesByFile,
        totalFiles: Object.keys(energiesByFile).length,
        totalEnergies: Object.values(energiesByFile).reduce((sum, energies) => sum + energies.length, 0)
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  async getMolecularData() {
    try {
      const content = await fs3.readFile(this.knowledgeGraphPath, "utf-8");
      const moleculesByFile = {};
      let currentFile = "unknown";
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("# File:")) {
          const match = line.match(/# File: (.+?) \(/);
          if (match) {
            currentFile = match[1];
            if (!moleculesByFile[currentFile]) {
              moleculesByFile[currentFile] = {};
            }
          }
        }
        if (line.includes("ontocompchem:hasNAtoms")) {
          const match = line.match(/ontocompchem:hasNAtoms\s+(\d+)/);
          if (match) {
            moleculesByFile[currentFile].nAtoms = parseInt(match[1]);
          }
        }
        if (line.includes("ontocompchem:hasMolecularFormula")) {
          const match = line.match(/ontocompchem:hasMolecularFormula\s+"([^"]+)"/);
          if (match) {
            moleculesByFile[currentFile].formula = match[1];
          }
        }
        if (line.includes("ontocompchem:hasCharge")) {
          const match = line.match(/ontocompchem:hasCharge\s+([+-]?\d+)/);
          if (match) {
            moleculesByFile[currentFile].charge = parseInt(match[1]);
          }
        }
        if (line.includes("ontocompchem:hasMultiplicity")) {
          const match = line.match(/ontocompchem:hasMultiplicity\s+(\d+)/);
          if (match) {
            moleculesByFile[currentFile].multiplicity = parseInt(match[1]);
          }
        }
      }
      return {
        moleculesByFile,
        totalFiles: Object.keys(moleculesByFile).length
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  isFileProcessed(filename) {
    return this.processedFiles.has(filename);
  }
};

// src/actions/analyzeMolecularData.ts
import { logger as logger4 } from "@elizaos/core";
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
      logger4.info("\u{1F9EA} Analyzing molecular data...");
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
      logger4.error("Error in molecular data analysis:", error);
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

// src/actions/parseGaussianFile.ts
import { logger as logger5 } from "@elizaos/core";
import * as path4 from "path";
import * as fs4 from "fs";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path4.dirname(__filename3);
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
      logger5.info("\u{1F9EC} Parsing Gaussian file...");
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
      logger5.info(`\u{1F50D} Attempting to extract file path from message: "${message.content.text}"`);
      const extractedPath = extractFilePathFromMessage(message);
      logger5.info(`\u{1F4DD} Extracted path result: ${extractedPath}`);
      let filePath = extractedPath;
      if (!filePath) {
        logger5.info("\u{1F50D} No file path extracted from message, looking for example files...");
        filePath = findExampleLogFile();
        logger5.info(`\u{1F4C1} Example file search result: ${filePath}`);
      }
      if (!filePath) {
        const currentDir = process.cwd();
        logger5.error(`\u274C No file found. CWD: ${currentDir}, __dirname: ${__dirname3}`);
        const testDir = path4.join(currentDir, "data", "examples");
        try {
          const files = __require("fs").readdirSync(testDir);
          logger5.info(`\u{1F4C2} Files in ${testDir}: ${files.join(", ")}`);
        } catch (error) {
          logger5.error(`\u274C Cannot read directory ${testDir}: ${error.message}`);
        }
        const errorContent = {
          text: `\u274C No Gaussian log file specified. Please provide a file path or add log files to the data/examples/ directory.

\u{1F50D} **Current working directory:** ${currentDir}

\u{1F4C1} **Looking for files in:**
\u2022 ${path4.join(currentDir, "data", "examples")}
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
      responseText += `**File:** ${path4.basename(filePath)}
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
      responseText += `

\u{1F9E0} **Auto Knowledge Graph:** Files in \`data/examples/\` are automatically processed into a persistent knowledge base`;
      responseText += `
\u{1F4A1} *Try: "Show knowledge stats" to see the auto-built knowledge base*`;
      const responseContent = {
        text: responseText,
        actions: ["PARSE_GAUSSIAN_FILE"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger5.error("Error in Gaussian file parsing:", error);
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
  logger5.info(`\u{1F50D} extractFilePathFromMessage: text = "${text}"`);
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
    logger5.info(`\u{1F50D} Pattern ${i + 1}: ${pattern} -> match: ${match ? match[0] : "none"}`);
    if (match) {
      let filePath = match[1] || match[0];
      filePath = filePath.replace(/^(file:|path:)/i, "").trim();
      logger5.info(`\u{1F4DD} Cleaned filename: "${filePath}"`);
      if (!filePath.includes("/") && !filePath.includes("\\")) {
        const possibleDataDirs = [
          path4.join(process.cwd(), "data", "examples"),
          path4.join(__dirname3, "..", "..", "data", "examples"),
          path4.join(__dirname3, "..", "..", "..", "data", "examples"),
          path4.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "data", "examples"),
          "./data/examples"
        ];
        for (const dataDir of possibleDataDirs) {
          const fullPath = path4.join(dataDir, filePath);
          try {
            fs4.accessSync(fullPath, fs4.constants.F_OK);
            logger5.info(`\u2705 Found file: ${fullPath}`);
            return fullPath;
          } catch {
            logger5.debug(`\u274C Not found: ${fullPath}`);
          }
        }
        const defaultPath = path4.join(process.cwd(), "data", "examples", filePath);
        logger5.info(`\u{1F504} Returning default path: ${defaultPath}`);
        return defaultPath;
      }
      return filePath;
    }
  }
  logger5.info("\u274C No file path patterns matched");
  return null;
}
function findExampleLogFile() {
  const possibleDataDirs = [
    // Current working directory
    path4.join(process.cwd(), "data", "examples"),
    // Plugin directory (if running from plugin root)
    path4.join(__dirname3, "..", "..", "data", "examples"),
    // Relative to dist directory (if running from built plugin)
    path4.join(__dirname3, "..", "..", "..", "data", "examples"),
    // ElizaOS plugin directory structure
    path4.join(process.cwd(), "plugins", "my-compchem-plugin-v2", "data", "examples"),
    // Direct relative path
    "./data/examples"
  ];
  const exampleFiles = ["lactone.log", "TolueneEnergy.log"];
  for (const dataDir of possibleDataDirs) {
    for (const filename of exampleFiles) {
      const filePath = path4.join(dataDir, filename);
      try {
        fs4.accessSync(filePath, fs4.constants.F_OK);
        logger5.info(`\u2705 Found example file: ${filePath}`);
        return filePath;
      } catch (error) {
        logger5.debug(`\u274C File not found: ${filePath}`);
      }
    }
  }
  logger5.warn("\u274C No example log files found in any location");
  return null;
}

// src/actions/diagnostics.ts
import { logger as logger6 } from "@elizaos/core";
import * as path5 from "path";
import * as fs5 from "fs";
import { fileURLToPath as fileURLToPath4 } from "url";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename4);
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
      logger6.info("\u{1F50D} Running computational chemistry diagnostics...");
      let responseText = "\u{1F50D} **Computational Chemistry Plugin Diagnostics**\n\n";
      const currentDir = process.cwd();
      responseText += `\u{1F4C1} **Current Working Directory:**
\`${currentDir}\`

`;
      responseText += "\u{1F4CA} **Data Files Check:**\n";
      const possibleDataDirs = [
        path5.join(currentDir, "data", "examples"),
        path5.join(__dirname4, "..", "..", "data", "examples"),
        path5.join(__dirname4, "..", "..", "..", "data", "examples"),
        path5.join(currentDir, "plugins", "my-compchem-plugin-v2", "data", "examples"),
        "./data/examples"
      ];
      const dataFiles = ["lactone.log", "TolueneEnergy.log"];
      let foundDataFiles = false;
      for (const dataDir2 of possibleDataDirs) {
        for (const filename of dataFiles) {
          const filePath = path5.join(dataDir2, filename);
          try {
            fs5.accessSync(filePath);
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
        path5.join(currentDir, "py"),
        path5.join(__dirname4, "..", "..", "py"),
        path5.join(__dirname4, "..", "..", "..", "py"),
        path5.join(currentDir, "plugins", "my-compchem-plugin-v2", "py"),
        "./py"
      ];
      let foundScripts = false;
      for (const scriptDir of possibleScriptDirs) {
        for (const scriptName of scriptNames) {
          const scriptPath = path5.join(scriptDir, scriptName);
          try {
            fs5.accessSync(scriptPath);
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
      responseText += `  \u2022 __dirname: \`${__dirname4}\`
`;
      responseText += `  \u2022 Plugin Name: my-compchem-plugin-v2
`;
      responseText += `  \u2022 Services: PythonService, CompchemService
`;
      responseText += `  \u2022 Actions: PARSE_GAUSSIAN_FILE, ANALYZE_MOLECULAR_DATA, GENERATE_MOLECULAR_VISUALIZATION
`;
      responseText += "\n\u{1F4A1} **Recommendations:**\n";
      if (!foundDataFiles) {
        responseText += `  \u2022 Copy log files to: \`${path5.join(currentDir, "data", "examples")}\`
`;
      }
      if (!foundScripts) {
        responseText += `  \u2022 Copy Python scripts to: \`${path5.join(currentDir, "py")}\`
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
      logger6.error("Error in diagnostics:", error);
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

// src/actions/autoKnowledgeAction.ts
import {
  logger as logger7
} from "@elizaos/core";
var autoKnowledgeAction = {
  name: "AUTO_KNOWLEDGE_STATS",
  similes: [
    "KNOWLEDGE_STATS",
    "AUTO_STATS",
    "SHOW_KNOWLEDGE",
    "KNOWLEDGE_BASE",
    "HOW_MANY_MOLECULES",
    "GET_ENERGIES",
    "SHOW_ENERGIES",
    "SCF_ENERGIES",
    "ENERGY_VALUES"
  ],
  description: "Show statistics and detailed data from the automatic knowledge graph including actual energy values",
  validate: async (_runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const keywords = [
      "knowledge",
      "stats",
      "statistics",
      "how many",
      "molecules",
      "auto",
      "automatic",
      "processed",
      "files",
      "knowledge base",
      "energies",
      "energy",
      "scf",
      "get energies",
      "show energies"
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger7.info("Handling AUTO_KNOWLEDGE_STATS action");
      const autoService = runtime.getService("auto-knowledge");
      if (!autoService) {
        const errorContent = {
          text: "\u274C Auto knowledge service is not running. The service automatically monitors data/examples/ for Gaussian files.",
          actions: ["AUTO_KNOWLEDGE_STATS"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const userQuery = message.content.text?.toLowerCase() || "";
      const isEnergyQuery = userQuery.includes("energy") || userQuery.includes("energies") || userQuery.includes("scf");
      let responseText;
      if (isEnergyQuery) {
        const energyData = await autoService.getEnergies();
        if (energyData.error) {
          const errorContent = {
            text: `\u274C Error getting energy data: ${energyData.error}`,
            actions: ["AUTO_KNOWLEDGE_STATS"],
            source: message.content.source
          };
          if (callback) await callback(errorContent);
          return errorContent;
        }
        responseText = `\u26A1 **SCF Energies from Knowledge Graph**

`;
        if (energyData.totalEnergies === 0) {
          responseText += `\u274C No energy data found in the knowledge graph.

`;
          responseText += `\u{1F4A1} **To get energy data:** Copy Gaussian .log files to \`data/examples/\` and they'll be automatically processed!`;
        } else {
          responseText += `**\u{1F4CA} Total Files:** ${energyData.totalFiles} | **Total Energies:** ${energyData.totalEnergies}

`;
          for (const [filename, energies] of Object.entries(energyData.energiesByFile)) {
            responseText += `**\u{1F4C4} ${filename}:**
`;
            if (Array.isArray(energies) && energies.length > 0) {
              energies.forEach((energy, index) => {
                responseText += `  ${index + 1}. **${energy.hartree.toFixed(8)} hartree** (${energy.eV.toFixed(6)} eV)
`;
              });
            } else {
              responseText += `  \u26A0\uFE0F  No energies found
`;
            }
            responseText += "\n";
          }
          responseText += `\u{1F4A1} **Units:** Hartree is the atomic unit of energy. 1 hartree = 27.211 eV`;
        }
      } else {
        const stats = await autoService.getStats();
        if (stats.error) {
          const errorContent = {
            text: `\u274C Error getting knowledge stats: ${stats.error}`,
            actions: ["AUTO_KNOWLEDGE_STATS"],
            source: message.content.source
          };
          if (callback) await callback(errorContent);
          return errorContent;
        }
        responseText = `\u{1F9E0} **Automatic Knowledge Graph Status**

**\u{1F4C1} Monitoring:** \`${stats.watchedDirectory}\`
**\u{1F4CA} Knowledge Graph:** \`${stats.knowledgeGraphPath}\`

**\u{1F4C8} Current Statistics:**
\u2022 **Files Processed:** ${stats.totalFiles}
\u2022 **Molecules:** ${stats.molecules}
\u2022 **SCF Energies:** ${stats.scfEnergies}  
\u2022 **Atoms:** ${stats.atoms}
\u2022 **Last Update:** ${new Date(stats.lastUpdate).toLocaleString()}

${stats.totalFiles > 0 ? `**\u{1F4C4} Processed Files:**
${stats.filesList.map((file) => `\u2022 ${file}`).join("\n")}` : "**\u{1F4C4} No files processed yet**"}

\u{1F4A1} **How it works:** Just copy \`.log\` or \`.out\` files to \`data/examples/\` and they'll be automatically processed into the knowledge graph!

${stats.totalFiles === 0 ? "\n\u{1F680} **Get started:** Copy some Gaussian log files to `data/examples/` to see the knowledge graph grow automatically!" : '\n\u{1F50D} **Energy tip:** Ask me to "get energies" or "show SCF energies" to see actual energy values!'}`;
      }
      const responseContent = {
        text: responseText,
        actions: ["AUTO_KNOWLEDGE_STATS"],
        source: message.content.source
      };
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger7.error("Error in AUTO_KNOWLEDGE_STATS action:", error);
      const errorContent = {
        text: `\u274C Failed to get knowledge stats: ${error instanceof Error ? error.message : "Unknown error"}`,
        actions: ["AUTO_KNOWLEDGE_STATS"],
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
          text: "Show me knowledge graph statistics"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F9E0} **Automatic Knowledge Graph Status**\n\n**\u{1F4C1} Monitoring:** `data/examples/`\n**\u{1F4CA} Knowledge Graph:** `data/auto-knowledge-graph.ttl`\n\n**\u{1F4C8} Current Statistics:**\n\u2022 **Files Processed:** 2\n\u2022 **Molecules:** 2\n\u2022 **SCF Energies:** 2\n\u2022 **Atoms:** 30\n\u2022 **Last Update:** 1/15/2024, 10:30:00 AM\n\n**\u{1F4C4} Processed Files:**\n\u2022 lactone.log\n\u2022 TolueneEnergy.log\n\n\u{1F4A1} **How it works:** Just copy `.log` or `.out` files to `data/examples/` and they'll be automatically processed into the knowledge graph!",
          actions: ["AUTO_KNOWLEDGE_STATS"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Get energies"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u26A1 **SCF Energies from Knowledge Graph**\n\n**\u{1F4CA} Total Files:** 2 | **Total Energies:** 2\n\n**\u{1F4C4} TolueneEnergy.log:**\n  1. **-271.63604200 hartree** (-7384.636042 eV)\n\n**\u{1F4C4} lactone.log:**\n  1. **-227.85626900 hartree** (-6202.856269 eV)\n\n\u{1F4A1} **Units:** Hartree is the atomic unit of energy. 1 hartree = 27.211 eV",
          actions: ["AUTO_KNOWLEDGE_STATS"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "How many molecules do we have?"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: '\u{1F9E0} **Automatic Knowledge Graph Status**\n\n**\u{1F4C8} Current Statistics:**\n\u2022 **Files Processed:** 3\n\u2022 **Molecules:** 3\n\u2022 **SCF Energies:** 3\n\u2022 **Atoms:** 45\n\n**\u{1F4C4} Processed Files:**\n\u2022 lactone.log\n\u2022 TolueneEnergy.log\n\u2022 example.log\n\n\u{1F50D} **Energy tip:** Ask me to "get energies" or "show SCF energies" to see actual energy values!',
          actions: ["AUTO_KNOWLEDGE_STATS"]
        }
      }
    ]
  ]
};

// src/actions/generateVisualizationAction.ts
import {
  logger as logger8
} from "@elizaos/core";
import { promises as fs6 } from "fs";
import * as path6 from "path";
var generateVisualizationAction = {
  name: "GENERATE_VISUALIZATION",
  similes: [
    "GENERATE_CHARTS",
    "CREATE_PLOTS",
    "VISUALIZE_DATA",
    "PLOT_ANALYSIS",
    "SHOW_CHARTS",
    "CREATE_VISUALIZATIONS",
    "MAKE_PLOTS"
  ],
  description: "Generate professional-quality visualizations and charts from the knowledge graph using Python matplotlib",
  validate: async (_runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const keywords = [
      "visualization",
      "chart",
      "plot",
      "graph",
      "visualize",
      "charts",
      "generate visualization",
      "create chart",
      "show plot",
      "make graph",
      "energy chart",
      "frequency plot",
      "molecular visualization"
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger8.info("Generating visualization from knowledge graph data");
      const autoService = runtime.getService("auto-knowledge");
      const pythonService = runtime.getService("python-execution");
      if (!autoService) {
        const errorContent = {
          text: "\u274C Auto knowledge service not available. Please ensure the service is running.",
          actions: ["GENERATE_VISUALIZATION"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      if (!pythonService) {
        const errorContent = {
          text: "\u274C Python service not available. Charts require Python with matplotlib.",
          actions: ["GENERATE_VISUALIZATION"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const stats = await autoService.getStats();
      const energyData = await autoService.getEnergies();
      const molecularData = await autoService.getMolecularData();
      if (stats.error) {
        const errorContent = {
          text: `\u274C Error getting knowledge graph data: ${stats.error}`,
          actions: ["GENERATE_VISUALIZATION"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      if (stats.totalFiles === 0) {
        const errorContent = {
          text: "\u{1F4CA} No data available for visualization. Please add some Gaussian files to `data/examples/` first.",
          actions: ["GENERATE_VISUALIZATION"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const userQuery = message.content.text?.toLowerCase() || "";
      const chartType = detectChartType(userQuery);
      const plotData = prepareDataForPlotting(energyData, molecularData, stats);
      const timestamp = Date.now();
      const chartsDir = path6.join(process.cwd(), "data", "charts", `visualization-${timestamp}`);
      await fs6.mkdir(chartsDir, { recursive: true });
      let generatedCharts = [];
      let responseText = "";
      try {
        const chartResult = await pythonService.generateVisualization(chartType, plotData, chartsDir);
        if (chartResult.success && chartResult.chartPath) {
          generatedCharts.push(chartResult.chartPath);
          const mainChartPath = chartResult.chartPath;
          responseText = `\u{1F4CA} **${getChartTypeDisplayName(chartType)} Generated**

\u{1F4C8} **Data:** ${chartResult.dataPoints || "N/A"} points from ${stats.totalFiles} files
\u{1F310} **URL:** http://localhost:3000/charts/visualization-${timestamp}/${path6.basename(chartResult.chartPath)}

\u2705 Chart ready for viewing!`;
        } else {
          responseText = `\u274C **Chart Generation Failed**

**Error:** ${chartResult.error || "Unknown error"}

\u{1F527} Check Python/matplotlib installation`;
        }
      } catch (error) {
        logger8.error("Error generating visualization:", error);
        responseText = `\u274C **Chart Error:** ${error.message}`;
      }
      const responseContent = {
        text: responseText,
        actions: ["GENERATE_VISUALIZATION"],
        source: message.content.source
      };
      if (generatedCharts.length > 0) {
        const chartList = generatedCharts.map((chartPath) => {
          const filename = path6.basename(chartPath);
          const relativePath = path6.relative(process.cwd(), chartPath);
          return `  \u2022 ${filename}: \`${relativePath}\``;
        }).join("\n");
        responseText = responseText.replace(/🌐 \*\*URL:\*\* http:\/\/[^\n]+\n/, "");
        responseText += `

\u{1F4C1} **Generated Charts:**
${chartList}`;
        logger8.info(`Generated ${generatedCharts.length} chart files without attachments to avoid payload issues`);
      }
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger8.error("Error in GENERATE_VISUALIZATION action:", error);
      const errorContent = {
        text: `\u274C Error: ${error.message}`,
        actions: ["GENERATE_VISUALIZATION"],
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
          text: "Generate a visualization of the data"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} **Overview Statistics Generated**\n\n\u{1F4C8} **Data:** 45 points from 2 files\n\n\u2705 Chart ready for viewing!\n\n\u{1F4C1} **Generated Charts:**\n  \u2022 overview_chart.png: `data/charts/visualization-1234567890/overview_chart.png`",
          actions: ["GENERATE_VISUALIZATION"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Create energy plots"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} **SCF Energy Trends Generated**\n\n\u{1F4C8} **Data:** 12 points from 2 files\n\n\u2705 Chart ready for viewing!\n\n\u{1F4C1} **Generated Charts:**\n  \u2022 energy_chart.png: `data/charts/visualization-1234567890/energy_chart.png`",
          actions: ["GENERATE_VISUALIZATION"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Show me charts of the molecular data"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} **Molecular Properties Generated**\n\n\u{1F4C8} **Data:** Properties from 2 files\n\n\u2705 Chart ready for viewing!\n\n\u{1F4C1} **Generated Charts:**\n  \u2022 molecular_chart.png: `data/charts/visualization-1234567890/molecular_chart.png`",
          actions: ["GENERATE_VISUALIZATION"]
        }
      }
    ]
  ]
};
function detectChartType(userQuery) {
  if (userQuery.includes("energy") || userQuery.includes("scf")) {
    return "energy";
  } else if (userQuery.includes("molecular") || userQuery.includes("molecule")) {
    return "molecular";
  } else if (userQuery.includes("frequency") || userQuery.includes("vibrational")) {
    return "frequency";
  } else if (userQuery.includes("overview") || userQuery.includes("summary") || userQuery.includes("statistics")) {
    return "overview";
  } else {
    return "overview";
  }
}
function getChartTypeDisplayName(chartType) {
  const names = {
    "overview": "Overview Statistics",
    "energy": "SCF Energy Trends",
    "molecular": "Molecular Properties",
    "frequency": "Vibrational Analysis"
  };
  return names[chartType] || "Custom Visualization";
}
function prepareDataForPlotting(energyData, molecularData, stats) {
  return {
    stats: {
      molecules: stats.molecules || 0,
      scfEnergies: stats.scfEnergies || 0,
      frequencies: stats.frequencies || 0,
      atoms: stats.atoms || 0,
      totalFiles: stats.totalFiles || 0,
      enhanced: false
      // V2 uses basic parsing
    },
    energyData: energyData.energiesByFile || {},
    molecularData: molecularData.moleculesByFile || {},
    fileData: combineFileData(energyData.energiesByFile || {}, molecularData.moleculesByFile || {})
  };
}
function combineFileData(energies, molecules) {
  const combined = {};
  for (const [filename, energyList] of Object.entries(energies)) {
    combined[filename] = {
      energyData: Array.isArray(energyList) ? energyList.map((e) => e.hartree) : [],
      molecularData: molecules[filename] || {},
      homoLumoData: [],
      // Not available in V2 basic parsing
      frequencyData: []
      // Not available in V2 basic parsing
    };
  }
  return combined;
}

// src/actions/generateReportAction.ts
import {
  logger as logger9
} from "@elizaos/core";
import { promises as fs7 } from "fs";
import * as path7 from "path";
var generateReportAction = {
  name: "GENERATE_COMPREHENSIVE_REPORT",
  similes: [
    "GENERATE_REPORT",
    "CREATE_REPORT",
    "COMPREHENSIVE_ANALYSIS",
    "FULL_REPORT",
    "ANALYSIS_REPORT",
    "COMPLETE_ANALYSIS",
    "DETAILED_REPORT",
    "SUMMARY_REPORT"
  ],
  description: "Generate a comprehensive analysis report with multiple visualizations, statistics, and detailed analysis from the knowledge graph data",
  validate: async (_runtime, message, _state) => {
    const text = message.content.text?.toLowerCase() || "";
    const keywords = [
      "comprehensive report",
      "full report",
      "complete report",
      "analysis report",
      "detailed report",
      "summary report",
      "generate report",
      "create report",
      "comprehensive analysis",
      "complete analysis",
      "full analysis",
      "report",
      "summary",
      "overview",
      "comprehensive"
    ];
    return keywords.some((keyword) => text.includes(keyword));
  },
  handler: async (runtime, message, _state, _options, callback, _responses) => {
    try {
      logger9.info("Generating comprehensive analysis report");
      const autoService = runtime.getService("auto-knowledge");
      const pythonService = runtime.getService("python-execution");
      if (!autoService) {
        const errorContent = {
          text: "\u274C Auto knowledge service not available. Please ensure the service is running.",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      if (!pythonService) {
        const errorContent = {
          text: "\u274C Python service not available. Comprehensive reports require Python with matplotlib.",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const stats = await autoService.getStats();
      const energyData = await autoService.getEnergies();
      const molecularData = await autoService.getMolecularData();
      if (stats.error) {
        const errorContent = {
          text: `\u274C Error getting knowledge graph data: ${stats.error}`,
          actions: ["GENERATE_COMPREHENSIVE_REPORT"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      if (stats.totalFiles === 0) {
        const errorContent = {
          text: "\u{1F4CA} No data available for report generation. Please add some Gaussian files to `data/examples/` first.",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"],
          source: message.content.source
        };
        if (callback) await callback(errorContent);
        return errorContent;
      }
      const reportData = prepareReportData(energyData, molecularData, stats);
      const timestamp = Date.now();
      const reportsDir = path7.join(process.cwd(), "data", "reports", `comprehensive-${timestamp}`);
      await fs7.mkdir(reportsDir, { recursive: true });
      let responseText = "";
      let reportFiles = [];
      try {
        const reportResult = await pythonService.generateComprehensiveReport(reportData, reportsDir);
        if (reportResult.success) {
          reportFiles = [
            reportResult.dashboard_path,
            ...reportResult.analysis_paths
          ].filter(Boolean);
          const serverUrl = process.env.SERVER_URL || "http://localhost:3000";
          const dashboardFilename = path7.basename(reportResult.dashboard_path);
          responseText = `\u{1F4CA} Comprehensive Analysis Report Generated

Dashboard: http://localhost:3000/reports/comprehensive-${timestamp}/${dashboardFilename}
Analysis Files: ${reportResult.total_files} detailed reports
Data Sources: ${stats.totalFiles} Gaussian files
Generated: ${reportResult.timestamp}

## \u{1F4CB} Report Contents
\u2705 **Main Dashboard** - Overview with key statistics
\u2705 **Energy Analysis** - Detailed SCF energy trends
\u2705 **Molecular Analysis** - Molecular properties and formulas
\u2705 **File Comparison** - Cross-file analysis and completeness

## \u{1F50D} Key Findings
${generateKeyFindings(stats, energyData, molecularData)}

Local Path: \`${path7.relative(process.cwd(), reportsDir)}\``;
        } else {
          responseText = `Report Generation Failed

**Error:** ${reportResult.error || "Unknown error"}

\u{1F527} Check Python/matplotlib installation and data availability`;
        }
      } catch (error) {
        logger9.error("Error generating comprehensive report:", error);
        responseText = `\u274C **Report Error:** ${error.message}`;
      }
      const responseContent = {
        text: responseText,
        actions: ["GENERATE_COMPREHENSIVE_REPORT"],
        source: message.content.source
      };
      if (reportFiles.length > 0) {
        const fileList = reportFiles.map((reportPath) => {
          const filename = path7.basename(reportPath);
          const relativePath = path7.relative(process.cwd(), reportPath);
          return `  \u2022 ${getReportTitle(filename)}: \`${relativePath}\``;
        }).join("\n");
        responseText += `

\u{1F4C1} **Generated Reports:**
${fileList}`;
        logger9.info(`Generated ${reportFiles.length} report files without attachments to avoid payload issues`);
      }
      if (callback) await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger9.error("Error in GENERATE_COMPREHENSIVE_REPORT action:", error);
      const errorContent = {
        text: `\u274C **Comprehensive Report Error:** ${error.message}`,
        actions: ["GENERATE_COMPREHENSIVE_REPORT"],
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
          text: "Generate a comprehensive report"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} **Comprehensive Analysis Report Generated**\n\n\u{1F3AF} **Dashboard:** Generated with comprehensive analysis\n\u{1F4C8} **Analysis Files:** 4 detailed reports\n\u{1F9EA} **Data Sources:** 2 Gaussian files\n\n## \u{1F4CB} Report Contents\n\u2705 **Main Dashboard** - Overview with key statistics\n\u2705 **Energy Analysis** - Detailed SCF energy trends\n\u2705 **Molecular Analysis** - Molecular properties\n\u2705 **File Comparison** - Cross-file analysis\n\n## \u{1F50D} Key Findings\n\u2022 2 molecules analyzed with 15 SCF energies\n\u2022 Energy range: -154.123 to -98.456 Hartree\n\u2022 Molecular formulas: C7H6O2, C7H8\n\u2022 Atom counts: 15-15 atoms per molecule\n\n\u{1F4C1} **Generated Reports:**\n  \u2022 Main Dashboard: `data/reports/comprehensive-1234567890/comprehensive_dashboard.png`\n  \u2022 Energy Analysis: `data/reports/comprehensive-1234567890/detailed_energy_analysis.png`\n  \u2022 Molecular Analysis: `data/reports/comprehensive-1234567890/detailed_molecular_analysis.png`\n  \u2022 File Comparison: `data/reports/comprehensive-1234567890/file_comparison_analysis.png`",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "Create a full analysis report of all the data"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} Comprehensive Analysis Report Generated\n\nDashboard: Complete overview with visualizations\nAnalysis Files: 3 detailed reports\nData Sources: 1 Gaussian file\n\nReport Contents:\n\u2022 Main Dashboard - Statistical overview\n\u2022 Energy Analysis - SCF convergence analysis\n\u2022 Molecular Analysis - Structural properties\n\nKey Findings:\n\u2022 Single molecule: C7H6O2 (lactone)\n\u2022 8 SCF energy calculations\n\u2022 15 atoms total\n\u2022 Energy convergence achieved\n\nPerfect for research documentation and analysis review.",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"]
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "I need a detailed summary report with charts"
        }
      },
      {
        name: "{{user2}}",
        content: {
          text: "\u{1F4CA} Comprehensive Analysis Report Generated\n\nDashboard: Multi-panel overview with charts\nAnalysis Files: 4 detailed visualizations\nData Sources: 2 Gaussian files analyzed\n\nReport Contents:\n\u2022 Main Dashboard - 6-panel overview\n\u2022 Energy Analysis - Distribution and trends\n\u2022 Molecular Analysis - Properties and statistics\n\u2022 File Comparison - Comparative analysis\n\nKey Findings:\n\u2022 Multiple molecular systems compared\n\u2022 Energy statistics and distributions\n\u2022 Molecular diversity analysis\n\u2022 Data completeness assessment\n\nProfessional quality charts suitable for publications.",
          actions: ["GENERATE_COMPREHENSIVE_REPORT"]
        }
      }
    ]
  ]
};
function prepareReportData(energyData, molecularData, stats) {
  return {
    stats: {
      molecules: stats.molecules || 0,
      scfEnergies: stats.scfEnergies || 0,
      frequencies: stats.frequencies || 0,
      atoms: stats.atoms || 0,
      totalFiles: stats.totalFiles || 0,
      enhanced: false
      // V2 uses basic parsing
    },
    energyData: energyData.energiesByFile || {},
    molecularData: molecularData.moleculesByFile || {},
    fileData: combineFileDataForReport(energyData.energiesByFile || {}, molecularData.moleculesByFile || {})
  };
}
function combineFileDataForReport(energies, molecules) {
  const combined = {};
  const allFiles = /* @__PURE__ */ new Set([...Object.keys(energies), ...Object.keys(molecules)]);
  for (const filename of allFiles) {
    const energyList = energies[filename] || [];
    const molecularProps = molecules[filename] || {};
    combined[filename] = {
      energyData: Array.isArray(energyList) ? energyList.map(
        (e) => typeof e === "object" && e.hartree ? e.hartree : e
      ) : [],
      molecularData: molecularProps,
      homoLumoData: [],
      // Not available in V2 basic parsing
      frequencyData: []
      // Not available in V2 basic parsing
    };
  }
  return combined;
}
function generateKeyFindings(stats, energyData, molecularData) {
  const findings = [];
  findings.push(`\u2022 ${stats.molecules || 0} molecules analyzed with ${stats.scfEnergies || 0} SCF energies`);
  if (energyData.energiesByFile) {
    const allEnergies = [];
    Object.values(energyData.energiesByFile).forEach((energies) => {
      if (Array.isArray(energies)) {
        energies.forEach((e) => {
          const energy = typeof e === "object" && e.hartree ? e.hartree : e;
          if (typeof energy === "number") allEnergies.push(energy);
        });
      }
    });
    if (allEnergies.length > 0) {
      const minE = Math.min(...allEnergies);
      const maxE = Math.max(...allEnergies);
      findings.push(`\u2022 Energy range: ${minE.toFixed(3)} to ${maxE.toFixed(3)} Hartree`);
    }
  }
  if (molecularData.moleculesByFile) {
    const formulas = /* @__PURE__ */ new Set();
    const atomCounts = [];
    Object.values(molecularData.moleculesByFile).forEach((mol) => {
      if (mol && typeof mol === "object") {
        if (mol.formula) formulas.add(mol.formula);
        if (mol.nAtoms) atomCounts.push(mol.nAtoms);
      }
    });
    if (formulas.size > 0) {
      const formulaList = Array.from(formulas).slice(0, 3).join(", ");
      findings.push(`\u2022 Molecular formulas: ${formulaList}${formulas.size > 3 ? "..." : ""}`);
    }
    if (atomCounts.length > 0) {
      const minAtoms = Math.min(...atomCounts);
      const maxAtoms = Math.max(...atomCounts);
      findings.push(`\u2022 Atom counts: ${minAtoms}-${maxAtoms} atoms per molecule`);
    }
  }
  return findings.join("\n");
}
function getReportTitle(filename) {
  if (filename.includes("dashboard")) {
    return "Main Dashboard";
  } else if (filename.includes("energy")) {
    return "Energy Analysis";
  } else if (filename.includes("molecular")) {
    return "Molecular Analysis";
  } else if (filename.includes("comparison")) {
    return "File Comparison";
  } else {
    return "Analysis Report";
  }
}

// src/plugin.ts
var configSchema = z.object({
  PYTHON_PATH: z.string().optional().default("python3").transform((val) => {
    if (!val) {
      logger10.info("Using default Python path: python3");
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
      logger10.info("Handling HELLO_WORLD action");
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
      logger10.error("Error in HELLO_WORLD action:", error);
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
var CompchemService = class _CompchemService extends Service3 {
  static serviceType = "compchem-manager";
  capabilityDescription = "Computational chemistry management service that coordinates molecular analysis and Python integration.";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    logger10.info(`\u{1F9EA} Starting computational chemistry service: ${(/* @__PURE__ */ new Date()).toISOString()}`);
    const service = new _CompchemService(runtime);
    const pythonService = runtime.getService("python-execution");
    if (pythonService) {
      logger10.info("\u2705 Python integration available");
      try {
        const pythonEnv = await pythonService.checkPythonEnvironment();
        if (pythonEnv.pythonAvailable) {
          logger10.info(`\u{1F40D} Python ${pythonEnv.pythonVersion} detected`);
          logger10.info(`\u{1F4E6} Available packages: ${pythonEnv.packagesAvailable.join(", ")}`);
          if (pythonEnv.packagesMissing.length > 0) {
            logger10.warn(`\u26A0\uFE0F  Missing packages: ${pythonEnv.packagesMissing.join(", ")}`);
          }
        } else {
          logger10.warn("\u26A0\uFE0F  Python environment not available");
        }
      } catch (error) {
        logger10.warn("\u26A0\uFE0F  Could not check Python environment:", error);
      }
    } else {
      logger10.warn("\u26A0\uFE0F  Python service not available");
    }
    return service;
  }
  static async stop(runtime) {
    logger10.info("\u{1F9EA} Stopping computational chemistry service");
    const service = runtime.getService(_CompchemService.serviceType);
    if (!service) {
      throw new Error("Computational chemistry service not found");
    }
    service.stop();
  }
  async stop() {
    logger10.info("\u{1F9EA} Computational chemistry service stopped");
  }
};
var myCompchemPlugin = {
  name: "my-compchem-plugin-v2",
  description: "Advanced computational chemistry plugin for ElizaOS with Python integration and persistent knowledge graph storage",
  config: {
    PYTHON_PATH: process.env.PYTHON_PATH,
    PYTHON_DEBUG: process.env.PYTHON_DEBUG,
    COMPCHEM_DATA_DIR: process.env.COMPCHEM_DATA_DIR
  },
  async init(config) {
    logger10.info("\u{1F9EA} Initializing computational chemistry plugin v2");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
      logger10.info("\u2705 Plugin configuration validated successfully");
      logger10.info(`\u{1F40D} Python path: ${validatedConfig.PYTHON_PATH}`);
      logger10.info(`\u{1F4C1} Data directory: ${validatedConfig.COMPCHEM_DATA_DIR}`);
      try {
        await DeploymentService.deployPythonFiles();
      } catch (deployError) {
        logger10.warn("\u26A0\uFE0F  Failed to auto-deploy Python files:", deployError);
        logger10.warn("You may need to manually copy Python files to the agent directory");
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
        logger10.debug("MESSAGE_RECEIVED event received");
        logger10.debug(Object.keys(params));
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger10.debug("VOICE_MESSAGE_RECEIVED event received");
        logger10.debug(Object.keys(params));
      }
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger10.debug("WORLD_CONNECTED event received");
        logger10.debug(Object.keys(params));
      }
    ],
    WORLD_JOINED: [
      async (params) => {
        logger10.debug("WORLD_JOINED event received");
        logger10.debug(Object.keys(params));
      }
    ]
  },
  services: [PythonService, CompchemService, AutoKnowledgeService],
  actions: [helloWorldAction, analyzeMolecularDataAction, parseGaussianFileAction, diagnosticsAction, autoKnowledgeAction, generateVisualizationAction, generateReportAction],
  providers: [helloWorldProvider],
  tests: [StarterPluginTestSuite]
  // dependencies: ['@elizaos/plugin-knowledge'], <--- plugin dependecies go here (if requires another plugin)
};

// src/index.ts
var index_default = myCompchemPlugin;
export {
  AutoKnowledgeService,
  CompchemService,
  PythonService,
  analyzeMolecularDataAction,
  autoKnowledgeAction,
  index_default as default,
  diagnosticsAction,
  generateReportAction,
  generateVisualizationAction,
  myCompchemPlugin,
  parseGaussianFileAction
};
//# sourceMappingURL=index.js.map