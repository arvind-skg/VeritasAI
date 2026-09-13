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

  async function loadEvent() {
    if (!id) return;
    try {
      const res = await api.getEvent(id);
      setEvent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      await loadEvent(); // Reload to get updated verdict
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto py-8 px-4"><div className="skeleton h-96 w-full"></div></div>;
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-300">Event not found</h2>
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <Link to="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white capitalize">{event.eventType.replace(/_/g, " ")}</h1>
            <span className={`badge ${event.status === "recorded" ? "badge-recorded" : "badge-recording-failed"} text-sm px-3 py-1`}>
              {event.status === "recorded" ? "✓ Recorded" : "⚠ Recording Failed"}
            </span>
          </div>
          <p className="text-slate-400 font-mono text-sm">{event.id}</p>
        </div>

        {event.status === "recorded" && (
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="btn-primary shrink-0"
          >
            {verifying ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            )}
            {event.verdictJson ? "Re-run Verification" : "Run Verification"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {event.status === "recording_failed" && event.errorDetail ? (
            <div className="glass-card p-6 border-amber-500/30">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">Recording Error</h3>
              <p className="text-sm text-slate-300 font-mono bg-black/30 p-4 rounded-lg break-all">
                {event.errorDetail}
              </p>
            </div>
          ) : event.verdictJson ? (
            <VerdictChecklist checks={event.verdictJson.checks} ok={event.verdictJson.ok} />
          ) : (
            <div className="glass-card p-12 text-center border-dashed border-2">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold text-white mb-2">Evidence Recorded</h3>
              <p className="text-slate-400 max-w-sm mx-auto mb-6">
                Cryptographic evidence has been secured. Run verification to cryptographically prove this event.
              </p>
              <button onClick={handleVerify} disabled={verifying} className="btn-primary mx-auto">
                Run Verification
              </button>
            </div>
          )}

          {event.receiptJson && (
            <div className="glass-card overflow-hidden">
              <button
                onClick={() => setShowJson(!showJson)}
                className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <span className="font-semibold text-slate-300 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Raw Receipt Data
                </span>
                <svg className={`w-5 h-5 text-slate-500 transition-transform ${showJson ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showJson && (
                <div className="p-4 bg-black/40 border-t border-white/5">
                  <pre className="text-xs text-slate-400 overflow-x-auto p-2">
                    {JSON.stringify(event.receiptJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Event Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Time</p>
                <p className="text-sm font-medium text-slate-200">{new Date(event.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Agent</p>
                <p className="text-sm font-medium text-slate-200">{event.agent?.name ?? event.agentId}</p>
              </div>
              {event.verifiedAt && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Verified</p>
                  <p className="text-sm font-medium text-slate-200">{new Date(event.verifiedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="disclaimer-banner">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <strong className="block mb-1">Scope Disclaimer</strong>
              This verifies that the recorded event is authentic and unaltered. It does not verify that the underlying AI decision was correct.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
