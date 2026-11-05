# Diwali Lucky Wheel 🪔

Next.js (App Router) game for Vercel.

## How the game works
1. Organiser opens `/admin`, adds player names and gets one personal link per player (`/?p=...`).
2. Player opens their link and plays **10 rounds** of "Tap the Diya" (rounds, tap time are editable).
3. They must win **at least 8** rounds. If not: "Better luck next time".
4. If they pass, the **Lucky Wheel** unlocks. The server picks the gift by luck (weights) and the wheel lands on it.
5. Each link works **one time only**. Once started, it cannot be opened again, even in another browser.
   Admin can press **Reset** to give a player one more chance.

Admin can change game name, rounds, minimum wins, tap time, gift names and luck. Changes apply instantly.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000/admin (local password: `diwali123`). Local mode uses temporary in-memory storage.

## Deploy on Vercel
1. Push to GitHub and import the repo in Vercel.
2. In the Vercel project: **Storage > Create / Connect Database > Upstash Redis** (free plan is enough).
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL/TOKEN`) automatically.
3. **Settings > Environment Variables**: add `ADMIN_PASSWORD` with your own password.
4. Redeploy. Open `https://your-app.vercel.app/admin`.

## Notes
- The luck result is decided on the server, so players cannot change it.
- The round win count is reported by the player's browser. A technical person could fake it with developer tools.
  Fine for a friendly Diwali event; for prizes of real value, keep someone supervising.
- If a player closes the page in the middle of a game, the link is already used. Use Reset in admin.
