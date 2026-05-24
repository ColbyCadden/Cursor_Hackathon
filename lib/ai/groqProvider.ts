import Groq from "groq-sdk";
import {
  buildSystemPrompt,
  parseAIResponse,
  type AIResponse,
  type ChatApiMessage,
} from "@/lib/ai/chatHelpers";
import { trimRecentMessages } from "@/lib/ai/rateLimit";

const GROQ_MODEL_FALLBACKS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
] as const;

export async function generateWithGroq(
  apiKey: string,
  context: string,
  recentMessages: ChatApiMessage[],
  message: string
): Promise<AIResponse> {
  const client = new Groq({ apiKey });
  const systemContent = `${buildSystemPrompt()}\n\nCurrent student context:\n${context}`;
  const history = trimRecentMessages(recentMessages, message);

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const configuredModel = process.env.GROQ_MODEL?.trim();
  const modelsToTry = configuredModel
    ? [configuredModel, ...GROQ_MODEL_FALLBACKS.filter((m) => m !== configuredModel)]
    : [...GROQ_MODEL_FALLBACKS];

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content?.trim();
      const finishReason = completion.choices[0]?.finish_reason;
      if (!content) {
        throw new Error("Empty Groq response");
      }

      return {
        ...parseAIResponse(content, { truncated: finishReason === "length" }),
        source: "groq",
      };
    } catch (error) {
      lastError = error;
      console.warn(`[api/chat] Groq model ${modelName} failed:`, error);
    }
  }

  throw lastError ?? new Error("All Groq models failed");
}
