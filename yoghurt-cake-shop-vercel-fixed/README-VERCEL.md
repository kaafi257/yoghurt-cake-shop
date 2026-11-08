# Yoghurt & Cake Shop Manager — Vercel deployment

This project is a Vite + React + TypeScript app. Keep the directory structure intact.

## Important structure
- `index.html`
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/lib/`
- `src/pages/`
- `public/`

## Vercel settings
- Framework preset: Vite
- Root directory: `./`
- Install command: `bun install` (if Vercel detects Bun from `bun.lock`), otherwise `npm install`
- Build command: `bun run build` (or `npm run build`)
- Output directory: `dist`

## Environment variables
If using Supabase, add these in Vercel → Project → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use values from your Supabase project settings. Do not add a service-role key to frontend variables.
If the app uses any other secrets, do not put private keys in client-side `VITE_` variables.

## GitHub upload note
Upload the contents of this ZIP while preserving folders. Do not upload only the individual files from `src/` into the repository root. GitHub should show `src` as a folder and `public` as a folder at the repository root.
