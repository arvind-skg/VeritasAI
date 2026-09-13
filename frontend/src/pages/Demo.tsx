import { useState } from "react";
import { Link } from "react-router-dom";
import { api, type EventRecord } from "../api/client";
import EventTable from "../components/EventTable";

export default function Demo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; events: EventRecord[] } | null>(null);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.seedDemo();
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate demo data");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id: string) {
    if (verifyingId) return;
    setVerifyingId(id);
    try {
      const verifyRes = await api.verifyEvent(id);
      if (result) {
        setResult({
          ...result,
          events: result.events.map((e) =>
            e.id === id ? { ...e, verdictJson: verifyRes.verdict, verifiedAt: verifyRes.verifiedAt } : e
          ),
        });
      }
    } catch (err) {
      console.error("Verification failed in Demo:", err);
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Demo Simulation</h1>
          <p className="text-slate-500 text-sm">
            Simulate an AI agent processing customer requests and recording cryptographic evidence.
          </p>
        </div>
        <Link to="/" className="btn-secondary text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0">
          <span>📊</span> View Live Feed
        </Link>
      </div>

      <div className="glass-card p-8 mb-8 text-center border-slate-200/80">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Simulate Agent Activity</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
          This will generate a batch of mock events simulating an AI loan-approval agent (including the flagship "Application #8421" scenario) and one deliberate recording failure to showcase fail-safe behavior.
        </p>
        
        <button 
          onClick={handleSeed}
          disabled={loading}
          className="btn-primary text-sm px-6 py-2.5 mx-auto flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Generating Evidence...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Run Simulation Batch
            </>
          )}
        </button>

        {error && <p className="text-rose-600 text-xs font-medium mt-4">{error}</p>}
      </div>

      {result && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg text-xs font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {result.message}
            </div>
            <Link to="/" className="font-semibold underline hover:text-emerald-900">
              Go to Dashboard →
            </Link>
          </div>
          <EventTable events={result.events} onVerify={handleVerify} verifyingId={verifyingId} />
        </div>
      )}
    </div>
  );
}
