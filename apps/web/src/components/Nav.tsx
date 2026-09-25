import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/automations", label: "My Automations", icon: "⚡" },
  { to: "/automations/new", label: "Create", icon: "➕" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function SidebarNav() {
  const { signOut } = useAuth();
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border bg-surface p-4 h-screen sticky top-0">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold">LX</div>
        <span className="font-semibold">LEXON Automation</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                isActive ? "bg-accent/15 text-accent" : "text-white/70 hover:bg-white/5"
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button onClick={signOut} className="text-sm text-white/50 hover:text-white px-3 py-2 text-left">
        Logout / Disconnect
      </button>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) => `flex flex-col items-center text-xs gap-0.5 px-2 ${isActive ? "text-accent" : "text-white/60"}`}
        >
          <span className="text-lg">{l.icon}</span>
          {l.label.split(" ")[0]}
        </NavLink>
      ))}
    </nav>
  );
}
