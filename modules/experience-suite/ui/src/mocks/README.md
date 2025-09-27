# MSW (Mock Service Worker) Harness

Usage:
1) `npm i -D msw`
2) `npx msw init public --save`
3) Use `main.dev.tsx` instead of your normal entry during local dev:
   - Vite: set `entry: ui/src/main.dev.tsx` or alias `main.tsx` → `main.dev.tsx`
4) Handlers live in `ui/src/mocks/handlers.ts`.
