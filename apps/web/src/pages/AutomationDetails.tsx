import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../lib/api";

export default function AutomationDetails() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiGet(`/api/automations/${id}`).then(setData);
  }, [id]);

  if (!data) return <div className="p-6 text-white/50">Loading…</div>;
  const { automation: a, keywords, replies, events } = data;
  const stats = a.automation_stats?.[0] ?? {};

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">{a.title}</h1>
        <span className={a.status === "active" ? "badge-active" : "badge-paused"}>{a.status}</span>
      </div>
      <p className="text-white/50 text-sm mb-6">{a.description}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Triggered" value={stats.comments_triggered ?? 0} />
        <Stat label="DMs sent" value={stats.dms_sent ?? 0} />
        <Stat label="Replies sent" value={stats.replies_sent ?? 0} />
      </div>

      <Section title="Trigger">
        <p className="text-sm">{a.trigger_type === "keywords" ? `Keywords: ${keywords.map((k: any) => k.keyword).join(", ") || "—"}` : "Any comment"}</p>
        <p className="text-white/50 text-xs mt-1">Match mode: {a.match_mode} · Delay: {a.delay_seconds}s</p>
      </Section>

      <Section title="Public reply">
        {a.comment_reply_enabled ? (
          <ul className="text-sm list-disc list-inside">{replies.map((r: any) => <li key={r.id}>{r.response_text}</li>)}</ul>
        ) : (
          <p className="text-sm text-white/50">Disabled</p>
        )}
      </Section>

      <Section title="DM content">
        <p className="text-sm whitespace-pre-wrap">{a.dm_content}</p>
        {a.button_label && <div className="mt-2 bg-accent/20 text-accent text-center rounded-lg py-2 text-sm max-w-xs">{a.button_label}</div>}
        {a.resource_url && <p className="text-white/40 text-xs mt-2 break-all">{a.resource_url}</p>}
      </Section>

      <Section title="Recent activity">
        {events?.length ? (
          <ul className="text-sm flex flex-col gap-1.5">
            {events.map((e: any) => (
              <li key={e.id} className="flex justify-between text-white/70">
                <span>{e.event_type.replace("_", " ")}</span>
                <span className={e.status === "success" ? "text-emerald-400" : e.status === "failed" ? "text-red-400" : "text-white/40"}>{e.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/40 text-sm">No activity yet.</p>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-4">
      <p className="font-medium mb-2">{title}</p>
      {children}
    </div>
  );
}
