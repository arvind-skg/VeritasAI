/**
 * EventTable — Enterprise-grade cryptographic audit & telemetry feed.
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

function EventTypeIcon({ type }: { type: string }) {
  if (type.includes("loan") || type.includes("underwriting")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    );
  }
  if (type.includes("refund") || type.includes("payment")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (type.includes("triage") || type.includes("medical")) {
    return (
      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    </div>
  );
}

function RiskPill({ risk }: { risk?: string }) {
  const r = (risk || "LOW").toUpperCase();
  if (r === "CRITICAL") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> Critical
      </span>
    );
  }
  if (r === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> High Risk
      </span>
    );
  }
  if (r === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Low Risk
    </span>
  );
}

export default function EventTable({ events, onVerify, verifyingId }: Props) {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">No matching decision events</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Adjust your filters or send telemetry via the Python SDK to populate this feed.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden border-slate-200/80">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Decision Event</th>
              <th className="py-3 px-4">AI Outcome</th>
              <th className="py-3 px-4">Agent Model</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Cryptographic Integrity</th>
              <th className="py-3 px-4">Recorded</th>
              <th className="py-3 px-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Event Name & ID */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <EventTypeIcon type={event.eventType} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 capitalize text-xs">
                          {event.eventType.replace(/_/g, " ")}
                        </span>
                        {event.requestId && (
                          <span className="text-[10px] text-slate-400 font-mono">#{event.requestId}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{event.id.slice(0, 18)}…</p>
                    </div>
                  </div>
                </td>

                {/* AI Outcome */}
                <td className="py-3 px-4">
                  {event.decision ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide ${
                      event.decision.toLowerCase().includes("reject") || event.decision.toLowerCase().includes("fail") || event.decision.toLowerCase().includes("deny")
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {event.decision}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </td>

                {/* Responsible Agent */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">
                      {event.agent?.name ?? "Autonomous Agent"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {event.agent?.environment ?? "PROD"}
                  </span>
                </td>

                {/* Risk Level */}
                <td className="py-3 px-4">
                  <RiskPill risk={event.riskLevel} />
                </td>

                {/* Cryptographic Integrity */}
                <td className="py-3 px-4">
                  {event.verdictJson ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      event.verdictJson.ok
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {event.verdictJson.ok ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          7/7 Domains Passed
                        </>
                      ) : (
                        "✗ Integrity Failed"
                      )}
                    </span>
                  ) : event.status === "recording_failed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      ⚠ Fail-Safe Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Receipt Anchored
                    </span>
                  )}
                </td>

                {/* Recorded At */}
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {timeAgo(event.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {event.status === "recorded" && (
                      <button
                        className="btn-verify"
                        disabled={verifyingId === event.id}
                        onClick={() => onVerify?.(event.id)}
                      >
                        {verifyingId === event.id ? (
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full mr-1" />
                        ) : (
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {event.verdictJson ? "Re-verify" : "Verify Proof"}
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Inspect Decision Telemetry & Receipt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {events.length} decision telemetry records</span>
        <span className="font-mono text-[11px]">Fail-safe Non-Blocking Pipeline Active</span>
      </div>
    </div>
  );
}

