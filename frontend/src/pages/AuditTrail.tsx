import { useEffect, useState, useMemo } from "react";
import { api, type AuditLogItem } from "../api/client";

type ActionCategory = "ALL" | "AGENTS" | "CREDENTIALS" | "VERIFICATIONS" | "POLICIES";

function getActionCategory(action: string): ActionCategory {
  if (action.includes("AGENT")) return "AGENTS";
  if (action.includes("CREDENTIAL") || action.includes("KEY")) return "CREDENTIALS";
  if (action.includes("VERIF") || action.includes("EVIDENCE")) return "VERIFICATIONS";
  if (action.includes("POLICY") || action.includes("ORGANIZATION") || action.includes("SECURITY")) return "POLICIES";
  return "ALL";
}

function getActionBadge(action: string) {
  if (action.includes("REVOKED") || action.includes("FAILED") || action.includes("DELETED")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (action.includes("VERIFIED") || action.includes("APPROVED")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (action.includes("ROTATED") || action.includes("UPDATED") || action.includes("CHANGED")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (action.includes("INITIALIZED") || action.includes("POLICY") || action.includes("REGISTERED")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (action.includes("DEMO") || action.includes("SEEDED")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function getResourceBadge(resource: string) {
  switch (resource) {
    case "AGENT":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "CREDENTIAL":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "EVIDENCE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "ORGANIZATION":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ActionCategory>("ALL");
  const [selectedResource, setSelectedResource] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listAuditLogs({ limit: 200 });
      setLogs(res.logs || []);
    } catch (err: any) {
      console.error("[VeritasAI Audit] Failed to load logs:", err);
      setError(err?.message || "Failed to load audit trail from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (activeCategory !== "ALL" && getActionCategory(log.action) !== activeCategory) {
        return false;
      }
      // Resource filter
      if (selectedResource !== "ALL" && log.resourceType !== selectedResource) {
        return false;
      }
      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const actionMatch = log.action.toLowerCase().includes(q);
        const resourceMatch = log.resourceType.toLowerCase().includes(q);
        const idMatch = (log.resourceId || "").toLowerCase().includes(q);
        const userMatch = (log.user?.name || log.user?.email || "system").toLowerCase().includes(q);
        const detailsMatch = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
        return actionMatch || resourceMatch || idMatch || userMatch || detailsMatch;
      }
      return true;
    });
  }, [logs, activeCategory, selectedResource, search]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: logs.length,
      agents: logs.filter((l) => getActionCategory(l.action) === "AGENTS").length,
      credentials: logs.filter((l) => getActionCategory(l.action) === "CREDENTIALS").length,
      verifications: logs.filter((l) => getActionCategory(l.action) === "VERIFICATIONS").length,
      securityPolicies: logs.filter((l) => getActionCategory(l.action) === "POLICIES").length,
    };
  }, [logs]);

  function exportAuditLogs() {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `veritasai_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleCopyDetails(details: any) {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Audit Trail</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Tamper-Proof
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Cryptographically sealed timeline of agent credentials, lifecycle modifications, verification checks, and security actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAuditLogs}
            disabled={filteredLogs.length === 0}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Export filtered audit logs as JSON for external compliance review"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <svg className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards / KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Recorded timeline logs</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verifications</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.verifications}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">7-Domain evidence audits</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credentials & Keys</span>
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          </div>
          <p className="text-2xl font-bold text-sky-700 mt-2">{stats.credentials}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Created, rotated & revoked</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent Lifecycle</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">{stats.agents}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Provisioning & config edits</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, resource ID, initiator, or details..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-xs focus:border-slate-900 focus:outline-none text-slate-900"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Resource Filter Dropdown */}
          <div className="sm:w-52">
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none text-slate-700 font-medium"
            >
              <option value="ALL">All Resource Types</option>
              <option value="AGENT">AGENT</option>
              <option value="CREDENTIAL">CREDENTIAL</option>
              <option value="EVIDENCE">EVIDENCE</option>
              <option value="ORGANIZATION">ORGANIZATION</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {(
            [
              { id: "ALL", label: "All Categories" },
              { id: "VERIFICATIONS", label: "Verifications" },
              { id: "CREDENTIALS", label: "Credentials & Keys" },
              { id: "AGENTS", label: "Agent Lifecycle" },
              { id: "POLICIES", label: "Organization & Policies" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs font-medium">{error}</p>
          </div>
          <button onClick={loadLogs} className="btn-secondary text-xs py-1 px-3">
            Retry
          </button>
        </div>
      )}

      {/* Content Table */}
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full rounded-xl"></div>
          <div className="skeleton h-16 w-full rounded-xl"></div>
          <div className="skeleton h-16 w-full rounded-xl"></div>
          <div className="skeleton h-16 w-full rounded-xl"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No audit events match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || activeCategory !== "ALL" || selectedResource !== "ALL"
              ? "Try adjusting your search keywords or resetting filters to view all recorded logs."
              : "No audit logs have been recorded for this organization yet."}
          </p>
          {(search || activeCategory !== "ALL" || selectedResource !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("ALL");
                setSelectedResource("ALL");
              }}
              className="btn-secondary text-xs mt-4"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden border-slate-200/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Initiator</th>
                  <th className="py-3 px-4">Summary & Details</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionBadgeStyle = getActionBadge(log.action);
                  const resourceBadgeStyle = getResourceBadge(log.resourceType);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${actionBadgeStyle}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${resourceBadgeStyle}`}>
                            {log.resourceType}
                          </span>
                          {log.resourceId && (
                            <span className="font-mono text-[11px] text-slate-500" title={log.resourceId}>
                              {log.resourceId.length > 14
                                ? `${log.resourceId.slice(0, 6)}...${log.resourceId.slice(-4)}`
                                : log.resourceId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Initiator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px]">
                            {log.user?.name ? log.user.name.slice(0, 1).toUpperCase() : "S"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-xs">
                              {log.user?.name || log.user?.email || "System Daemon"}
                            </p>
                            {log.user?.email && (
                              <p className="text-[10px] text-slate-400">{log.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Details Preview */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        {log.details ? (
                          <div className="flex items-center gap-1 overflow-hidden">
                            {typeof log.details === "object" ? (
                              <span className="truncate font-mono text-[11px] bg-slate-100/80 px-2 py-0.5 rounded text-slate-700">
                                {Object.entries(log.details)
                                  .slice(0, 2)
                                  .map(([k, v]) => `${k}: ${typeof v === "object" ? "..." : String(v)}`)
                                  .join(" | ")}
                              </span>
                            ) : (
                              <span className="truncate">{String(log.details)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-secondary text-[11px] py-1 px-2.5 hover:bg-slate-900 hover:text-white transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50/60 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> audit events
            </span>
            <span className="text-[11px] font-mono text-slate-400">All events anchored in immutable store</span>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="glass-card max-w-2xl w-full p-6 space-y-4 shadow-xl border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getResourceBadge(selectedLog.resourceType)}`}>
                    {selectedLog.resourceType}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-2">Audit Event Record</h2>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Timestamp</span>
                <p className="font-mono text-slate-800 mt-0.5">{new Date(selectedLog.createdAt).toISOString()}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Initiator</span>
                <p className="text-slate-800 mt-0.5">{selectedLog.user?.name || selectedLog.user?.email || "System / Automated Service"}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Resource ID</span>
                <p className="font-mono text-slate-800 mt-0.5">{selectedLog.resourceId || "N/A"}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Organization</span>
                <p className="font-mono text-slate-800 mt-0.5">Demarcated Tenant</p>
              </div>
            </div>

            {/* JSON Payload Details */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Event Details Payload</span>
                <button
                  onClick={() => handleCopyDetails(selectedLog.details)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                >
                  {copied ? (
                    <span className="text-emerald-600 font-semibold">✓ Copied</span>
                  ) : (
                    <span>Copy JSON</span>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                {JSON.stringify(selectedLog.details, null, 2) || "// No extra details"}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
