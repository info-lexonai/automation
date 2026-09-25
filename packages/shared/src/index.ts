// Shared types used by both frontend (apps/web) and backend (apps/server).
// Keeping these in one place avoids the UI and API drifting apart.

export type AutomationStatus = "active" | "paused" | "draft";

export type TriggerMode = "keywords" | "any_comment";

export type ResourceType =
  | "pdf"
  | "website"
  | "youtube"
  | "tool"
  | "course"
  | "file"
  | "other";

export interface InstagramAccount {
  id: string;
  username: string;
  profileImageUrl: string | null;
  status: "connected" | "expired" | "disconnected";
  connectedAt: string;
}

export interface InstagramPost {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL";
  thumbnailUrl: string;
  caption: string;
  timestamp: string;
  permalink: string;
}

export interface CommentReplyVariant {
  id: string;
  text: string;
  enabled: boolean;
}

export interface AutomationInput {
  title: string;
  description?: string;
  resourceType: ResourceType;
  postId: string | null; // null when "any post" mode
  postMode: "specific" | "any" | "next";
  triggerMode: TriggerMode;
  keywords: string[];
  excludedKeywords: string[];
  matchType: "exact" | "flexible";
  anyCommentAllowEmojiOnly: boolean;
  anyCommentAllowShort: boolean;
  publicReplyEnabled: boolean;
  publicReplyVariants: CommentReplyVariant[];
  publicReplyRandom: boolean;
  delaySeconds: number;
  dmMessage: string;
  ctaButtonLabel: string;
  ctaButtonUrl: string;
  resourceUploadFileName?: string | null;
  resourceUrl?: string | null;
}

export interface Automation extends AutomationInput {
  id: string;
  status: AutomationStatus;
  createdAt: string;
  updatedAt: string;
  stats: AutomationStats;
}

export interface AutomationStats {
  commentsTriggered: number;
  dmsSent: number;
  repliesSent: number;
  buttonClicks: number | null;
}

export interface AutomationEvent {
  id: string;
  automationId: string;
  eventType: "comment_matched" | "reply_sent" | "dm_sent" | "error";
  status: "success" | "failed" | "pending";
  message: string;
  createdAt: string;
}

export const DELAY_PRESETS = [1, 2, 3, 5, 10, 15, 20, 30] as const;
