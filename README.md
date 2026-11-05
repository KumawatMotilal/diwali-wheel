# Diwali Lucky Wheel 🪔

Next.js (App Router) game. Players spin a wheel and win one gift based on luck.

## How it works
- **Editor page (`/`)**: change the game name, add/remove gifts, set a "luck" number for each gift.
  Chance of a gift = its luck / total luck. Settings are saved in your browser.
- **Player link**: click "Copy player link". The link (`/?g=...`) carries the game name and gifts,
  so no database is needed. Players only see the wheel and the SPIN button.
- **One spin per player**: optional, stored per device in localStorage.
- The winner is chosen first with crypto random (weighted), then the wheel animates to land on it.

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to GitHub.
2. Vercel > Add New Project > import the repo > Deploy (no settings needed).

Or with CLI: `npx vercel --prod`

## Note
"One spin per device" can be bypassed by clearing browser data or using another browser.
For strict control at a real event, keep a person at the stall or add a backend with a code per player.
<<<<<<< HEAD
# diwali-wheel
=======
>>>>>>> cd1728ce96b2f946a9c33d62c930654e445f0044
