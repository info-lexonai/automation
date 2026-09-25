import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiSend } from "../lib/api";

const STEPS = ["Post", "Trigger", "Reply", "Delay", "Details", "Resource", "DM", "Preview"];
const DELAY_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];

export default function CreateAutomation() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [postScope, setPostScope] = useState<"specific" | "any" | "next">("specific");
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const [triggerType, setTriggerType] = useState<"keywords" | "any_comment">("keywords");
  const [matchMode, setMatchMode] = useState<"exact" | "flexible">("flexible");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedInput, setExcludedInput] = useState("");
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [allowEmojiOnly, setAllowEmojiOnly] = useState(false);
  const [allowShortComments, setAllowShortComments] = useState(false);

  const [replyEnabled, setReplyEnabled] = useState(true);
  const [replyInput, setReplyInput] = useState("");
  const [replies, setReplies] = useState<string[]>(["Thanks! Check your DMs 👋", "Sent it to your DM 🚀"]);

  const [delaySeconds, setDelaySeconds] = useState(3);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("pdf");

  const [resourceUrl, setResourceUrl] = useState("");

  const [dmContent, setDmContent] = useState("Hey! 👋\nThanks for commenting.\nHere's what you asked for 🚀");
  const [buttonLabel, setButtonLabel] = useState("📚 GET IT NOW");

  useEffect(() => {
    apiGet("/api/instagram/profile").then((p) => setAccount(p.account));
    apiGet("/api/instagram/media").then((m) => setMedia(m.data ?? [])).catch(() => {});
  }, []);

  function addKeyword() {
    const v = keywordInput.trim();
    if (v && !keywords.some((k) => k.toLowerCase() === v.toLowerCase())) setKeywords([...keywords, v]);
    setKeywordInput("");
  }
  function addExcluded() {
    const v = excludedInput.trim();
    if (v && !excludedKeywords.includes(v)) setExcludedKeywords([...excludedKeywords, v]);
    setExcludedInput("");
  }
  function addReply() {
    const v = replyInput.trim();
    if (v) setReplies([...replies, v]);
    setReplyInput("");
  }

  function canProceed() {
    if (step === 0) return postScope !== "specific" || !!selectedPost;
    if (step === 1) return triggerType === "any_comment" || keywords.length > 0;
    if (step === 4) return title.trim().length > 0;
    if (step === 6) return dmContent.trim().length > 0;
    return true;
  }

  async function submit() {
    if (!account) return setError("Connect Instagram first.");
    setSubmitting(true);
    setError(null);
    try {
      await apiSend("POST", "/api/automations", {
        instagramAccountId: account.id,
        postScope,
        postId: selectedPost?.id,
        postType: selectedPost?.media_type,
        postThumbnailUrl: selectedPost?.thumbnail_url ?? selectedPost?.media_url,
        postCaption: selectedPost?.caption,
        title,
        description,
        resourceType,
        triggerType,
        matchMode,
        keywords,
        excludedKeywords,
        allowEmojiOnly,
        allowShortComments,
        delaySeconds,
        commentReplyEnabled: replyEnabled,
        commentReplies: replies,
        dmContent,
        buttonLabel,
        resourceUrl: resourceUrl || undefined,
      });
      navigate("/automations?created=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-28">
      <h1 className="text-xl font-semibold mb-1">Create Auto DM</h1>
      <p className="text-white/50 text-sm mb-4">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {!account && (
        <div className="card mb-4 text-sm text-amber-300">Instagram not connected — connect it before starting the automation.</div>
      )}

      <div className="card mb-6">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Which post/reel should trigger this?</p>
            <div className="flex gap-2 flex-wrap">
              {(["specific", "any", "next"] as const).map((s) => (
                <button key={s} onClick={() => setPostScope(s)} className={s === postScope ? "btn-primary text-sm" : "btn-secondary text-sm"}>
                  {s === "specific" ? "Specific Post/Reel" : s === "any" ? "Any Post/Reel" : "Next Post/Reel"}
                </button>
              ))}
            </div>
            {postScope === "specific" && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPost(m)}
                    className={`text-left rounded-xl overflow-hidden border-2 ${selectedPost?.id === m.id ? "border-accent" : "border-transparent"}`}
                  >
                    <img src={m.thumbnail_url ?? m.media_url} className="w-full aspect-[4/5] object-cover" />
                    <p className="text-xs text-white/60 p-1.5 line-clamp-2">{m.caption}</p>
                  </button>
                ))}
                {!media.length && <p className="text-white/40 text-sm col-span-2">No posts found. Connect Instagram or refresh.</p>}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button onClick={() => setTriggerType("keywords")} className={triggerType === "keywords" ? "btn-primary text-sm" : "btn-secondary text-sm"}>Specific Keywords</button>
              <button onClick={() => setTriggerType("any_comment")} className={triggerType === "any_comment" ? "btn-primary text-sm" : "btn-secondary text-sm"}>Any Comment</button>
            </div>

            {triggerType === "keywords" ? (
              <>
                <p className="text-white/50 text-xs">Matching is case-insensitive and trims whitespace. Add as many keywords as you want.</p>
                <div className="flex gap-2">
                  <input className="input" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} placeholder="e.g. tool" />
                  <button className="btn-secondary" onClick={addKeyword}>Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span key={k} className="bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      {k} <button onClick={() => setKeywords(keywords.filter((x) => x !== k))}>✕</button>
                    </span>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={matchMode === "exact"} onChange={(e) => setMatchMode(e.target.checked ? "exact" : "flexible")} />
                  Require exact match (off = flexible/contains match)
                </label>
                <details className="text-sm">
                  <summary className="cursor-pointer text-white/60">Excluded keywords (optional)</summary>
                  <div className="flex gap-2 mt-2">
                    <input className="input" value={excludedInput} onChange={(e) => setExcludedInput(e.target.value)} placeholder="e.g. spam" />
                    <button className="btn-secondary" onClick={addExcluded}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {excludedKeywords.map((k) => (
                      <span key={k} className="bg-red-500/10 text-red-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        {k} <button onClick={() => setExcludedKeywords(excludedKeywords.filter((x) => x !== k))}>✕</button>
                      </span>
                    ))}
                  </div>
                </details>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={allowEmojiOnly} onChange={(e) => setAllowEmojiOnly(e.target.checked)} />
                  Allow emoji-only comments to trigger
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={allowShortComments} onChange={(e) => setAllowShortComments(e.target.checked)} />
                  Allow very short comments (under 3 characters) to trigger
                </label>
                <p className="text-white/40 text-xs">Duplicate comments/events are automatically ignored.</p>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={replyEnabled} onChange={(e) => setReplyEnabled(e.target.checked)} />
              Enable public comment reply
            </label>
            {replyEnabled && (
              <>
                <div className="flex gap-2">
                  <input className="input" maxLength={300} value={replyInput} onChange={(e) => setReplyInput(e.target.value)} placeholder="Add a reply variation" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReply())} />
                  <button className="btn-secondary" onClick={addReply}>Add</button>
                </div>
                <p className="text-white/40 text-xs">One is picked at random each time, so replies look natural. Max length per Instagram's comment limit.</p>
                <ul className="flex flex-col gap-2">
                  {replies.map((r, i) => (
                    <li key={i} className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2 text-sm">
                      {r}
                      <button onClick={() => setReplies(replies.filter((_, idx) => idx !== i))} className="text-white/40">✕</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Delay before replying/sending DM</p>
            <div className="grid grid-cols-4 gap-2">
              {DELAY_OPTIONS.map((s) => (
                <button key={s} onClick={() => setDelaySeconds(s)} className={s === delaySeconds ? "btn-primary text-sm" : "btn-secondary text-sm"}>{s}s</button>
              ))}
            </div>
            <label className="text-sm text-white/60">Custom (1–30 seconds)</label>
            <input type="number" min={1} max={30} className="input" value={delaySeconds} onChange={(e) => setDelaySeconds(Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-white/60">Automation title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Tools PDF giveaway" />
            <label className="text-sm text-white/60">Description (optional)</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <label className="text-sm text-white/60">Resource type</label>
            <select className="input" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
              {["pdf", "website", "youtube", "tool", "course", "file", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-white/60">Resource URL</label>
            <input className="input" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://drive.google.com/... or https://yoursite.com/..." />
            <p className="text-white/40 text-xs">Paste a Google Drive link, website, YouTube link or direct file URL. If a provider blocks direct downloads, this is used as an external "open" link in the DM button instead.</p>
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-white/60">DM message</label>
            <textarea className="input" rows={5} maxLength={1000} value={dmContent} onChange={(e) => setDmContent(e.target.value)} />
            <p className="text-white/40 text-xs">{dmContent.length}/1000 · variables: {"{{first_name}}"} {"{{username}}"} {"{{automation_name}}"}</p>
            <label className="text-sm text-white/60">CTA button label</label>
            <input className="input" maxLength={30} value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} />
          </div>
        )}

        {step === 7 && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-white/50">When someone comments on:</p>
            <p className="font-medium">{postScope === "specific" ? (selectedPost?.caption ?? "Selected post") : postScope === "any" ? "Any post/reel" : "Next post/reel"}</p>
            <p className="text-white/50 mt-2">Trigger:</p>
            <p className="font-medium">{triggerType === "keywords" ? keywords.join(", ") || "(no keywords)" : "Any comment"}</p>
            <p className="text-white/50 mt-2">Then:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Wait {delaySeconds} second{delaySeconds > 1 ? "s" : ""}</li>
              {replyEnabled && <li>Public comment reply ({replies.length} variation{replies.length !== 1 ? "s" : ""})</li>}
              <li>Send primary DM</li>
              {buttonLabel && <li>Show CTA button: "{buttonLabel}"</li>}
            </ol>
            <div className="bg-bg border border-border rounded-xl p-3 mt-2">
              <p className="whitespace-pre-wrap">{dmContent}</p>
              {buttonLabel && <div className="mt-2 bg-accent/20 text-accent text-center rounded-lg py-2 text-sm">{buttonLabel}</div>}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 md:static bg-bg/95 backdrop-blur border-t border-border md:border-0 p-4 md:p-0 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {step > 0 && <button className="btn-secondary flex-1 md:flex-none" onClick={() => setStep(step - 1)}>Back</button>}
        {step < STEPS.length - 1 ? (
          <button className="btn-primary flex-1" disabled={!canProceed()} onClick={() => setStep(step + 1)}>Next</button>
        ) : (
          <button className="btn-primary flex-1" disabled={submitting} onClick={submit}>{submitting ? "Starting…" : "Confirm & Start Automation"}</button>
        )}
      </div>
    </div>
  );
}
