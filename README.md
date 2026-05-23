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

## Not yet (later stages)

AI chat, full shopping list logic, real barcode hardware API.
