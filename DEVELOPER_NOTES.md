# PrepDeck — Developer Notes

Hackathon prototype for student meal prep, inventory, Mealdex swipe cards, mock AI chat, and shopping lists. All data lives in **localStorage** until backend work lands.

## Run the app

```bash
npm install
npm run dev
```

On Windows PowerShell if scripts are blocked:

```powershell
npm.cmd run dev
```

Open the Local URL from the terminal (e.g. `http://localhost:3000`).

**Quick demo:** Login → **Continue as demo user** → Discover → swipe → Chat → Shopping.

## Main routes

| Route | Purpose |
|-------|---------|
| `/login` | Demo + email login (prototype) |
| `/signup/*` | Onboarding quiz (optional) |
| `/discover` | Swipe meal cards |
| `/mealdex` | Saved meal collection |
| `/dashboard` | Home — profile, inventory, barcode demo |
| `/chat` | Mock AI meal planner |
| `/shopping-list` | Mealdex ingredients + manual/AI shopping list |
| `/create` | Add custom meal cards |
| `/profile` | Edit profile |

## Prototype storage

- Key: `prepdeck-app-state` in **localStorage**
- Helpers: `lib/storage.ts`, `lib/demoData.ts`
- **Reset demo data:** sidebar → Demo tools → Reset demo data (keeps login)
- **Full wipe:** landing page or old login reset link → clears everything

## Key files

| Area | Files |
|------|-------|
| Types | `lib/types.ts` |
| Storage / auth | `lib/storage.ts`, `lib/auth.ts`, `lib/demoData.ts` |
| App state hook | `lib/useAppState.ts` |
| Mock AI | `lib/mockAI.ts` |
| Barcode / inventory | `lib/inventoryBarcode.ts`, `components/BarcodeScannerPanel.tsx`, `components/InventoryManager.tsx` |
| Shopping list | `lib/shoppingListHelpers.ts`, `lib/addBoughtToInventory.ts`, `components/ShoppingListManager.tsx` |
| Mealdex | `lib/meal/mealHelpers.ts`, `lib/meal/seedMeals.ts`, `lib/meal/shoppingList.ts`, `components/mealdex/*` |
| Dashboard | `app/dashboard/page.tsx`, `components/OverviewCard.tsx`, `components/SectionCard.tsx` |
| Chat | `app/chat/page.tsx`, `components/ChatInterface.tsx`, `components/ChatMessageBubble.tsx` |
| Shell / nav | `components/AppShell.tsx`, `components/Sidebar.tsx`, `components/MobileTabBar.tsx` |
| Demo reset | `components/DemoResetButton.tsx` |

## Future integration

### AI API

Real AI runs through **`POST /api/chat`** (Google Gemini + Groq free tiers). The client calls `generateAIResponse` in `lib/mockAI.ts`, which tries the API first and falls back to mock logic if keys are missing.

1. Copy `.env.example` → `.env.local` and set `GEMINI_API_KEY` and/or `GROQ_API_KEY`.
2. On Vercel: Project → Settings → Environment Variables → add both keys.
3. Redeploy.

Return shape (unchanged for UI):

```ts
interface AIResponse {
  text: string;
  suggestedItems?: SuggestedShoppingItem[];
  mealPrepSteps?: string[];
}
```

`ChatInterface` merges `suggestedItems` into `shoppingList` via `lib/shoppingListHelpers.ts`.

Key files: `app/api/chat/route.ts`, `lib/ai/chatHelpers.ts`, `lib/mockAI.ts`.

### Barcode scanner

Real scanner code should call the existing handler in `BarcodeScannerPanel.tsx` (`handleScan`) with:

```ts
{ name, amount, unit, category, percentLeft }
```

Duplicate detection and merge/create-separate flows are in `lib/inventoryBarcode.ts`.

### Backend / auth

Replace fake login (`loginDemoUser`, `loginWithCredentials`) and localStorage profile with real signup/login endpoints. Signup flow lives under `app/signup/*` and `lib/signupSession.ts`.

### Database

Move from localStorage to a DB:

- User profile
- Inventory
- Meals / Mealdex (swiped + saved IDs)
- Chat messages
- Shopping list

`AppState` in `lib/types.ts` is the schema to mirror on the server.

## Demo walkthrough

1. Login as demo user
2. Dashboard: review profile & inventory
3. Add/edit an inventory item
4. Barcode panel: run a demo scan → confirm duplicate flow
5. Discover: swipe right to save a meal
6. Chat: ask *"I need to meal prep 8 meals."*
7. Tap **Add suggested items to shopping list**
8. Shopping list: check items as bought
9. **Add bought items to inventory**
10. Dashboard: verify inventory updated
11. Refresh — data persists
12. Resize to phone width — bottom tabs + sidebar drawer

## Build

```bash
npm run build   # production check
npm run lint    # ESLint
```
