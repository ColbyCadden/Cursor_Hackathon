import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/ai/geminiProvider";
import { generateWithGroq } from "@/lib/ai/groqProvider";
import { createInitialAppState } from "@/lib/demoData";
import { getLocalSubstituteSuggestions } from "@/lib/shoppingStateActions";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

interface SubstitutesRequestBody {
  ingredientName: string;
  usedInRecipes?: string[];
  profile?: AppState["profile"];
  inventory?: AppState["inventory"];
}

export async function POST(request: Request) {
  let body: SubstitutesRequestBody;
  try {
    body = (await request.json()) as SubstitutesRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ingredientName = body.ingredientName?.trim();
  if (!ingredientName) {
    return NextResponse.json({ error: "ingredientName is required" }, { status: 400 });
  }

  const profile = body.profile ?? createInitialAppState().profile;
  const inventory = body.inventory ?? [];
  const local = getLocalSubstituteSuggestions(ingredientName, inventory, profile);

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (!geminiKey && !groqKey) {
    return NextResponse.json({ substitutes: local, source: "local" });
  }

  const recipeLine = body.usedInRecipes?.length
    ? `Used in: ${body.usedInRecipes.join(", ")}.`
    : "";
  const prompt = `Suggest 2-4 grocery substitutes for "${ingredientName}" in meal prep. ${recipeLine}
Profile: simplicity=${profile.simplicityPreference}, avoid=${(profile.avoidedFoods ?? []).join(", ") || "none"}.
Return ONLY a JSON array of strings, e.g. ["pork","turkey"]. Match the ingredient role — no random swaps.`;

  const context = "You are a meal prep assistant. Return valid JSON only.";

  try {
    if (geminiKey) {
      const response = await generateWithGemini(geminiKey, context, [], prompt);
      const parsed = JSON.parse(
        response.text.match(/\[[\s\S]*\]/)?.[0] ?? "[]"
      ) as string[];
      if (Array.isArray(parsed) && parsed.length) {
        return NextResponse.json({
          substitutes: parsed.slice(0, 4),
          source: "ai",
        });
      }
    }
  } catch {
    /* fall through */
  }

  try {
    if (groqKey) {
      const response = await generateWithGroq(groqKey, context, [], prompt);
      const parsed = JSON.parse(
        response.text.match(/\[[\s\S]*\]/)?.[0] ?? "[]"
      ) as string[];
      if (Array.isArray(parsed) && parsed.length) {
        return NextResponse.json({
          substitutes: parsed.slice(0, 4),
          source: "ai",
        });
      }
    }
  } catch {
    /* fall through */
  }

  return NextResponse.json({ substitutes: local, source: "local" });
}
