# Diwali Lucky Wheel 🪔

Next.js (App Router) game for Vercel.

## How the game works
1. Organiser opens `/admin`, adds player names and gets one personal link per player (`/?p=...`).
2. Player opens their link and plays **10 timed rounds**, mixed at random:
   - **Quiz** (about half): Bollywood, Gujarat, India history, politics, Diwali and festivals, sports, general knowledge. 100 questions included.
   - **Quick Math**: mental sums, with precedence traps like `12 + 5 × 4`.
   - **Tap the Diya**: several tiles light up, only the real diya counts, the others are decoys.
3. They must win **at least 8** rounds. If not: "Better luck next time". Quiz and math answers show "locked in" and the score is revealed at the end.
4. If they pass, the **Lucky Wheel** unlocks. The server picks the gift by luck (weights) and the wheel lands on it.
5. Each link works **one time only**. Once started, it cannot be opened again, even in another browser.
   Admin can press **Reset** to give a player one more chance (new random questions).

Admin can change game name, rounds, minimum wins, tap / quiz / math time, which round types and quiz categories are used,
add / edit / delete quiz questions (mark the correct option with the green dot), gift names and luck. Changes apply instantly.

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
- Quiz and math answers are **graded on the server**. The correct answers are never sent to the browser (not in the page code, not in the API responses).
  The browser only sends back what the player picked.
- The server also rejects impossibly fast submissions (under about 0.9 s per round).
- Tap the Diya is the one thing the browser must be able to see (the real diya is on screen), so a very determined person with
  developer tools could script it. Quiz and math cannot be scripted that way. Fine for a friendly Diwali event; for prizes of real value, keep someone supervising.
- Questions are stored with the game settings. Saved settings from the older version keep working and get the new question bank automatically.
- If a player closes the page in the middle of a game, the link is already used. Use Reset in admin.
