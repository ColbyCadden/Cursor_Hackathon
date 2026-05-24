# PrepDeck

**Simple cooking for busy people.**

Swipe meals into your Mealdex, track pantry inventory, plan with mock AI, and shop smarter — all in one Next.js prototype.

## Run

```bash
npm install
npm run dev
```

PowerShell (if scripts blocked): `npm.cmd run dev`

Open the Local URL (e.g. `http://localhost:3000`). Hit **Continue as demo user** for the fastest demo.

See **[DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md)** for file map, integration TODOs, and demo script.

## Demo flow

1. **Login** — demo user (localStorage, no real backend)
2. **Discover** — swipe meals; save to **Mealdex** (right) or skip (left)
3. **Home** — profile, inventory, barcode demo scans
4. **Chat** — mock AI meal planner; add suggested items to shopping list
5. **Shop** — Mealdex ingredients + manual list; mark bought → add to inventory

Use **Reset demo data** in the sidebar between demos.

## Routes

| Route | Description |
|-------|-------------|
| `/login` | PrepDeck sign-in |
| `/discover` | Swipe deck |
| `/mealdex` | Saved meal cards |
| `/dashboard` | Home — profile, inventory, barcode |
| `/chat` | AI meal planner (mocked) |
| `/shopping-list` | Mealdex + shopping list workflow |
| `/create` | Custom meal cards |

## Phone

Bottom tabs: **Discover · Mealdex · Shop · Chat · Home**

## Tech

Next.js 15 · TypeScript · Tailwind · localStorage · Framer Motion (swipe)

## Design

Cream `#F5F0E8`, salmon `#E8A598`, green `#7BAE7F`, surface `#FFFBF7`
