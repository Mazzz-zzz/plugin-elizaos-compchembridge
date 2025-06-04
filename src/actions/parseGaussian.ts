import {
  ActionExample,
  Content,
  IAgentRuntime,
  Memory,
  State,
  type Action,
} from "../types/eliza-core.js";
import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { promises as fs } from "fs";

const execFileAsync = promisify(execFile);

interface ParseGaussianContent extends Content {
  url: string;
  metadata?: {
    filename?: string;
    timestamp?: string;
    software_version?: string;
  };
}

async function parseGaussianFile(
  runtime: IAgentRuntime,
  url: string,
  metadata: any = {},
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    let tempPath: string;

    // Handle local files vs remote URLs
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("s3://")
    ) {
      // 1. Download the file using runtime services for remote files
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      // Create temporary file
      tempPath = path.join(process.cwd(), `temp_${Date.now()}.log`);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(tempPath, Buffer.from(buffer));
    } else {
      // Handle local file paths (for demo/testing)
      if (url.startsWith("file://")) {
        tempPath = url.replace("file://", "");
      } else {
        tempPath = path.resolve(url);
      }

      // Verify file exists
      try {
        await fs.access(tempPath);
      } catch {
        throw new Error(`File not found: ${tempPath}`);
      }
    }

    // 2. Call the Python parser
    const pythonScript = path.join(process.cwd(), "py", "parse_gaussian.py");
    const { stdout: rdfOutput } = await execFileAsync("python", [
      pythonScript,
      tempPath,
      JSON.stringify(metadata),
    ]);

    // 3. Store RDF in knowledge graph using runtime
    const knowledgeService = runtime.getService("knowledge");
    if (knowledgeService) {
      await knowledgeService.addKnowledge({
        content: rdfOutput,
        format: "turtle",
        metadata: {
          source: url,
          timestamp: new Date().toISOString(),
          parser: "gaussian-kg-plugin",
          ...metadata,
        },
      });
    }

    // 4. Clean up temporary file only if we created it
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("s3://")
    ) {
      await fs.unlink(tempPath);
    }

    return {
      success: true,
      message: "Successfully parsed and imported Gaussian file",
      data: {
        triples_count: (rdfOutput.match(/\./g) || []).length,
        source: url,
        metadata,
      },
    };
  } catch (error) {
    console.error("Error parsing Gaussian file:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export const parseGaussianAction: Action = {
  name: "PARSE_GAUSSIAN_FILE",
  similes: [
    "PARSE_GAUSSIAN",
    "IMPORT_GAUSSIAN",
    "PROCESS_GAUSSIAN_LOG",
    "ANALYZE_GAUSSIAN_OUTPUT",
  ],
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const content = message.content as ParseGaussianContent;

    // Check if message contains a URL to a Gaussian file
    const hasUrl = !!content.url;
    const textContent = content.text?.toLowerCase() || "";
    const isGaussianFile =
      content.url?.includes(".log") ||
      false ||
      content.url?.includes(".out") ||
      false ||
      textContent.includes("gaussian");

    return hasUrl && isGaussianFile;
  },
  description:
    "Parse a Gaussian 16 quantum chemistry logfile and import into knowledge graph",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: { [key: string]: unknown } = {},
    callback?: () => void,
  ): Promise<boolean> => {
    try {
      const content = message.content as ParseGaussianContent;

      const result = await parseGaussianFile(
        runtime,
        content.url,
        content.metadata,
      );

      if (result.success) {
        // Add success message to conversation
        await runtime.messageManager.createMemory({
          userId: message.userId,
          content: {
            text: `✅ ${result.message}\n\nProcessed: ${content.url}\nTriples generated: ${result.data?.triples_count || "unknown"}`,
            metadata: result.data,
          },
          roomId: message.roomId,
        });
      } else {
        // Add error message to conversation
        await runtime.messageManager.createMemory({
          userId: message.userId,
          content: {
            text: `❌ Failed to parse Gaussian file: ${result.message}`,
            error: result.message,
          },
          roomId: message.roomId,
        });
      }

      if (callback) {
        callback();
      }

      return result.success;
    } catch (error) {
      console.error("Error in parseGaussianAction:", error);
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Parse this Gaussian file: https://example.com/benzene_b3lyp.log",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll parse that Gaussian logfile for you and import the quantum chemistry data into my knowledge graph.",
          action: "PARSE_GAUSSIAN_FILE",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "✅ Successfully parsed and imported Gaussian file\n\nProcessed: https://example.com/benzene_b3lyp.log\nTriples generated: 156",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Import quantum calculation results from s3://bucket/pfas_degradation.log",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll import the quantum chemistry calculation results from that file.",
          action: "PARSE_GAUSSIAN_FILE",
        },
      },
    ],
  ] as ActionExample[][],
};
