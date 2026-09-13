/**
 * Verification Provider Registry
 */
import { CooLProvider } from "./CooLProvider.js";
import { LocalMockProvider } from "./LocalMockProvider.js";
import type { VerificationProvider } from "./types.js";
export declare const defaultProvider: VerificationProvider;
export * from "./types.js";
export { CooLProvider, LocalMockProvider };
