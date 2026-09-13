/**
 * Verification Provider Registry
 */
import { CooLProvider } from "./CooLProvider.js";
import { LocalMockProvider } from "./LocalMockProvider.js";
const USE_LOCAL_MOCK = process.env.VERITASAI_PROVIDER === "mock";
export const defaultProvider = USE_LOCAL_MOCK
    ? new LocalMockProvider()
    : new CooLProvider();
export * from "./types.js";
export { CooLProvider, LocalMockProvider };
