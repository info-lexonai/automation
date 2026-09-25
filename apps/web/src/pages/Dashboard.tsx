import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";
import { InstallPWAButton } from "../components/InstallPWAButton";

export default function Dashboard() {
  const [account, setAccount] = useState<any>(null);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet("/api/instagram/profile"), apiGet("/api/automations")])
      .then(([p, a]) => {
        setAccount(p.account);
        setAutomations(a.automations ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-white/50">Loading…</div>;

  const active = automations.filter((a) => a.status === "active").length;
  const totalDms = automations.reduce((s, a) => s + (a.automation_stats?.[0]?.dms_sent ?? 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <InstallPWAButton />
      </div>

      <div className="card flex items-center gap-4 mb-6">
        {account ? (
          <>
            <img src={account.profile_image_url ?? "https://placehold.co/64"} className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <p className="font-medium">@{account.username}</p>
              <span className="badge-active">● Connected</span>
            </div>
            <Link to="/settings" className="btn-secondary text-sm">Manage</Link>
          </>
        ) : (
          <>
            <div className="flex-1">
              <p className="font-medium">Instagram not connected</p>
              <p className="text-white/50 text-sm">Connect your account to start automating DMs</p>
            </div>
            <Link to="/connect" className="btn-primary text-sm">Connect</Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Active" value={active} />
        <Stat label="Total automations" value={automations.length} />
        <Stat label="DMs sent" value={totalDms} />
        <Stat label="Paused" value={automations.filter((a) => a.status === "paused").length} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Recent automations</h2>
        <Link to="/automations/new" className="btn-primary text-sm">+ Create Auto DM</Link>
      </div>
      <div className="flex flex-col gap-2">
        {automations.slice(0, 5).map((a) => (
          <Link to={`/automations/${a.id}`} key={a.id} className="card flex items-center justify-between hover:border-accent">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-white/50 text-xs">{a.trigger_type === "keywords" ? "Keyword trigger" : "Any comment"}</p>
            </div>
            <span className={a.status === "active" ? "badge-active" : "badge-paused"}>{a.status}</span>
          </Link>
        ))}
        {!automations.length && <p className="text-white/40 text-sm">No automations yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}
