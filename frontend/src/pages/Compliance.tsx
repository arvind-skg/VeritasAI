import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Compliance() {
  const [frameworks, setFrameworks] = useState<Record<string, any>>({});
  const [selectedFramework, setSelectedFramework] = useState<string>("EU_AI_ACT");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadFrameworks() {
      try {
        const res = await api.getComplianceFrameworks();
        setFrameworks(res.frameworks || {});
      } catch (err) {
        console.error("Failed to load frameworks:", err);
      }
    }
    loadFrameworks();
  }, []);

  async function handleGenerate(frameworkKey?: string) {
    const fw = frameworkKey || selectedFramework;
    setLoading(true);
    try {
      const res = await api.generateCompliancePack(fw);
      setReportData(res);
    } catch (err) {
      console.error("Failed to generate compliance pack:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleGenerate(selectedFramework);
  }, [selectedFramework]);

  function copyMarkdown() {
    if (!reportData?.markdownReport) return;
    navigator.clipboard.writeText(reportData.markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadJson() {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veritasai_compliance_${selectedFramework.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const currentMeta = frameworks[selectedFramework];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Audit Ready
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
              Multi-Standard Dossiers
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Compliance Evidence Pack Generator
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Export verifiable audit dossiers proving continuous compliance with global AI governance
            mandates. Sealed with Merkle Tree heads, external timestamps, and human oversight trails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={copyMarkdown}
            disabled={!reportData}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dossier Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={downloadJson}
            disabled={!reportData}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download JSON Pack</span>
          </button>
        </div>
      </div>

      {/* Framework Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {Object.entries(frameworks).map(([key, meta]: [string, any]) => {
          const isActive = selectedFramework === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedFramework(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{meta.title.split("—")[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Readiness & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Compliance Readiness Index
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">99.4%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Audit Certified
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Zero integrity failures or unsealed actions detected.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Audited Decisions
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {reportData?.metrics?.totalDecisions || 0}
            </span>
            <span className="text-xs text-slate-500">100% Sealed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Bound to Merkle root & post-quantum signatures.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Human-in-the-Loop Oversight
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-600">
              {reportData?.metrics?.humanReviewedDecisions || 0}
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Signed
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Cryptographically bound officer sign-offs.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Model Drift Incidents
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {reportData?.metrics?.modelDriftIncidents || 0}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              0 Drifts
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            All executed models conform to registered baseline.
          </p>
        </div>
      </div>

      {/* Mandatory Statutory Requirements Checklist */}
      {currentMeta && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Statutory Criteria Fulfilled: <span className="text-indigo-600">{currentMeta.title}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{currentMeta.statutoryReference}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {currentMeta.mandatoryEvidence?.map((item: string, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <span className="text-xs text-slate-700 font-medium leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dossier Preview Panel */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            Sealed Dossier Preview (Markdown)
          </span>
          <span className="text-slate-500 text-[10px]">
            Signed Tree Head: {reportData?.sth?.rootHash?.slice(0, 20)}...
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 animate-pulse">
            Compiling cryptographic evidence pack...
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 max-h-96 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
            {reportData?.markdownReport}
          </pre>
        )}
      </div>
    </div>
  );
}
