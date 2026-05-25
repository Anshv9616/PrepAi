import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

const links = [
  { to: "/", icon: "⊞", label: "Dashboard" },
  { to: "/resume", icon: "◧", label: "Resume" },
  { to: "/interview", icon: "◎", label: "Interview" },
  { to: "/history", icon: "◷", label: "History" },
  { to: "/stats", icon: "◈", label: "Analytics" },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-bg-2/60 backdrop-blur-2xl border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xs font-black shadow-glow-sm shrink-0">
            AI
          </div>
          <span className="text-sm font-bold text-white tracking-wide">PrepAI</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 h-screen w-[220px] bg-bg-2/80 backdrop-blur-xl border-r border-border flex flex-col py-5 px-3 z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        {/* Subtle glow */}
        <div className="absolute top-20 left-4 w-24 h-24 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center justify-between px-3 pb-5 mb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-xs font-black shadow-glow-sm shrink-0">
              AI
            </div>
            <span className="text-sm font-bold text-white tracking-wide">PrepAI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-white/50 hover:text-white">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 animate-fade-in stagger-${i + 1} ${
                  isActive
                    ? "bg-accent/15 text-accent-light border border-accent/20 shadow-glow-sm"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`
              }
            >
              <span className="text-sm w-4 text-center">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={() => { dispatch(logout());toast.success("Logged out"); navigate("/login"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/25 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 w-full"
        >
          <span className="text-sm">↩</span>
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}
