export type CookingSkill = "Beginner" | "Intermediate" | "Advanced";

export type SimplicityPreference =
  | "Simple meals with fewer ingredients"
  | "Balanced variety"
  | "More complex recipes";

export interface UserProfile {
  name: string;
  studentType: string;
  appliances: string[];
  avoidedFoods: string[];
  eatingGoals: string[];
  cookingSkill: CookingSkill;
  availableTime: string;
  simplicityPreference: SimplicityPreference;
}

export type InventoryCategory = "Protein" | "Carbs" | "Produce" | "Dairy" | "Other";

export interface InventoryItem {
  id: string;
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
  saved: boolean;
}

export type ShoppingCategory = "Protein" | "Carbs" | "Produce" | "Dairy" | "Other";

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

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface AppState {
  isLoggedIn: boolean;
  profile: UserProfile;
  inventory: InventoryItem[];
  meals: MealCard[];
  shoppingList: ShoppingListItem[];
  chatMessages: ChatMessage[];
}
