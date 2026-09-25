import { describe, it, expect } from "vitest";
import { commentMatchesTrigger, normalize, isEmojiOnly } from "../services/keywordMatch.js";

describe("normalize", () => {
  it("trims and lowercases", () => {
    expect(normalize("  TOOL  ")).toBe("tool");
  });
});

describe("commentMatchesTrigger - keywords", () => {
  const base = {
    triggerType: "keywords" as const,
    matchMode: "flexible" as const,
    keywords: ["tool", "pdf", "guide"],
    excludedKeywords: [],
    allowEmojiOnly: false,
    allowShortComments: false,
  };

  it("matches case-insensitively", () => {
    expect(commentMatchesTrigger("TOOL please", base)).toBe(true);
  });
  it("matches with extra whitespace", () => {
    expect(commentMatchesTrigger("   pdf   ", base)).toBe(true);
  });
  it("does not match unrelated text", () => {
    expect(commentMatchesTrigger("nice reel!", base)).toBe(false);
  });
  it("exact mode requires full match", () => {
    expect(commentMatchesTrigger("tool please", { ...base, matchMode: "exact" })).toBe(false);
    expect(commentMatchesTrigger("tool", { ...base, matchMode: "exact" })).toBe(true);
  });
  it("respects excluded keywords", () => {
    expect(commentMatchesTrigger("tool but not interested", { ...base, excludedKeywords: ["not interested"] })).toBe(false);
  });
});

describe("commentMatchesTrigger - any_comment", () => {
  const base = {
    triggerType: "any_comment" as const,
    matchMode: "flexible" as const,
    keywords: [],
    excludedKeywords: [],
    allowEmojiOnly: false,
    allowShortComments: false,
  };
  it("blocks emoji-only by default", () => {
    expect(commentMatchesTrigger("🔥🔥", base)).toBe(false);
  });
  it("allows emoji-only when enabled", () => {
    expect(commentMatchesTrigger("🔥", { ...base, allowEmojiOnly: true })).toBe(true);
  });
  it("blocks very short comments by default", () => {
    expect(commentMatchesTrigger("ok", base)).toBe(false);
  });
});

describe("isEmojiOnly", () => {
  it("detects emoji-only strings", () => {
    expect(isEmojiOnly("🔥🚀")).toBe(true);
    expect(isEmojiOnly("nice 🔥")).toBe(false);
  });
});
