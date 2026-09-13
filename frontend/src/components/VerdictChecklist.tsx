/**
 * VerdictChecklist — 7-domain verification result display.
 *
 * Groups domains under the four pitch-deck category tags:
 * Privacy, Integrity, Audit, Execution Context.
 */
import type { VerdictChecks, DomainCheck } from "../api/client";

interface Props {
  checks: VerdictChecks;
  ok: boolean;
}

const DOMAIN_GROUPS: {
  label: string;
  color: string;
  bgColor: string;
  domains: { key: keyof VerdictChecks; label: string }[];
}[] = [
  {
    label: "Privacy",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    domains: [{ key: "binding", label: "Binding" }],
  },
  {
    label: "Integrity",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    domains: [{ key: "signature", label: "Signature" }],
  },
  {
    label: "Audit",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    domains: [
      { key: "inclusion", label: "Inclusion" },
      { key: "witnesses", label: "Witnesses" },
      { key: "anchor", label: "Anchor" },
    ],
  },
  {
    label: "Execution Context",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    domains: [
      { key: "attestation", label: "Attestation" },
      { key: "enclave", label: "Enclave" },
    ],
  },
];

function StatusIcon({ status }: { status: DomainCheck["status"] }) {
  switch (status) {
    case "pass":
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case "fail":
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    case "simulated":
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
          </svg>
        </span>
      );
    case "absent":
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/20 text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </span>
      );
  }
}

export default function VerdictChecklist({ checks, ok }: Props) {
  return (
    <div className="space-y-4">
      {/* Overall verdict */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        ok
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-rose-500/5 border-rose-500/20"
      }`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
          ok ? "bg-emerald-500/20" : "bg-rose-500/20"
        }`}>
          {ok ? (
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        <div>
          <p className={`font-bold text-lg ${ok ? "text-emerald-400" : "text-rose-400"}`}>
            {ok ? "VERIFIED" : "VERIFICATION FAILED"}
          </p>
          <p className="text-sm text-slate-400">
            {ok
              ? "All applicable domains passed verification"
              : "One or more domains failed verification"}
          </p>
        </div>
      </div>

      {/* Domain groups */}
      <div className="stagger-children space-y-3">
        {DOMAIN_GROUPS.map((group) => (
          <div key={group.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${group.bgColor} ${group.color}`}>
                {group.label}
              </span>
            </div>
            <div className="space-y-2">
              {group.domains.map(({ key, label }) => {
                const check = checks[key];
                return (
                  <div key={key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <StatusIcon status={check.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">{label}</span>
                        <span className={`badge badge-${check.status}`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 break-words">{check.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
