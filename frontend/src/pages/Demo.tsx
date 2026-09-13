import { useState } from "react";
import { api, type EventRecord } from "../api/client";
import EventTable from "../components/EventTable";

export default function Demo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; events: EventRecord[] } | null>(null);
  const [error, setError] = useState("");

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Demo Data Generator</h1>
        <p className="text-slate-400">
          Simulate an AI agent processing customer requests and recording cryptographic evidence.
        </p>
      </div>

      <div className="glass-card p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500"></div>
        <div className="text-5xl mb-6">🤖</div>
        <h2 className="text-xl font-bold text-white mb-2">Simulate Agent Activity</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          This will generate a batch of mock events simulating an AI loan-approval agent (including the flagship "Application #8421" scenario) and one deliberate recording failure.
        </p>
        
        <button 
          onClick={handleSeed}
          disabled={loading}
          className="btn-primary pulse-glow text-lg px-8 py-3"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              Generating Evidence...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Run Simulation Batch
            </>
          )}
        </button>

        {error && <p className="text-rose-400 mt-4">{error}</p>}
      </div>

      {result && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-medium mb-4 ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {result.message}
          </div>
          <EventTable events={result.events} />
        </div>
      )}
    </div>
  );
}
