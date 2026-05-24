export function isQuotaError(error: unknown): boolean {
  const messageText = error instanceof Error ? error.message : String(error);
  return (
    messageText.includes("429") ||
    messageText.includes("RESOURCE_EXHAUSTED") ||
    messageText.toLowerCase().includes("rate limit") ||
    messageText.toLowerCase().includes("quota")
  );
}

export function trimRecentMessages(
  recentMessages: { role: "user" | "assistant"; content: string }[],
  currentMessage: string
) {
  const trimmed = recentMessages.slice(-8);
  if (
    trimmed.length > 0 &&
    trimmed[trimmed.length - 1].role === "user" &&
    trimmed[trimmed.length - 1].content === currentMessage
  ) {
    trimmed.pop();
  }
  return trimmed;
}
