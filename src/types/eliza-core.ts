// Bridge types for @elizaos/core compatibility
// This allows the plugin to work both in development (with mocks) and production (with real @elizaos/core)

export interface Content {
  text?: string;
  url?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface Memory {
  id?: string;
  userId: string;
  roomId: string;
  content: Content;
  createdAt?: number;
  [key: string]: any;
}

export interface State {
  [key: string]: any;
}

export interface ActionExample {
  user: string;
  content: Content;
}

export interface Action {
  name: string;
  similes: string[];
  validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  description: string;
  handler: (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options?: { [key: string]: unknown },
    callback?: () => void,
  ) => Promise<boolean>;
  examples: ActionExample[][];
}

export abstract class Service {
  static serviceType: string;
  abstract capabilityDescription: string;

  static async start(runtime: IAgentRuntime): Promise<Service> {
    throw new Error("start method must be implemented");
  }

  abstract stop(): Promise<void>;
}

export interface IAgentRuntime {
  messageManager: {
    createMemory: (memory: Partial<Memory>) => Promise<void>;
  };
  getService: (name: string) => any;
  registerService: (name: string, service: any) => void;
  getSetting: (key: string) => string | undefined;
}

export interface Plugin {
  name: string;
  description: string;
  actions?: Action[];
  services?: (typeof Service)[];
  evaluators?: any[];
  providers?: any[];
  init?: (
    config: Record<string, string>,
    runtime: IAgentRuntime,
  ) => Promise<void>;
}

// Note: In production, replace this file with:
// export type { Plugin, Action, Service, IAgentRuntime, Memory, State, Content } from "@elizaos/core";
