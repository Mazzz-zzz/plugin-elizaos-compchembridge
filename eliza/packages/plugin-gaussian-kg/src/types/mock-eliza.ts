// Mock types for Eliza OS development
// These will be replaced with actual @elizaos/core imports when integrated

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
        callback?: () => void
    ) => Promise<boolean>;
    examples: ActionExample[][];
}

export interface Service {
    serviceType: ServiceType;
    initialize: (runtime: IAgentRuntime) => Promise<void>;
}

export enum ServiceType {
    OTHER = "other",
    DATABASE = "database",
    AI = "ai",
    COMMUNICATION = "communication",
}

export interface IAgentRuntime {
    messageManager: {
        createMemory: (memory: Partial<Memory>) => Promise<void>;
    };
    getService: (name: string) => any;
    registerService: (name: string, service: any) => void;
}

export interface Plugin {
    name: string;
    description: string;
    actions: Action[];
    services: Service[];
    evaluators: any[];
    providers: any[];
    clients: any[];
}

// Re-export everything under a single namespace for easy importing
export * from "./mock-eliza.js"; 