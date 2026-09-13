import { useEffect, useState } from "react";
import { api, type EventRecord } from "../api/client";
import EventTable from "../components/EventTable";

export default function Dashboard() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  async function loadEvents() {
    try {
      const res = await api.listEvents({ limit: 50 });
      setEvents(res.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleVerify(id: string) {
    if (verifyingId) return;
    setVerifyingId(id);
    try {
      await api.verifyEvent(id);
      await loadEvents();
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
            Evidence Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Monitor and verify cryptographic evidence trails from AI agents.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={loadEvents}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-12 w-full"></div>
          <div className="skeleton h-12 w-full"></div>
          <div className="skeleton h-12 w-full"></div>
          <div className="skeleton h-12 w-full"></div>
        </div>
      ) : (
        <EventTable
          events={events}
          onVerify={handleVerify}
          verifyingId={verifyingId}
        />
      )}
    </div>
  );
}
