// Local/mock data so the UI and automation logic can be built and demoed
// without real Instagram credentials or App Review approval. Disabled
// entirely when MOCK_MODE=false.

export function mockProfile() {
  return {
    user_id: "17841400000000000",
    username: "lexon_demo",
    profile_picture_url: "https://placehold.co/128x128/121212/8b5cf6?text=LX",
  };
}

export function mockMedia() {
  return [
    {
      id: "18000000000000001",
      caption: "New AI tools drop this week 🔥 comment TOOL for the free PDF",
      media_type: "REEL",
      thumbnail_url: "https://placehold.co/400x500/1a1a1a/8b5cf6?text=Reel+1",
      permalink: "https://instagram.com/reel/mock1",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "18000000000000002",
      caption: "Behind the scenes building LEXON",
      media_type: "IMAGE",
      thumbnail_url: "https://placehold.co/400x500/1a1a1a/8b5cf6?text=Post+2",
      permalink: "https://instagram.com/p/mock2",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];
}

export function mockCommentEvent(automationPostId: string, commentText: string) {
  return {
    field: "comments",
    value: {
      id: `mock-comment-${Date.now()}`,
      text: commentText,
      media: { id: automationPostId },
      from: { id: `mock-user-${Math.floor(Math.random() * 10000)}`, username: "mock_commenter" },
    },
  };
}
