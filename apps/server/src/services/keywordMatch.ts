export function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const EMOJI_ONLY_RE = /^(\p{Extended_Pictographic}|\s)+$/u;

export function isEmojiOnly(text: string): boolean {
  return EMOJI_ONLY_RE.test(text.trim());
}

export interface TriggerConfig {
  triggerType: "keywords" | "any_comment";
  matchMode: "exact" | "flexible";
  keywords: string[];
  excludedKeywords: string[];
  allowEmojiOnly: boolean;
  allowShortComments: boolean; // comments under ~3 chars
}

export function commentMatchesTrigger(commentText: string, cfg: TriggerConfig): boolean {
  const normalizedComment = normalize(commentText);
  if (!normalizedComment) return false;

  const excluded = cfg.excludedKeywords.map(normalize);
  if (excluded.some((k) => normalizedComment.includes(k))) return false;

  if (cfg.triggerType === "any_comment") {
    if (isEmojiOnly(commentText) && !cfg.allowEmojiOnly) return false;
    if (normalizedComment.length < 3 && !cfg.allowShortComments) return false;
    return true;
  }

  const keywords = [...new Set(cfg.keywords.map(normalize))].filter(Boolean);
  if (keywords.length === 0) return false;

  if (cfg.matchMode === "exact") {
    return keywords.includes(normalizedComment);
  }
  // flexible: word-boundary substring match, case-insensitive, whitespace-trimmed
  return keywords.some((k) => normalizedComment.includes(k));
}
