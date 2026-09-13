import { useState, useEffect, type ReactElement } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const navLinks = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/agents", label: "Agents & Keys" },
    { to: "/audit", label: "Audit Trail" },
    { to: "/playground", label: "Playground" },
    { to: "/compliance", label: "Compliance" },
    { to: "/developer", label: "SDK & API" },
    { to: "/demo", label: "Demo Runner" },
  ];

  return (
    <nav className="glass-card mx-2 sm:mx-4 mt-2 sm:mt-4 mb-6 sm:mb-8 px-3 sm:px-6 py-2.5 sm:py-3 sticky top-2 sm:top-4 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 sm:gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo.jpeg"
              alt="VeritasAI Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
            />
            <div className="leading-tight">
              <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">VeritasAI</span>
              {org ? (
                <span className="block text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[160px]">
                  {org.name}
                </span>
              ) : (
                <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">Compliance Platform</span>
              )}
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="hidden sm:inline text-[11px] font-medium text-emerald-800">Verification Active</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded transition-colors hidden sm:block"
          >
            Sign Out
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t border-slate-200/80 space-y-1 animate-fade-in">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3">
            <span className="text-[11px] text-slate-400 font-mono">VeritasAI v2.0</span>
            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 py-1"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
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
