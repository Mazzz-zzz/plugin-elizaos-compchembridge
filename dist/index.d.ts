import { Plugin, Service, IAgentRuntime } from '@elizaos/core';

declare class StarterService extends Service {
    protected runtime: IAgentRuntime;
    static serviceType: string;
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<StarterService>;
    static stop(runtime: IAgentRuntime): Promise<void>;
    stop(): Promise<void>;
}
declare const myCompchemPlugin: Plugin;

export { StarterService, myCompchemPlugin as default, myCompchemPlugin };
