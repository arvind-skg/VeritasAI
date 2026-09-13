/**
 * withAttestation — fail-safe evidence recording middleware.
 *
 * Wraps any agent decision function. The agent's result is ALWAYS returned,
 * even if evidence recording fails. Recording is a side-effect, never a gate
 * on the agent's actual response.
 *
 * This is a non-negotiable product claim from the pitch deck:
 * "The application can keep running even if evidence fails."
 */
import { recordEvent } from "../services/coolClient.js";
import { saveReceipt } from "../services/db.js";

export async function withAttestation<T>(
  agentId: string,
  eventType: string,
  fn: () => Promise<T>,
  toMetadata: (result: T) => Record<string, unknown> = () => ({})
): Promise<T> {
  // The agent's actual decision — ALWAYS returned, no matter what
  const result = await fn();

  try {
    const { evidence } = await recordEvent(
      eventType,
      toMetadata(result),
      { output: result }
    );
    await saveReceipt(agentId, eventType, evidence, "recorded");
  } catch (err) {
    // Evidence recording is a side-effect, never a gate.
    // Log + mark degraded, but never throw back into the agent's response path.
    await saveReceipt(
      agentId,
      eventType,
      null,
      "recording_failed",
      String(err)
    );
    console.error(
      `[VeritasAI] evidence recording failed for ${eventType}:`,
      err
    );
  }

  return result;
}
