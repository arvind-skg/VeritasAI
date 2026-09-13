import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type EventRecord, type Agent, type OrgStats } from "../api/client";
import EventTable from "../components/EventTable";

export default function Dashboard() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  async function loadData() {
    try {
      const [eventsRes, agentsRes, statsRes] = await Promise.all([
        api.listEvents({
          limit: 100,
          search: search || undefined,
          agentId: selectedAgent || undefined,
          riskLevel: selectedRisk || undefined,
          status: selectedStatus || undefined,
        }),
        api.listAgents().catch(() => ({ agents: [] })),
        api.getOrgStats().catch(() => null),
      ]);

      setEvents(eventsRes.events);
      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [search, selectedAgent, selectedRisk, selectedStatus]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  async function handleVerify(id: string) {
    if (verifyingId) return;
    setVerifyingId(id);
    try {
      await api.verifyEvent(id);
      await loadData();
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setVerifyingId(null);
    }
  }

  function handleExportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veritasai_audit_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-fade-in space-y-6">
      {/* Enterprise Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Telemetry Active
            </span>
            <span className="text-xs text-slate-400 font-mono">Production Environment</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Decision Audit & Observability Feed
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time cryptographic audit trail of autonomous AI agent decisions across all environments.
          </p>
        </div>

        {/* Header Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleExportJson}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
            title="Export full filtered decisions as JSON for compliance audits"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>

          <Link
            to="/demo"
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
          >
            <span>⚡</span> Simulate Activity
          </Link>

          <button
            onClick={handleRefresh}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="glass-card p-4.5 border-t-2 border-t-indigo-600">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Active AI Agents</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {stats.activeAgents} <span className="text-xs text-slate-400 font-normal">/ {stats.totalAgents} registered</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Autonomous models online</p>
          </div>

          <div className="glass-card p-4.5 border-t-2 border-t-slate-900">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Decisions Recorded</p>
              <span className="text-xs text-slate-400">100% SLA</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{stats.totalEvents}</p>
            <p className="text-[11px] text-slate-500 mt-1">Cryptographically captured</p>
          </div>

          <div className="glass-card p-4.5 border-t-2 border-t-emerald-600">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Verification Pass Rate</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                7/7 DOMAINS
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">{stats.verificationPassRate}%</p>
            <p className="text-[11px] text-slate-500 mt-1">Cryptographic proof intact</p>
          </div>

          <div className="glass-card p-4.5 border-t-2 border-t-amber-500">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Risk & Fail-Safe</p>
              <span className="text-xs text-amber-600 font-bold">MONITORED</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {stats.highRiskEvents} <span className="text-xs text-slate-400 font-normal">flagged</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Zero latency disruption</p>
          </div>
        </div>
      )}

      {/* Cryptographic Trust & Infrastructure Strip */}
      <div className="glass-card p-4 bg-slate-50/70 border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Live Evidence & Anomaly Monitor (RFC 6962 Merkle Log Active)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/playground"
              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <span>⚔️</span> Attack Playground
            </Link>
            <Link
              to="/compliance"
              className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <span>📋</span> Compliance Evidence Packs
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
              9-STG
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-[11px]">AI Action Chain</p>
              <p className="text-[10px] text-slate-500">Micro-block cryptographic linkage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
              PQC
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-[11px]">Post-Quantum Signatures</p>
              <p className="text-[10px] text-slate-500">NIST ML-DSA-65 + Ed25519</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
              TSA
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-[11px]">RFC 3161 Timestamp Anchor</p>
              <p className="text-[10px] text-slate-500">External multi-party attestation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
              ZK
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-[11px]">Selective Disclosure</p>
              <p className="text-[10px] text-slate-500">Salted zero-knowledge PII proofs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-[200px]">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search decisions, event types, or record IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedStatus("")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === "" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setSelectedStatus("recorded")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === "recorded" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Secured
            </button>
            <button
              onClick={() => setSelectedStatus("recording_failed")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedStatus === "recording_failed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Exceptions
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 text-slate-800 rounded-lg focus:border-slate-900 flex-1 sm:flex-initial"
          >
            <option value="">All AI Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 text-slate-800 rounded-lg focus:border-slate-900 flex-1 sm:flex-initial"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {(search || selectedAgent || selectedRisk || selectedStatus) && (
            <button
              onClick={() => { setSearch(""); setSelectedAgent(""); setSelectedRisk(""); setSelectedStatus(""); }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1.5 rounded bg-rose-50 border border-rose-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Feed Table */}
      {loading ? (
        <div className="space-y-2.5">
          <div className="skeleton h-14 w-full"></div>
          <div className="skeleton h-14 w-full"></div>
          <div className="skeleton h-14 w-full"></div>
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
