# AthleteOS Foundation

Mobile-first React/Vite app for Jack's offseason training.

## Features
- Today dashboard
- Coach Mode workout flow
- Workout checklist
- Throwing checklist
- Nutrition quick tracking
- Recovery logging
- Daily notes
- Saved local history
- Weight trend chart

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.

## Current storage
This version uses browser localStorage. It saves on the current device/browser only. Supabase login + cloud sync should be the next major backend upgrade.
