import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Agents from "./pages/Agents";
import Login from "./pages/Login";
import Demo from "./pages/Demo";
import DeveloperHub from "./pages/DeveloperHub";
import AuditTrail from "./pages/AuditTrail";
import Playground from "./pages/Playground";
import Compliance from "./pages/Compliance";

function RequireAuth({ children }: { children: ReactElement }) {
  const isAuth = localStorage.getItem("vai_auth") === "true" || !!localStorage.getItem("vai_token");
  if (!isAuth) return <Navigate to="/login" />;
  return children;
}

function Nav() {
  const location = useLocation();
  if (location.pathname === "/login") return null;

  const rawOrg = localStorage.getItem("vai_org");
  const org = rawOrg ? JSON.parse(rawOrg) : null;

  function logout() {
    localStorage.removeItem("vai_auth");
    localStorage.removeItem("vai_token");
    localStorage.removeItem("vai_user");
    localStorage.removeItem("vai_org");
    window.location.href = "/login";
  }

  return (
    <nav className="glass-card mx-4 mt-4 mb-8 px-6 py-3 flex items-center justify-between sticky top-4 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm">
      <div className="flex items-center gap-8">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-bold text-base text-slate-900 tracking-tight">VeritasAI</span>
            {org ? (
              <span className="block text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                {org.name}
              </span>
            ) : (
              <span className="block text-[11px] text-slate-400 font-medium">Compliance Platform</span>
            )}
          </div>
        </NavLink>

        <div className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/agents"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            Agents & Keys
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            Audit Trail
          </NavLink>

          <NavLink
            to="/playground"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-rose-50 text-rose-700 font-semibold border border-rose-200/60"
                  : "text-slate-600 hover:text-rose-600 hover:bg-slate-50"
              }`
            }
          >
            Playground
          </NavLink>

          <NavLink
            to="/compliance"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-purple-50 text-purple-700 font-semibold border border-purple-200/60"
                  : "text-slate-600 hover:text-purple-600 hover:bg-slate-50"
              }`
            }
          >
            Compliance
          </NavLink>

          <NavLink
            to="/developer"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              }`
            }
          >
            SDK & API
          </NavLink>

          <NavLink
            to="/demo"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60"
                  : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
              }`
            }
          >
            Demo Runner
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-[11px] font-medium text-emerald-800">Verification Active</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <button
          onClick={logout}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] pb-16 text-slate-900">
        <Nav />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/events/:id" element={<RequireAuth><EventDetail /></RequireAuth>} />
            <Route path="/agents" element={<RequireAuth><Agents /></RequireAuth>} />
            <Route path="/audit" element={<RequireAuth><AuditTrail /></RequireAuth>} />
            <Route path="/playground" element={<RequireAuth><Playground /></RequireAuth>} />
            <Route path="/compliance" element={<RequireAuth><Compliance /></RequireAuth>} />
            <Route path="/developer" element={<RequireAuth><DeveloperHub /></RequireAuth>} />
            <Route path="/demo" element={<RequireAuth><Demo /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
