import { NextResponse } from "next/server";
import { buildChatContext, type ChatRequestBody } from "@/lib/ai/chatHelpers";
import { generateWithGemini } from "@/lib/ai/geminiProvider";
import { generateWithGroq } from "@/lib/ai/groqProvider";
import { isQuotaError } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (!geminiKey && !groqKey) {
    return NextResponse.json(
      { error: "No AI provider configured (set GEMINI_API_KEY and/or GROQ_API_KEY)" },
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const context = buildChatContext(body);
  const recentMessages = body.recentMessages ?? [];
  const errors: string[] = [];

  if (geminiKey) {
    try {
      const response = await generateWithGemini(geminiKey, context, recentMessages, message);
      return NextResponse.json(response);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`Gemini: ${detail}`);
      console.warn("[api/chat] Gemini failed:", error);
    }
  }

  if (groqKey) {
    try {
      const response = await generateWithGroq(groqKey, context, recentMessages, message);
      return NextResponse.json(response);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      errors.push(`Groq: ${detail}`);
      console.error("[api/chat] Groq failed:", error);
    }
  }

  const combined = errors.join("; ");
  const quotaHit = errors.some((entry) => isQuotaError(new Error(entry)));

  if (quotaHit) {
    return NextResponse.json(
      {
        error: "insufficient_quota",
        message:
          "Both Gemini and Groq free tier limits were hit. Wait a minute or use demo replies.",
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: "Failed to generate response", details: combined || undefined },
    { status: 502 }
  );
}
