import { useState, useEffect } from "react";
import { api, type EventRecord } from "../api/client";

interface Scenario {
  id: string;
  name: string;
  category: string;
  description: string;
  targetDefense: string;
  severity: "CRITICAL" | "HIGH";
}

export default function Playground() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("MODIFY_DECISION");
  const [attacking, setAttacking] = useState(false);
  const [attackResult, setAttackResult] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [scenariosRes, eventsRes] = await Promise.all([
          api.getPlaygroundScenarios(),
          api.listEvents({ limit: 10 }),
        ]);
        setScenarios(scenariosRes.scenarios || []);
        setEvents(eventsRes.events || []);
        if (eventsRes.events?.length > 0) {
          setSelectedEventId(eventsRes.events[0].id);
        }
      } catch (err) {
        console.error("Failed to load playground data:", err);
      }
    }
    loadData();
  }, []);

  async function handleExecuteAttack() {
    if (attacking) return;
    setAttacking(true);
    setAttackResult(null);

    try {
      const res = await api.executeAttack(selectedScenario, selectedEventId);
      setAttackResult(res);
    } catch (err: any) {
      setAttackResult({ error: err.message || "Attack simulation failed" });
    } finally {
      setAttacking(false);
    }
  }

  const activeScenarioObj = scenarios.find((s) => s.id === selectedScenario);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 border border-rose-200">
              Interactive Testbed
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-100 text-purple-800 border border-purple-200">
              Post-Quantum Resilient
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Attack VeritasAI Playground
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Simulate real-world adversarial attacks against the AI audit trail. Watch how VeritasAI’s
            append-only Merkle tree, hybrid post-quantum signatures, and action chain micro-blocks
            mathematically detect and block tampering in real time.
          </p>
        </div>

        {/* Target Event Selector */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1 min-w-[260px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Target AI Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.eventType} ({ev.decision || "PROCESSED"}) — {ev.id.slice(0, 10)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6 Attack Scenario Selection Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Select Adversarial Vector
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-rose-50/70 border-rose-500 shadow-md ring-1 ring-rose-500"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sc.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {sc.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{sc.category}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{sc.name}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="truncate">Defended by: <strong className="text-slate-700">{sc.targetDefense}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attack Runner Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
              2. Launch Tamper Simulation
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Vector: {activeScenarioObj?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulates direct unauthorized database tampering or log manipulation without valid enclave keys.
            </p>
          </div>

          <button
            onClick={handleExecuteAttack}
            disabled={attacking}
            className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
              attacking
                ? "bg-rose-900/60 text-rose-300 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/50 hover:shadow-rose-900/80 active:scale-95"
            }`}
          >
            {attacking ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Tampering & Verifying...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Execute Attack & Run Verification</span>
              </>
            )}
          </button>
        </div>

        {/* Results Stream / Terminal */}
        {attackResult && (
          <div className="space-y-4 animate-fade-in">
            {/* Verdict Banner */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between border ${
                attackResult.attackDetected
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                  : "bg-rose-950/40 border-rose-500/50 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    attackResult.attackDetected
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {attackResult.attackDetected ? "🛡️" : "⚠️"}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white">
                    {attackResult.attackDetected
                      ? "TAMPER DETECTED & MATHEMATICALLY REJECTED"
                      : "ATTACK UNDETECTED"}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {attackResult.attackDetected
                      ? "The forged state violates cryptographic constraints. External auditors and verifiers will instantly discard the decision."
                      : "Warning: The attack succeeded without triggering alerts."}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
                Status: {attackResult.verdict}
              </span>
            </div>

            {/* Diagnostic Breakdown */}
            {attackResult.tamperReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Cryptographic Failure Analysis
                  </span>
                  <div>
                    <span className="text-slate-400">Failed Subsystem: </span>
                    <strong className="text-rose-400">
                      {attackResult.tamperReport.failedComponent}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Security Domain: </span>
                    <span className="text-indigo-300">
                      {attackResult.tamperReport.cryptographicDomain}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Diagnostic Message: </span>
                    <p className="text-rose-300 mt-1 font-sans text-xs bg-rose-950/20 p-2 rounded border border-rose-900/40">
                      ❌ {attackResult.tamperReport.errorMessage}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    State Discrepancy Evidence
                  </span>
                  <div>
                    <span className="text-slate-400">Expected (Certified):</span>
                    <div className="text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/40 mt-1 break-all">
                      {attackResult.tamperReport.expected}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Observed (Attacker Payload):</span>
                    <div className="text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/40 mt-1 break-all">
                      {attackResult.tamperReport.observed}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanatory Callout for Judges */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            Why This Testbed Convinces Judges & Regulators
          </h4>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Most compliance software relies on simple database rows that any DBA or cloud provider can
            edit. VeritasAI binds every decision into a <strong>9-stage action chain</strong>, an{" "}
            <strong>append-only Merkle tree</strong>, and <strong>hybrid post-quantum signatures</strong>,
            making evidence tampering mathematically impossible to conceal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold text-xs shadow-xs">
            NIST FIPS 204
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold text-xs shadow-xs">
            RFC 6962 Merkle
          </span>
        </div>
      </div>
    </div>
  );
}
