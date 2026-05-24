export type CookingSkill = "Beginner" | "Intermediate" | "Advanced";

export interface UserProfile {
  name: string;
  email?: string;
  studentType: string;
  /** Signup onboarding fields */
  cooking_equipment?: string[];
  eating_habits?: string;
  cooking_time_per_week?: string;
  cooking_skill_level?: string;
  ingredient_preference?: string;
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

export type RatingLevel = 1 | 2 | 3 | 4 | 5;

/** Pokémon-style meal card (Mealdex) */
export interface Meal {
  id: string;
  name: string;
  imageUri: string;
  difficulty: RatingLevel;
  price: RatingLevel;
  highProtein: boolean;
  highVegetables: boolean;
  ingredients: string[];
  /** Equipment keys from signupConstants — empty means no special gear needed */
  requiredEquipment?: string[];
  /** True when the recipe includes meat, poultry, or fish */
  containsMeat?: boolean;
  /** Rough active cooking time for soft ranking */
  estimatedMinutes?: number;
  isCustom?: boolean;
}

export interface MergedMealIngredient {
  name: string;
  count: number;
  mealNames: string[];
}

/** @deprecated Legacy swipe card — migrated to Meal on load */
export type MealDifficulty = "Easy" | "Medium" | "Hard";

/** @deprecated */
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
  /** Full catalog: seed meals + user-created cards */
  meals: Meal[];
  /** Each meal id can only be swiped once (left or right) */
  swipedMealIds: string[];
  /** Right-swiped meals (Mealdex collection) */
  savedMealIds: string[];
  shoppingList: ShoppingListItem[];
  chatMessages: ChatMessage[];
}

/** @deprecated — migrated on load */
export interface LegacyAppState extends Omit<Partial<AppState>, "meals"> {
  mealLibrary?: MealCard[];
  swipeDeck?: MealCard[];
  swipeIndex?: number;
  meals?: Meal[] | MealCard[];
}
