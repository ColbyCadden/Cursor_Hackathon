export const COOKING_EQUIPMENT: Record<string, string> = {
  oven: "Oven",
  stovetop: "Stovetop / hob",
  microwave: "Microwave",
  air_fryer: "Air fryer",
  slow_cooker: "Slow cooker",
  blender: "Blender",
  rice_cooker: "Rice cooker",
  kettle: "Electric kettle",
  toaster: "Toaster",
  grill: "Grill / sandwich press",
};

export const EATING_HABITS: Record<string, string> = {
  lots_meat: "Lots of meat — meat most days",
  minimal_meat: "Minimal meat — meat occasionally",
  no_meat: "No meat — vegetarian / plant-based",
};

export const COOKING_TIME_PER_WEEK: Record<string, string> = {
  under_3h: "Under 3 hours",
  "3_6h": "3–6 hours",
  "6_10h": "6–10 hours",
  over_10h: "More than 10 hours",
};

export const COOKING_SKILL: Record<string, string> = {
  beginner: "Beginner — basics & simple meals",
  intermediate: "Intermediate — comfortable following recipes",
  confident: "Confident — happy improvising",
};

export const INGREDIENT_PREFERENCE: Record<string, string> = {
  minimal: "Minimal — fewer ingredients per recipe",
  balanced: "Balanced — mix of simple and fuller recipes",
  lots: "Lots — don't mind longer ingredient lists",
};

export const SIGNUP_STEPS = [
  { path: "/signup/account", label: "Account" },
  { path: "/signup/equipment", label: "Equipment" },
  { path: "/signup/diet", label: "Diet" },
  { path: "/signup/time", label: "Time" },
  { path: "/signup/skill", label: "Skill" },
  { path: "/signup/ingredients", label: "Recipes" },
] as const;
