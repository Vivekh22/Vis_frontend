# VispriscaAds — Frontend

Pure client-side frontend for the VispriscaAds programmatic advertising DSP
platform. Built with **native Web Components** (Custom Elements v1, Shadow DOM)
and **strict TypeScript**. No UI framework. No backend — all data flows through
`repositories/ApiClient.ts` and `repositories/mocks/`, so the app runs and is
reviewable entirely standalone.

## Stack

- TypeScript (strict) — no `.js` files in `src/`.
- Native Web Components — no React/Vue/Angular/Svelte.
- Vite as a build tool only (no framework plugin).
- Vitest + happy-dom for unit tests.

## Getting started

```bash
npm install
npm run dev        # start Vite dev server
npm test           # run unit tests once
npm run typecheck  # strict type check
npm run build      # type-check + production build to dist/
```

## Architecture

- `src/platform/` — the hand-built framework core: safe rendering, component
  base, state stores, and the SPA router. Every page and component depends on it.
- `src/styles/` — design tokens and theme (Light/Dark/System).
- `src/security/` — token storage, route guards, CSP, permission guards.
- `src/core/`, `src/services/`, `src/repositories/`, `src/components/`,
  `src/layouts/`, `src/pages/` — built incrementally in later parts.

## Security principles

- All dynamic rendering goes through `platform/rendering/SafeHtml.ts`.
- Auth tokens never touch raw `localStorage`/`sessionStorage` (see
  `security/TokenStorage.ts`).
- Every route and gated UI element goes through `security/RouteGuard` /
  `security/PermissionGuard` — no ad-hoc role checks.
- All external input is validated/sanitized before use.