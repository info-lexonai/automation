import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SidebarNav, BottomNav } from "./components/Nav";
import Login from "./pages/Login";
import Connect from "./pages/Connect";
import Dashboard from "./pages/Dashboard";
import CreateAutomation from "./pages/CreateAutomation";
import MyAutomations from "./pages/MyAutomations";
import AutomationDetails from "./pages/AutomationDetails";
import Settings from "./pages/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/50">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 min-w-0">{children}</main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/connect" element={<Protected><Connect /></Protected>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/automations" element={<Protected><MyAutomations /></Protected>} />
      <Route path="/automations/new" element={<Protected><CreateAutomation /></Protected>} />
      <Route path="/automations/:id" element={<Protected><AutomationDetails /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
