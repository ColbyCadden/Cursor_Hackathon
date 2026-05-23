# PrepDeck

**Simple cooking for busy students.**

Stage 1 prototype — meal prep and inventory app shell with fake login, sidebar navigation, sample data, and localStorage.

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

## Stage 1 scope

Built: app shell, routing, design system, fake auth, localStorage, sample data, placeholders.

Not yet: profile quiz, real inventory editing, barcode scanner, swipe UI, AI chat, full shopping logic.
