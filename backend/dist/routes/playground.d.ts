declare const router: import("express-serve-static-core").Router;
export type AttackVector = "MODIFY_DECISION" | "TAMPER_TIMESTAMP" | "SWAP_MODEL" | "MODIFY_POLICY" | "DELETE_EVENT" | "SWAP_HUMAN_APPROVAL";
export default router;
