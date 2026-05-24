# PrepDeck

**Swipe meals. Save to Mealdex. Shop smarter.**

One unified Next.js app — demo login, Pokémon-style meal cards (Mealdex), kitchen tools, and AI chat.

## Run

```bash
npm install
npm run dev
```

Open the **Local** URL from the terminal (e.g. `http://localhost:3000`). **Continue as demo user** → lands on **Discover**.

## Flow

1. **Login** — demo sign-in (localStorage)
2. **Discover** — swipe meals; save to **Mealdex** (right) or skip (left)
3. **Go to Home** — profile, inventory, barcode scanner
4. **Shop** — ingredients auto-merged from saved Mealdex meals only
5. **Chat** — AI meal planner using inventory + Mealdex

## Routes

| Route | Description |
|-------|-------------|
| `/login` | PrepDeck sign-in |
| `/discover` | Swipe deck (first screen after login) |
| `/mealdex` | Saved meal cards |
| `/create` | Add custom meal cards |
| `/shopping-list` | Mealdex ingredient checklist |
| `/dashboard` | Home — profile, inventory, barcode |
| `/chat` | AI meal planner |

## Phone

Bottom tabs: **Discover · Mealdex · Shop · Chat · Home**

## Tech

Next.js · TypeScript · Tailwind · localStorage

## Colors

Beige `#F5F0E8`, salmon `#E8A598`, green `#7BAE7F`, surface `#FFFBF7`
