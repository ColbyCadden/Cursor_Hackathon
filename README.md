# PrepDeck

**Simple cooking for busy students.**

Student meal prep prototype — Stage 1 shell + Stage 2 working dashboard features.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- localStorage (no backend yet)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Continue as demo user** or **Sign in** to enter the app.

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Fake login / welcome |
| `/dashboard` | Overview and feature placeholders |
| `/chat` | AI meal planner placeholder |
| `/shopping-list` | Sample shopping checklist |

## Project structure

```
app/
  login/page.tsx
  dashboard/page.tsx
  chat/page.tsx
  shopping-list/page.tsx
components/
  AppShell.tsx, Sidebar.tsx, ...
lib/
  types.ts, demoData.ts, storage.ts
```

## Stage 2 dashboard

- **Profile quiz** — 5-step setup with edit/summary mode, saved to localStorage
- **Inventory** — add, edit, delete, search, percent-left bars
- **Barcode-ready flow** — `evaluateBarcodeScan()` + test scan buttons; plug real scanner into `handleScan()` in `BarcodeScannerPanel`
- **Meal swipe deck** — 12 meal ideas, Save/Skip, library persistence
- **Meal library** — view and remove saved ideas

## Stage 3 AI chat

- **Mock AI meal planner** at `/chat` — uses profile, inventory, and meal library
- **`generateAIResponse()`** in `lib/mockAI.ts` — swap for a real API later
- **Chat persistence** in localStorage with Clear chat
- **Add suggested items to shopping list** from AI responses

## Not yet (later stages)

Real AI API, full shopping list editing, barcode hardware.
