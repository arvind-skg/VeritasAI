import { useEffect, useState } from "react";
import { api, type Agent } from "../api/client";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadAgents() {
    try {
      const res = await api.listAgents();
      setAgents(res.agents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setCreating(true);
    setError("");
    try {
      await api.createAgent(newName);
      setNewName("");
      await loadAgents();
    } catch (err: any) {
      setError(err.message || "Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Registered Agents</h1>
        <p className="text-slate-400">Manage AI agents authorized to record cryptographic evidence.</p>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Register New Agent</h3>
        <form onSubmit={handleCreate} className="flex gap-4 items-start">
          <div className="flex-1">
            <input
              type="text"
              placeholder="e.g. SupportBot v3.2, Loan Decision Agent"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full"
              disabled={creating}
            />
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
          </div>
          <button type="submit" disabled={!newName.trim() || creating} className="btn-primary whitespace-nowrap">
            {creating ? "Registering..." : "Register Agent"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-24 w-full"></div>
          <div className="skeleton h-24 w-full"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No agents registered yet.
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {agents.map((agent) => (
            <div key={agent.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  🤖 {agent.name}
                </h4>
                <p className="text-sm text-slate-400 font-mono">ID: {agent.id}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 border border-white/5 flex items-center gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">API Key</p>
                  <code className="text-indigo-300 text-sm font-mono">{agent.apiKey}</code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(agent.apiKey)}
                  className="p-2 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
