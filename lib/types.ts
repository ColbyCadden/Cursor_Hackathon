export type CookingSkill = "Beginner" | "Intermediate" | "Advanced";

export interface UserProfile {
  name: string;
  email?: string;
  studentType: string;
  /** Calum signup fields — source of truth for personalization */
  cooking_equipment?: string[];
  eating_habits?: string;
  cooking_time_per_week?: string;
  cooking_skill_level?: string;
  ingredient_preference?: string;
  /** Legacy fields kept for meal/chat features */
  appliances: string[];
  avoidedFoods: string[];
  eatingGoals: string[];
  cookingSkill: string;
  availableTime: string;
  simplicityPreference: string;
  profileComplete: boolean;
}

export type InventoryCategory =
  | "Protein"
  | "Carbs"
  | "Produce"
  | "Fruit"
  | "Dairy"
  | "Snacks"
  | "Sauces/Spices"
  | "Frozen"
  | "Other";

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  "Protein",
  "Carbs",
  "Produce",
  "Fruit",
  "Dairy",
  "Snacks",
  "Sauces/Spices",
  "Frozen",
  "Other",
];

export interface InventoryItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
  percentLeft: number;
}

export interface ScannedInventoryItem {
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
  percentLeft: number;
}

export type MealDifficulty = "Easy" | "Medium" | "Hard";

export interface MealCard {
  id: string;
  name: string;
  tags: string[];
  estimatedTime: string;
  difficulty: MealDifficulty;
  mainIngredients: string[];
  requiredAppliance: string;
  nutritionEstimate: string;
  saved?: boolean;
}

export type ShoppingCategory = InventoryCategory;

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [...INVENTORY_CATEGORIES];

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: ShoppingCategory;
  required: boolean;
  bought: boolean;
  addedToInventory: boolean;
}

export type ChatRole = "user" | "assistant";

export interface SuggestedShoppingItem {
  name: string;
  amount: string;
  unit: string;
  category: ShoppingCategory;
  required: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** ISO timestamp */
  createdAt: string;
  suggestedItems?: SuggestedShoppingItem[];
  mealPrepSteps?: string[];
  /** True after user adds suggested items from this message */
  suggestedItemsAdded?: boolean;
}

export interface AppState {
  isLoggedIn: boolean;
  profile: UserProfile;
  inventory: InventoryItem[];
  mealLibrary: MealCard[];
  swipeDeck: MealCard[];
  swipeIndex: number;
  shoppingList: ShoppingListItem[];
  chatMessages: ChatMessage[];
}

/** @deprecated Stage 1 field — migrated to mealLibrary */
export interface LegacyAppState extends AppState {
  meals?: MealCard[];
}
