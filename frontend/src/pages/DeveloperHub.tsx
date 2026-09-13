import { useState } from "react";

export default function DeveloperHub() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const pythonSnippet = `from veritasai import VeritasAI

# 1. Initialize client with your agent's API key
client = VeritasAI(
    api_key="vra_live_your_agent_api_key_here",
    base_url="http://localhost:4000/api/v1"
)

# 2. Record an AI decision (Non-blocking & fail-safe)
decision = client.log_decision(
    decision="approved",
    input_data={
        "credit_score": 750,
        "income": 95000,
        "debt_to_income": 0.22
    },
    output={
        "credit_limit": 50000,
        "tier": "tier_1_preferred"
    },
    metadata={
        "application_id": "APP-8421",
        "underwriting_model": "credit-agent-v2"
    },
    risk_level="LOW",
    event_type="loan_underwriting"
)

print(f"Secured Event ID: {decision.event_id}")
print(f"Verification Status: {decision.verification_status}")

# 3. Cryptographically verify the receipt offline
verdict = client.verify(decision.event_id)
print(f"Verified 7 Domains: {verdict.ok}")`;

  const curlSnippet = `curl -X POST http://localhost:4000/api/v1/decisions \\
  -H "Authorization: Bearer vra_live_your_agent_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "decision": "approved",
    "event_type": "loan_underwriting",
    "risk_level": "LOW",
    "input_data": { "credit_score": 750, "income": 95000 },
    "output": { "credit_limit": 50000 },
    "metadata": { "application_id": "APP-8421" }
  }'`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Developer Documentation
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Integrate VeritasAI into Your AI Agent</h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Your AI models run on your own infrastructure. Integrate VeritasAI via our lightweight Python SDK or REST API
          to secure decision audit trails and prove regulatory compliance without exposing private PII.
        </p>
      </div>

      {/* 3 Step Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center mb-3 text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Create an Agent</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Go to the <span className="text-slate-900 font-semibold">Agents</span> tab and create a profile to get your unique <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">vra_live_...</code> API key.
          </p>
        </div>

        <div className="glass-card p-5 border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-3 text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Install the SDK</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Run <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">pip install veritasai</code>. Pure Python standard library with zero heavyweight dependencies.
          </p>
        </div>

        <div className="glass-card p-5 border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center mb-3 text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Log Decisions</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Call <code className="text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">client.log_decision()</code> whenever your model makes a critical decision.
          </p>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="space-y-6">
        {/* Python SDK */}
        <div className="glass-card overflow-hidden border-slate-200/80">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Python SDK Quickstart</span>
            </div>
            <button
              onClick={() => copy(pythonSnippet, "python")}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copied === "python" ? "✓ Copied" : "Copy Python Code"}
            </button>
          </div>
          <div className="p-5 bg-slate-900">
            <pre className="text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed">
              {pythonSnippet}
            </pre>
          </div>
        </div>

        {/* REST API */}
        <div className="glass-card overflow-hidden border-slate-200/80">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">REST API (cURL / Any Language)</span>
            </div>
            <button
              onClick={() => copy(curlSnippet, "curl")}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copied === "curl" ? "✓ Copied" : "Copy cURL"}
            </button>
          </div>
          <div className="p-5 bg-slate-900">
            <pre className="text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed">
              {curlSnippet}
            </pre>
          </div>
        </div>

        {/* Data Privacy Callout */}
        <div className="glass-card p-6 border-indigo-200 bg-indigo-50/40">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 text-indigo-700 text-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Zero-Knowledge Data Privacy Guarantee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you pass <code className="text-indigo-800 font-mono bg-indigo-100/70 px-1 py-0.5 rounded">input_data</code> (such as customer names, medical notes, or financials),
                VeritasAI cryptographically salts and hashes the payload into an irreversible SHA-256 digest before signing.
                Your raw customer data is never stored in the VeritasAI receipt, yet an auditor can mathematically verify that the decision was based on authentic data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
