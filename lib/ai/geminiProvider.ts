import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildSystemPrompt,
  parseAIResponse,
  type AIResponse,
  type ChatApiMessage,
} from "@/lib/ai/chatHelpers";
import { trimRecentMessages } from "@/lib/ai/rateLimit";

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
] as const;

function buildGeminiHistory(recentMessages: ChatApiMessage[], currentMessage: string) {
  return trimRecentMessages(recentMessages, currentMessage).map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));
}

async function generateWithGeminiModel(
  apiKey: string,
  modelName: string,
  context: string,
  history: ReturnType<typeof buildGeminiHistory>,
  message: string
): Promise<AIResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `${buildSystemPrompt()}\n\nCurrent student context:\n${context}`,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(message);
  const response = result.response;
  const content = response.text()?.trim();
  const finishReason = response.candidates?.[0]?.finishReason;

  if (!content) {
    throw new Error("Empty Gemini response");
  }

  const parsed = parseAIResponse(content, {
    truncated: finishReason === "MAX_TOKENS",
  });
  return { ...parsed, source: "gemini" };
}

export async function generateWithGemini(
  apiKey: string,
  context: string,
  recentMessages: ChatApiMessage[],
  message: string
): Promise<AIResponse> {
  const history = buildGeminiHistory(recentMessages, message);
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = configuredModel
    ? [configuredModel, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== configuredModel)]
    : [...GEMINI_MODEL_FALLBACKS];

  let lastError: unknown;

  for (const modelName of modelsToTry) {
    try {
      return await generateWithGeminiModel(apiKey, modelName, context, history, message);
    } catch (error) {
      lastError = error;
      console.warn(`[api/chat] Gemini model ${modelName} failed:`, error);
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}
