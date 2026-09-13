import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Agents from "./pages/Agents";
import Login from "./pages/Login";
import Demo from "./pages/Demo";

// Simple auth check wrapper
function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuth = localStorage.getItem("vai_auth") === "true";
  if (!isAuth) return <Navigate to="/login" />;
  return children;
}

function Nav() {
  const location = useLocation();
  if (location.pathname === "/login") return null;

  function logout() {
    localStorage.removeItem("vai_auth");
    window.location.href = "/login";
  }

  return (
    <nav className="glass-card mx-4 mt-4 mb-8 px-6 py-4 flex items-center justify-between sticky top-4 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">VeritasAI</span>
        </div>
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/agents"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            Agents
          </NavLink>
          <NavLink
            to="/demo"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-500/20 text-indigo-300" : "text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10"
              }`
            }
          >
            Run Demo
          </NavLink>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400">System Active</span>
        </div>
        <div className="h-4 w-px bg-white/10"></div>
        <button onClick={logout} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-animated pb-12">
        <Nav />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/events/:id" element={<RequireAuth><EventDetail /></RequireAuth>} />
            <Route path="/agents" element={<RequireAuth><Agents /></RequireAuth>} />
            <Route path="/demo" element={<RequireAuth><Demo /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
