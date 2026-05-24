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
  /** How many meal-sized portions remain */
  portionsLeft: number;
  /** Keywords derived from product name — used to match meal ingredients */
  ingredientTags?: string[];
  expiryDate?: string;
  barcode?: string;
  source?: "manual" | "barcode";
}

export interface ScannedInventoryItem {
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
  portionsLeft: number;
  ingredientTags?: string[];
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

/** Grocery store aisle grouping for shopping mode */
export type GrocerySection =
  | "Produce"
  | "Meat & Seafood"
  | "Dairy & Eggs"
  | "Grains & Bread"
  | "Pantry"
  | "Frozen"
  | "Spices & Sauces"
  | "Snacks"
  | "Other";

export const GROCERY_SECTIONS: GrocerySection[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Grains & Bread",
  "Pantry",
  "Frozen",
  "Spices & Sauces",
  "Snacks",
  "Other",
];

export interface ShoppingListItem {
  id: string;
  name: string;
  /** Legacy — prefer amountNeeded */
  amount: string;
  /** Legacy — prefer unitNeeded */
  unit: string;
  category: ShoppingCategory;
  /** Store aisle for shopping mode UI */
  grocerySection?: GrocerySection;
  required: boolean;
  optional?: boolean;
  reason?: string;
  amountNeeded?: string;
  unitNeeded?: string;
  buyAmount?: string;
  buyUnit?: string;
  equivalentAmount?: string;
  equivalentUnit?: string;
  usedInRecipes?: string[];
  sourceMealIds?: string[];
  /** Waiting in cart for final "Add to inventory" confirmation */
  inCart?: boolean;
  boughtAmount?: string;
  boughtUnit?: string;
  boughtEquivalentAmount?: string;
  boughtEquivalentUnit?: string;
  bought: boolean;
  addedToInventory: boolean;
  /** Where this item came from — mealdex items are auto-synced from saved meals */
  source?: "manual" | "mealdex" | "ai";
  sourceMealId?: string;
}

export interface CartBoughtData {
  boughtAmount: string;
  boughtUnit: string;
  boughtEquivalentAmount?: string;
  boughtEquivalentUnit?: string;
}

/** AI or manual deduction of pantry stock after meal prep */
export interface InventoryUpdate {
  name: string;
  amountUsed: string;
  unit: string;
}

export type ChatRole = "user" | "assistant";

export interface SuggestedShoppingItem {
  name: string;
  /** Legacy — prefer amountNeeded */
  amount: string;
  /** Legacy — prefer unitNeeded */
  unit: string;
  category: ShoppingCategory;
  grocerySection?: GrocerySection;
  required: boolean;
  reason?: string;
  amountNeeded?: string;
  unitNeeded?: string;
  buyAmount?: string;
  buyUnit?: string;
  equivalentAmount?: string;
  equivalentUnit?: string;
  usedInRecipes?: string[];
  sourceMealIds?: string[];
  sourceMealId?: string;
  source?: "manual" | "mealdex" | "ai";
}

export interface IngredientSubstitution {
  original: string;
  substitute: string;
  core: boolean;
  note?: string;
}

export type AIActionType =
  | "add_to_shopping_list"
  | "add_multiple_to_shopping_list"
  | "use_substitute"
  | "remove_optional_ingredient"
  | "request_ai_revision"
  | "pick_alternative_meal"
  | "accept_meal_plan"
  | "save_generated_recipe";

export interface ChatAction {
  label: string;
  type: AIActionType;
  payload: Record<string, unknown>;
}

export interface AdaptedRecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  source?: "inventory" | "shopping-list" | "missing";
}

export interface AdaptedRecipe {
  title: string;
  /** Original title before core-ingredient substitution */
  originalTitle?: string;
  /** Display title — may include substitution note */
  displayTitle?: string;
  basedOnMealCardId?: string;
  servings?: number;
  tags?: string[];
  usesInventory?: string[];
  missingIngredients?: string[];
  ingredients?: AdaptedRecipeIngredient[];
  steps?: string[];
  substitutions?: IngredientSubstitution[];
  ingredientNotes?: string[];
}

export interface GeneratedMealPlan {
  selectedMealIds?: string[];
  recipes: AdaptedRecipe[];
  servings?: number;
  missingIngredients?: string[];
  userDecisions?: string[];
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** ISO timestamp */
  createdAt: string;
  suggestedItems?: SuggestedShoppingItem[];
  mealPrepSteps?: string[];
  inventoryUpdates?: InventoryUpdate[];
  /** True after user adds suggested items from this message */
  suggestedItemsAdded?: boolean;
  /** True after pantry stock was deducted from this prep plan */
  inventoryUpdatesApplied?: boolean;
  actions?: ChatAction[];
  /** Indices of actions the user already clicked */
  actionsApplied?: number[];
  recipes?: AdaptedRecipe[];
  warnings?: string[];
  needsUserChoice?: boolean;
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
  /** AI-generated meal plan / adapted recipes */
  generatedMealPlan?: GeneratedMealPlan | null;
}

/** @deprecated — migrated on load */
export interface LegacyAppState extends Omit<Partial<AppState>, "meals"> {
  mealLibrary?: MealCard[];
  swipeDeck?: MealCard[];
  swipeIndex?: number;
  meals?: Meal[] | MealCard[];
}
