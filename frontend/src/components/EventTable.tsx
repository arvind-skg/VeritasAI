/**
 * EventTable — displays a list of evidence events with status badges and actions.
 */
import { useNavigate } from "react-router-dom";
import type { EventRecord } from "../api/client";

interface Props {
  events: EventRecord[];
  onVerify?: (id: string) => void;
  verifyingId?: string | null;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function eventTypeIcon(type: string): string {
  switch (type) {
    case "loan_application": return "🏦";
    case "refund_decision": return "💳";
    case "triage_suggestion": return "🏥";
    default: return "📋";
  }
}

export default function EventTable({ events, onVerify, verifyingId }: Props) {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No events recorded yet</h3>
        <p className="text-sm text-slate-500">
          Use the Demo page to simulate agent activity, or connect a real agent.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Event</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
              <th className="text-right p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="stagger-children">
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{eventTypeIcon(event.eventType)}</span>
                    <div>
                      <p className="font-medium text-sm text-slate-200">{event.eventType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500 font-mono">{event.id.slice(0, 12)}…</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                    {(event as unknown as { agent?: { name: string } }).agent?.name ?? event.agentId.slice(0, 8)}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`badge ${event.status === "recorded" ? "badge-recorded" : "badge-recording-failed"}`}>
                    {event.status === "recorded" ? "✓ Recorded" : "⚠ Failed"}
                  </span>
                </td>
                <td className="p-4">
                  {event.verdictJson ? (
                    <span className={`badge ${event.verdictJson.ok ? "badge-pass" : "badge-fail"}`}>
                      {event.verdictJson.ok ? "✓ Verified" : "✗ Failed"}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Not verified</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-xs text-slate-400">{timeAgo(event.createdAt)}</span>
                </td>
                <td className="p-4 text-right">
                  {event.status === "recorded" && (
                    <button
                      className="btn-verify"
                      disabled={verifyingId === event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerify?.(event.id);
                      }}
                    >
                      {verifyingId === event.id ? (
                        <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
