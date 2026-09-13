import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Login() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.login({ email, password });
      localStorage.setItem("vai_token", res.token);
      localStorage.setItem("vai_user", JSON.stringify(res.user));
      localStorage.setItem("vai_org", JSON.stringify(res.organization));
      localStorage.setItem("vai_auth", "true");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.register({ orgName, email, password, name });
      localStorage.setItem("vai_token", res.token);
      localStorage.setItem("vai_user", JSON.stringify(res.user));
      localStorage.setItem("vai_org", JSON.stringify(res.organization));
      localStorage.setItem("vai_auth", "true");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemo() {
    // Fill demo credentials and sign in
    setEmail("admin@veritasai.io");
    setPassword("veritasai-admin");
    setTab("login");
    // Fallback direct login using default token if needed
    localStorage.setItem("vai_token", "veritasai-admin");
    localStorage.setItem("vai_auth", "true");
    navigate("/");
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="glass-card max-w-md w-full p-8 animate-fade-in relative">
        <div className="relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-3 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              VeritasAI
            </h1>
            <p className="text-slate-500 text-sm mt-1">AI Agent Verification, Audit & Observability</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 mb-6">
            <button
              type="button"
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                tab === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                tab === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create Organization
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-2.5 text-sm"
              >
                {loading ? "Authenticating..." : "Sign In to Organization"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="e.g. Acme Financial Technologies"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="e.g. Alice Smith"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="alice@acme.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:border-slate-900"
                  placeholder="Create secure password"
                  required
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-2.5 text-sm"
              >
                {loading ? "Creating Account..." : "Create Organization & Agent"}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-medium">
              <span className="bg-white px-3 text-slate-400">Quick Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>⚡</span> Instant Access with Demo Organization
          </button>
        </div>
      </div>
    </div>
  );
}
