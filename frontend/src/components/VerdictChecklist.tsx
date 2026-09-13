/**
 * VerdictChecklist — 7-domain verification result display with refined light styling.
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
  borderColor: string;
  domains: { key: keyof VerdictChecks; label: string }[];
}[] = [
  {
    label: "Privacy & Data Minimization",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    domains: [{ key: "binding", label: "Agent Key Identity Binding" }],
  },
  {
    label: "Cryptographic Integrity",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    domains: [{ key: "signature", label: "Ed25519 & ML-DSA Digital Signature" }],
  },
  {
    label: "Audit & Ledger Proofs",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    domains: [
      { key: "inclusion", label: "Merkle Tree Inclusion Proof" },
      { key: "witnesses", label: "Decentralized Witness Signatures" },
      { key: "anchor", label: "Root Trust Anchoring" },
    ],
  },
  {
    label: "Hardware Execution Context",
    color: "text-amber-800",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    domains: [
      { key: "attestation", label: "Hardware TEE Remote Attestation" },
      { key: "enclave", label: "Enclave Measurement & Microcode" },
    ],
  },
];

function StatusIcon({ status }: { status: DomainCheck["status"] }) {
  switch (status) {
    case "pass":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    case "fail":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    case "simulated":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01" />
          </svg>
        </span>
      );
    case "absent":
      return (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </span>
      );
  }
}

export default function VerdictChecklist({ checks, ok }: Props) {
  return (
    <div className="space-y-4">
      {/* Overall verdict header */}
      <div className={`flex items-center gap-3.5 p-4 rounded-xl border ${
        ok
          ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
          : "bg-rose-50/80 border-rose-200 text-rose-950"
      }`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
          ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}>
          {ok ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-bold text-base tracking-tight">
            {ok ? "CRYPTOGRAPHICALLY VERIFIED" : "VERIFICATION FAILED"}
          </p>
          <p className="text-xs text-slate-600">
            {ok
              ? "All independent trust domains passed mathematical validation"
              : "One or more cryptographic trust domain checks failed"}
          </p>
        </div>
      </div>

      {/* Domain groups */}
      <div className="space-y-3">
        {DOMAIN_GROUPS.map((group) => (
          <div key={group.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${group.bgColor} ${group.color} ${group.borderColor}`}>
                {group.label}
              </span>
            </div>
            <div className="space-y-2">
              {group.domains.map(({ key, label }) => {
                const check = checks[key];
                return (
                  <div key={key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <StatusIcon status={check.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{label}</span>
                        <span className={`badge badge-${check.status}`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">{check.detail}</p>
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
