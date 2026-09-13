import { useEffect, useState } from "react";
import { api, type Agent, type CredentialInfo } from "../api/client";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Agent Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("LOAN_APPROVAL");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // New Credential Display Modal (Shown ONCE upon creation)
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Manage Credentials Drawer/Modal
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [credLoading, setCredLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

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
    if (!name.trim()) return;

    setCreating(true);
    setError("");

    try {
      const res = await api.createAgent({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        environment,
      });

      setCreatedKey(res.apiKey);
      setName("");
      setDescription("");
      setShowCreateModal(false);
      await loadAgents();
    } catch (err: any) {
      setError(err.message || "Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  async function openCredentials(agent: Agent) {
    setSelectedAgent(agent);
    setCredLoading(true);
    setActionMsg("");
    try {
      const res = await api.listCredentials(agent.id);
      setCredentials(res.credentials);
    } catch (err) {
      console.error(err);
    } finally {
      setCredLoading(false);
    }
  }

  async function handleRotate(credId: string) {
    if (!selectedAgent) return;
    try {
      const res = await api.rotateCredential(selectedAgent.id, credId);
      setCreatedKey(res.apiKey);
      setActionMsg("Key rotated successfully. The old key is revoked.");
      const updated = await api.listCredentials(selectedAgent.id);
      setCredentials(updated.credentials);
    } catch (err: any) {
      setActionMsg(`Rotation failed: ${err.message}`);
    }
  }

  async function handleRevoke(credId: string) {
    if (!selectedAgent) return;
    if (!confirm("Are you sure you want to revoke this credential? Connected agents will be rejected.")) return;
    try {
      await api.revokeCredential(selectedAgent.id, credId);
      setActionMsg("Key revoked.");
      const updated = await api.listCredentials(selectedAgent.id);
      setCredentials(updated.credentials);
    } catch (err: any) {
      setActionMsg(`Revocation failed: ${err.message}`);
    }
  }

  async function handleGenerateNewKey() {
    if (!selectedAgent) return;
    try {
      const res = await api.createCredential(selectedAgent.id, "Secondary Key", selectedAgent.environment);
      setCreatedKey(res.apiKey);
      setActionMsg("New credential generated.");
      const updated = await api.listCredentials(selectedAgent.id);
      setCredentials(updated.credentials);
    } catch (err: any) {
      setActionMsg(`Generation failed: ${err.message}`);
    }
  }

  async function toggleStatus(agent: Agent) {
    const nextStatus = agent.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await api.updateAgent(agent.id, { status: nextStatus });
      await loadAgents();
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent({ ...selectedAgent, status: nextStatus });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Registered AI Agents</h1>
          <p className="text-slate-500 text-sm">
            Manage agents, issue and rotate credentials, and configure telemetry boundaries.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0 flex items-center gap-2">
          <span>+</span> Register New Agent
        </button>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-44 w-full"></div>
          <div className="skeleton h-44 w-full"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-slate-900 font-semibold mb-1">No agents registered yet</p>
          <p className="text-sm text-slate-500 mb-4">Register an agent to obtain your credentials and start logging decisions.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary mx-auto">
            Register Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agents.map((agent) => (
            <div key={agent.id} className="glass-card p-6 flex flex-col justify-between border-slate-200/80 hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span>🤖</span> {agent.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {agent.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      agent.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {agent.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {agent.environment}
                    </span>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">{agent.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-center">
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Decisions Logged</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{agent.eventsCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Active Keys</p>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {agent.credentials?.filter((c) => c.status === "ACTIVE").length || 1}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openCredentials(agent)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <span>🔑</span> Manage Credentials
                </button>
                <button
                  onClick={() => toggleStatus(agent)}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                    agent.status === "ACTIVE"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {agent.status === "ACTIVE" ? "Disable Agent" : "Enable Agent"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW KEY MODAL (Show ONCE) */}
      {createdKey && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Save Your Agent API Key</h3>
                <p className="text-xs text-slate-500">This key will never be displayed in full again.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-emerald-200 mb-4 flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-emerald-800 break-all font-semibold">{createdKey}</code>
              <button
                onClick={() => navigator.clipboard.writeText(createdKey)}
                className="btn-secondary py-1 px-2.5 text-xs shrink-0"
              >
                Copy
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 mb-6">
              Use this key in the Python SDK:
              <pre className="mt-2 text-slate-900 font-mono text-[11px] overflow-x-auto p-2.5 bg-white border border-slate-200 rounded">
{`from veritasai import VeritasAI
client = VeritasAI(api_key="${createdKey}")`}
              </pre>
            </div>

            <button onClick={() => setCreatedKey(null)} className="btn-primary w-full justify-center">
              I Have Safely Saved My Key
            </button>
          </div>
        </div>
      )}

      {/* CREATE AGENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Register New AI Agent</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mortgage Underwriter v2, SupportBot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional use-case summary..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Use Case Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:border-slate-900"
                  >
                    <option value="LOAN_APPROVAL">Loan Approval</option>
                    <option value="CUSTOMER_SUPPORT">Customer Support</option>
                    <option value="REFUND">Refund Decisions</option>
                    <option value="TRIAGE">Medical Triage</option>
                    <option value="CUSTOM">Custom Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:border-slate-900"
                  >
                    <option value="PRODUCTION">Production</option>
                    <option value="STAGING">Staging</option>
                    <option value="TEST">Test / Sandbox</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary text-xs py-2 px-4">
                  {creating ? "Creating..." : "Create Agent & Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CREDENTIALS MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🔑</span> Credentials for {selectedAgent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedAgent.id}</p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-700 text-lg px-2"
              >
                ✕
              </button>
            </div>

            {actionMsg && (
              <div className="mb-4 text-xs text-slate-800 bg-slate-100 border border-slate-200 p-2.5 rounded-lg">
                {actionMsg}
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Active & Revoked Keys</h4>
              <button onClick={handleGenerateNewKey} className="btn-secondary text-xs py-1 px-3">
                + Generate Key
              </button>
            </div>

            {credLoading ? (
              <div className="skeleton h-24 w-full"></div>
            ) : credentials.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No credential records found.</p>
            ) : (
              <div className="space-y-2 mb-6">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-900 font-semibold">
                          {cred.keyPrefix}••••••••{cred.lastFour}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          cred.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {cred.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Created {new Date(cred.createdAt).toLocaleDateString()}
                        {cred.lastUsedAt && ` • Last used ${new Date(cred.lastUsedAt).toLocaleTimeString()}`}
                      </p>
                    </div>

                    {cred.status === "ACTIVE" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRotate(cred.id)}
                          className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                        >
                          Rotate
                        </button>
                        <button
                          onClick={() => handleRevoke(cred.id)}
                          className="text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedAgent(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
