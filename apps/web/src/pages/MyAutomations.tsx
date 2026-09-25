import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiSend } from "../lib/api";

export default function MyAutomations() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [loading, setLoading] = useState(true);

  function load(f = filter) {
    setLoading(true);
    apiGet(`/api/automations?status=${f}`).then((r) => setItems(r.automations ?? [])).finally(() => setLoading(false));
  }
  useEffect(() => load(), [filter]);

  async function act(id: string, action: "pause" | "resume" | "duplicate" | "delete") {
    if (action === "delete") {
      if (!confirm("Delete this automation permanently?")) return;
      await apiSend("DELETE", `/api/automations/${id}`);
    } else {
      await apiSend("POST", `/api/automations/${id}/${action}`);
    }
    load();
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Automations</h1>
        <Link to="/automations/new" className="btn-primary text-sm">+ Create</Link>
      </div>
      <div className="flex gap-2 mb-4">
        {(["all", "active", "paused"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary text-sm" : "btn-secondary text-sm"}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/50">Loading…</p>
      ) : !items.length ? (
        <p className="text-white/40 text-sm">No automations here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => {
            const stats = a.automation_stats?.[0] ?? {};
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/automations/${a.id}`} className="flex-1">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      {a.trigger_type === "keywords" ? "Keyword trigger" : "Any comment"} · created {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                  <span className={a.status === "active" ? "badge-active" : "badge-paused"}>{a.status}</span>
                </div>
                <div className="flex gap-4 text-xs text-white/50 mt-3">
                  <span>💬 {stats.comments_triggered ?? 0} triggered</span>
                  <span>📩 {stats.dms_sent ?? 0} DMs sent</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {a.status === "active" ? (
                    <button className="btn-secondary text-xs" onClick={() => act(a.id, "pause")}>Pause</button>
                  ) : (
                    <button className="btn-secondary text-xs" onClick={() => act(a.id, "resume")}>Resume</button>
                  )}
                  <button className="btn-secondary text-xs" onClick={() => act(a.id, "duplicate")}>Duplicate</button>
                  <button className="btn-secondary text-xs text-red-300" onClick={() => act(a.id, "delete")}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
