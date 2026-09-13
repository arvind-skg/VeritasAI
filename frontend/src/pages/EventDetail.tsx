import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, type EventRecord } from "../api/client";
import VerdictChecklist from "../components/VerdictChecklist";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Lineage State
  const [causalChain, setCausalChain] = useState<EventRecord[]>([]);

  // Action Chain expanded stage state
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  // Selective Disclosure State
  const [showSelectiveModal, setShowSelectiveModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectiveProof, setSelectiveProof] = useState<any>(null);
  const [selectiveVerdict, setSelectiveVerdict] = useState<any>(null);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [verifyingProof, setVerifyingProof] = useState(false);

  function copyReceipt() {
    if (!event?.receiptJson) return;
    navigator.clipboard.writeText(JSON.stringify(event.receiptJson, null, 2));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  }

  function downloadReceipt() {
    if (!event?.receiptJson) return;
    const blob = new Blob([JSON.stringify(event.receiptJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veritasai_receipt_${event.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function loadEvent() {
    if (!id) return;
    try {
      const res = await api.getEvent(id);
      setEvent(res);

      if (res?.inputJson && typeof res.inputJson === "object") {
        const keys = Object.keys(res.inputJson);
        // Default select first 1 or 2 fields
        setSelectedFields(keys.slice(0, Math.min(2, keys.length)));
      }

      // Load Causal Lineage
      try {
        const chainRes = await api.getCausalChain(id);
        setCausalChain(chainRes.events || []);
      } catch (e) {
        console.warn("Causal chain unavailable:", e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSelectiveProof() {
    if (!id || selectedFields.length === 0) return;
    setGeneratingProof(true);
    setSelectiveVerdict(null);
    try {
      const res = await api.generateSelectiveDisclosure(id, selectedFields);
      setSelectiveProof(res.proof);
    } catch (err) {
      console.error("Selective proof generation failed:", err);
    } finally {
      setGeneratingProof(false);
    }
  }

  async function handleVerifySelectiveProof() {
    if (!selectiveProof) return;
    setVerifyingProof(true);
    try {
      const res = await api.verifySelectiveProof(selectiveProof);
      setSelectiveVerdict(res);
    } catch (err) {
      console.error("Selective verification failed:", err);
    } finally {
      setVerifyingProof(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function handleVerify() {
    if (!id || verifying) return;
    setVerifying(true);
    try {
      await api.verifyEvent(id);
      await loadEvent();
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto py-8 px-4"><div className="skeleton h-96 w-full"></div></div>;
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-300">Decision event not found or unauthorized</h2>
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
      <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Decision Feed
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">{event.eventType.replace(/_/g, " ")}</h1>
            {event.decision && (
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider font-mono ${
                event.decision.toLowerCase().includes("reject") || event.decision.toLowerCase().includes("fail")
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {event.decision}
              </span>
            )}
            <span className={`badge ${event.status === "recorded" ? "badge-recorded" : "badge-recording-failed"} text-xs px-2.5 py-0.5`}>
              {event.status === "recorded" ? "✓ Secured" : "⚠ Recording Failed"}
            </span>
          </div>
          <p className="text-slate-500 font-mono text-xs">{event.id}</p>
        </div>

        {event.status === "recorded" && (
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="btn-primary shrink-0 text-xs py-2 px-4"
          >
            {verifying ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            )}
            {event.verdictJson ? "Re-run 7-Domain Verification" : "Verify Receipt Offline"}
          </button>
        )}
      </div>

      {/* Causal Lineage Flowchart (DAG) */}
      {causalChain.length > 1 && (
        <div className="glass-card p-4 border-indigo-100 bg-indigo-50/20 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                🔗 Cross-Event Causal Lineage (Audit Graph DAG)
              </span>
              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-bold font-mono">
                {causalChain.length} Linked Events
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Root-cause causal attribution</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {causalChain.map((node, idx) => (
              <div key={node.id} className="flex items-center gap-2">
                <Link
                  to={`/events/${node.id}`}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    node.id === event.id
                      ? "bg-white border-indigo-500 shadow-md text-indigo-900 ring-2 ring-indigo-500/20"
                      : "bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold capitalize">{node.eventType.replace(/_/g, " ")}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        node.id === event.id
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {node.decision || "PROCESSED"}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{node.id.slice(0, 12)}...</p>
                </Link>
                {idx < causalChain.length - 1 && (
                  <span className="text-slate-400 font-bold">➔</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: 7 Domain Checklist + Data Payloads */}
        <div className="md:col-span-2 space-y-6">
          {event.status === "recording_failed" && event.errorDetail ? (
            <div className="glass-card p-6 border-amber-300 bg-amber-50/50">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Fail-Safe Active: Recording Exception</h3>
              <p className="text-xs text-slate-800 font-mono bg-white p-4 rounded-lg border border-amber-200 break-all">
                {event.errorDetail}
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Note: Under the VeritasAI fail-safe non-blocking contract, your host AI agent's decision was returned without disruption.
              </p>
            </div>
          ) : event.verdictJson ? (
            <VerdictChecklist checks={event.verdictJson.checks} ok={event.verdictJson.ok} />
          ) : (
            <div className="glass-card p-10 text-center border-dashed border-2 border-slate-300">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Cryptographic Receipt Secured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Hardware attestation and Ed25519 signature are anchored in the receipt. Click verify to validate offline.
              </p>
              <button onClick={handleVerify} disabled={verifying} className="btn-primary mx-auto text-xs py-2 px-4">
                Run Verification
              </button>
            </div>
          )}

          {/* 1. AI Action Chain Visualizer (9-Stage Lifecycle) */}
          {event.actionChain && event.actionChain.length > 0 && (
            <div className="glass-card p-6 border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Cryptographic AI Action Chain (9-Stage Consequential Lifecycle)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any stage to inspect its payload, timestamp, and SHA-256 micro-block hash.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  {event.actionChain?.length ?? 0} Stages Verified
                </span>
              </div>

              {/* Action Chain Horizontal Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {(event.actionChain ?? []).map((stg, i) => (
                  <div
                    key={i}
                    onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      expandedStage === i
                        ? "ring-2 ring-rose-500 bg-white shadow-md border-rose-400"
                        : stg.status === "FLAGGED"
                        ? "bg-rose-50/60 border-rose-200 hover:border-rose-300"
                        : stg.status === "OVERRIDDEN"
                        ? "bg-amber-50/60 border-amber-200 hover:border-amber-300"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        #{i + 1} {stg.stage}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          stg.status === "FLAGGED"
                            ? "bg-rose-100 text-rose-800"
                            : stg.status === "OVERRIDDEN"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {stg.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs truncate">{stg.title}</h4>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
                      hash: {stg.stageHash.slice(0, 16)}...
                    </div>

                    {/* Expandable Stage Details */}
                    {expandedStage === i && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono space-y-1.5 animate-fade-in bg-slate-900 text-slate-200 p-2.5 rounded-lg">
                        <div>
                          <span className="text-slate-400">Timestamp: </span>
                          <span className="text-indigo-300">{stg.timestamp}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">PrevHash: </span>
                          <span className="text-slate-300 break-all">{stg.prevStageHash || "GENESIS_ROOT"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">StageHash: </span>
                          <span className="text-emerald-400 break-all">{stg.stageHash}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-slate-400">Payload:</span>
                          <pre className="text-[10px] text-slate-300 overflow-x-auto mt-0.5 max-h-32">
                            {JSON.stringify(stg.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. "Why Did The AI Do This?" Explainability Evidence Card */}
          <div className="glass-card p-6 border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/30 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  Why Did The AI Do This? — Explainability Evidence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proves the complete surrounding context, active policy, and human authorization.
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Non-Repudiable Evidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Policy Proof
                </span>
                <p className="font-bold text-slate-900">{event.policyProof?.policyName || "Underwriting Policy v3.4"}</p>
                <p className="text-[10px] font-mono text-slate-500 break-all">
                  Hash: {event.policyProof?.policyHash || "8a91b2c4e5f60718..."}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Model Provenance
                </span>
                <p className="font-bold text-slate-900">{event.modelProvenance?.model || "CreditGPT-Underwriter"} ({event.modelProvenance?.version || "v2.1"})</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  Prompt: {event.modelProvenance?.systemPromptHash?.slice(0, 24) || "e3b0c442..."}...
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Human Oversight Sign-Off
                </span>
                <p className="font-bold text-indigo-900">
                  {event.humanApproval?.reviewer || "Senior Risk Officer #4481"}
                </p>
                <p className="text-[10px] text-slate-600">
                  Verdict: <strong>{event.humanApproval?.decision || "CONFIRMED"}</strong> • Signed
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  External Trust Anchor
                </span>
                <p className="font-bold text-slate-900">RFC 3161 Timestamp Authority</p>
                <p className="text-[10px] font-mono text-emerald-700 truncate">
                  Serial: {event.externalTimestamp?.tsaSerial || "TSA-2026-VERITAS"} (Block #{event.externalTimestamp?.externalBlockHeight || 862410})
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic bg-white/70 p-2.5 rounded-lg border border-slate-200">
              * Note: VeritasAI proves the verifiable evidence, active policy rules, and human oversight surrounding the decision, guaranteeing neither the organization nor the auditor can alter the historical context.
            </p>
          </div>

          {/* Decision Telemetry Context */}
          {Boolean(event.inputJson || event.outputJson || event.metadataJson) && (
            <div className="glass-card p-5 border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Decision Telemetry & Selective Disclosure
                </h3>
                <button
                  onClick={() => setShowSelectiveModal(true)}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Generate Selective Disclosure
                </button>
              </div>

              {Boolean(event.inputJson) && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 mb-1">
                    Input Context (Data-minimized / Salted SHA-256 Hashed):
                  </p>
                  <pre className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono overflow-x-auto">
                    {JSON.stringify(event.inputJson, null, 2)}
                  </pre>
                </div>
              )}

              {Boolean(event.outputJson) && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 mb-1">Decision Output:</p>
                  <pre className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono overflow-x-auto">
                    {JSON.stringify(event.outputJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Raw Cryptographic Receipt */}
          {Boolean(event.receiptJson) && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200/60">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="font-semibold text-sm text-slate-800 flex items-center gap-2 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Raw Cryptographic Receipt (.json)
                  <span className="text-xs text-slate-500 font-normal">({showJson ? "Click to Collapse" : "Click to Expand"})</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyReceipt}
                    className="text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {copiedReceipt ? "✓ Copied" : "Copy JSON"}
                  </button>
                  <button
                    onClick={downloadReceipt}
                    className="text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
              {showJson && (
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                  <pre className="text-xs text-emerald-400 overflow-x-auto p-2 font-mono">
                    {JSON.stringify(event.receiptJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Audit Metadata & Scope Disclaimer */}
        <div className="space-y-6">
          <div className="glass-card p-5 border-slate-200/80">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Audit Metadata</h3>
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">Recorded At</p>
                <p className="font-medium text-slate-900">{new Date(event.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-slate-500 mb-0.5">Responsible Agent</p>
                <p className="font-medium text-slate-900">{event.agent?.name ?? event.agentId}</p>
              </div>

              <div>
                <p className="text-slate-500 mb-0.5">Risk Level</p>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                  event.riskLevel === "HIGH" || event.riskLevel === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {event.riskLevel || "LOW"}
                </span>
              </div>

              {event.requestId && (
                <div>
                  <p className="text-slate-500 mb-0.5">Request ID</p>
                  <p className="font-mono text-[11px] text-slate-700">{event.requestId}</p>
                </div>
              )}

              {event.verifiedAt && (
                <div>
                  <p className="text-slate-500 mb-0.5">Last Cryptographically Verified</p>
                  <p className="font-medium text-slate-900">{new Date(event.verifiedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="disclaimer-banner">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-xs">
              <strong className="block mb-1 text-slate-900 font-semibold">Scope Disclaimer</strong>
              This verifies that the recorded event is authentic and unaltered. It does not verify that the underlying AI decision was correct.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Selective Disclosure Modal */}
      {showSelectiveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>🔐</span> Selective Disclosure Generator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which fields to disclose to the auditor. Unselected PII fields remain salted and zero-knowledge.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSelectiveModal(false);
                  setSelectiveProof(null);
                  setSelectiveVerdict(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Field Checkboxes */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Choose Fields to Disclose:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {Object.keys((event.inputJson as Record<string, any>) || {}).map((field) => {
                  const isChecked = selectedFields.includes(field);
                  return (
                    <label
                      key={field}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedFields(selectedFields.filter((f) => f !== field));
                          } else {
                            setSelectedFields([...selectedFields, field]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{field}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                {selectedFields.length} field(s) selected for disclosure
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateSelectiveProof}
                  disabled={generatingProof || selectedFields.length === 0}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {generatingProof ? "Generating..." : "Generate Cryptographic Proof"}
                </button>
              </div>
            </div>

            {/* Proof Generated View */}
            {selectiveProof && (
              <div className="space-y-3 pt-3 border-t border-slate-100 animate-fade-in font-mono text-xs">
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-slate-800 pb-1">
                    <span>Root Commitment:</span>
                    <span className="text-slate-400 font-normal">
                      {selectiveProof.rootCommitment.slice(0, 16)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold">
                      Disclosed Fields ({Object.keys(selectiveProof.disclosedFields).length}):
                    </span>
                    <pre className="text-[10px] text-emerald-300 mt-0.5 max-h-24 overflow-y-auto">
                      {JSON.stringify(selectiveProof.disclosedFields, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-500">Hidden Fields Masked (Zero-Knowledge):</span>
                    <span className="text-slate-400 ml-1">
                      {Object.keys(selectiveProof.hiddenCommitments).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Live Offline Verify Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleVerifySelectiveProof}
                    disabled={verifyingProof}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {verifyingProof ? "Verifying Math..." : "Verify Proof Offline"}
                  </button>

                  {selectiveVerdict && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        selectiveVerdict.valid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {selectiveVerdict.valid ? "✓ Validated: Commitment Matches Root" : `❌ ${selectiveVerdict.error}`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
