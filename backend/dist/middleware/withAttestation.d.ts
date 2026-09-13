export declare function withAttestation<T>(agentId: string, eventType: string, fn: () => Promise<T>, toMetadata?: (result: T) => Record<string, unknown>): Promise<T>;
