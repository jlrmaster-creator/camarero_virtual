# AGENTS.md — CamareroVirtual

## Project Overview

Bar/restaurant table management PWA. React + Vite + TypeScript frontend, Firebase (Firestore + Auth). Optimized for mobile, works on tablet/desktop.

---

## Build / Lint / Test Commands

### Root
```bash
npm install              # Install all dependencies
npm run dev              # Start Vite dev server
npm run build            # Build client for production
npm run lint             # Lint client
npm run typecheck        # Run TypeScript type checking
npm run test             # Run all tests
npm run clean            # Remove node_modules and dist
```

### Client
```bash
cd client
npm run dev              # Vite dev server (default :5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint (ts/tsx files)
npm run typecheck        # tsc --noEmit
npm run test             # Vitest (all tests)
npm run test -- --run    # Vitest single run (no watch)
npm run test -- File.test.tsx   # Single test file
npm run test -- -t "test name"  # Single test by name pattern
```

---

## Code Style Guidelines

### Project Structure
```
/client                # React SPA (Vite)
  /components          # Reusable UI components
  /pages               # Route-level page components
  /hooks               # Custom React hooks
  /services            # Firebase data access + store
  /context             # React context providers
  /types               # Shared TypeScript types
  /utils               # Utility functions
/public                # Static assets, manifest, SW, recover.html
/firestore.rules       # Firestore Security Rules
/firebase.json         # Firebase config
```

### Imports
- Groups (separated by blank line): 1) 3rd-party, 2) internal absolute (`@/`), 3) relative (`./`)
- Sort within each group alphabetically
- Use `@/` alias for `client/src`
- No default exports except for Pages and entry points. Prefer named exports.

### Formatting & Linting
- Single quotes, semicolons required
- Trailing commas (all `wherever`), print width 100
- Indent with 2 spaces
- TailwindCSS classes: order by `layout → box model → typography → visual → state`
- Prettier + ESLint already configured; run `npm run lint` before committing

### TypeScript
- `strict: true` in tsconfig — no exceptions
- Prefer `interface` over `type` for object shapes; use `type` for unions, tuples, and primitives
- Use `as const` for literal constants and enums
- Avoid `any`. Use `unknown` and narrow with type guards
- Use `satisfies` operator for type validation without widening
- Mark function return types explicitly (no implicit returns)
- Use `import type { ... }` for type-only imports
- Generic type parameters: single uppercase letter for simple cases, descriptive names otherwise (`TData`, `TError`)

### Naming Conventions
- **Files**: `kebab-case.ts`, `kebab-case.tsx` for utilities; `PascalCase.tsx` for components/pages
- **Components**: `PascalCase` — `UserTable.tsx`, `OrderPanel.tsx`
- **Hooks**: `camelCase` prefixed with `use` — `useTables`, `useAutoSave`
- **Functions**: `camelCase` — `fetchTables()`, `formatCurrency()`
- **Constants**: `UPPER_SNAKE_CASE` for module-level constants — `MAX_COMENSALES = 8`
- **CSS classes**: Tailwind utility classes only (no custom CSS unless unavoidable; then `kebab-case`)
- **Props interface**: Component name + `Props` — `TableCardProps`

### Error Handling
- Client: wrap API calls in try/catch; surface errors via toast/notification (never silent `catch {}`)
- React: use ErrorBoundary at page level; log to console in development

### React / Component Conventions
- Functional components only, with hooks
- Props typed with inline `interface` at top of file
- One component per file, except small tightly-coupled helpers
- Use `useCallback`/`useMemo` only for expensive computations or stable callback references
- State management: React Context for global auth/settings; local state for UI
- No class components, no `any` prop types

### Testing
- Vitest as test runner
- Test files co-located next to source files: `TableCard.tsx` → `TableCard.test.tsx`
- React Testing Library for component tests
- Descriptive test names: `describe('TableCard') / it('renders table number and status')`

### Security
- All data access controlled by Firestore Security Rules
- Firebase Auth for authentication
- No secrets in code; use Firebase config (safe to commit, secured by rules)

### Git / Commits
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`, `chore:`
- `.gitignore` must exclude: `node_modules/`, `dist/`, `.env`, `.DS_Store`

### PWA
- Service worker in `/public/sw.js` (custom, not generated)
- Manifest at `/public/manifest.json` with short_name, icons, theme_color
- **Navigation (HTML)**: network-first, never cache HTML responses
- **Static assets (JS, CSS)**: cache-first; clone synchronously to avoid race conditions
- **API calls**: network-first with cache fallback
- **Inline activation script**: in `client/index.html` — auto-activates waiting SW on load
- **Recovery page**: `/public/recover.html` → forces SW activation and redirects to `/`
- **findInCaches**: searches all caches (old + new) before network; old caches kept 60s after activation
- **No HTML pre-caching**: `STATIC_URLS` only includes `./manifest.json` (no `index.html`)

### Deployment (GitHub Pages)
- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main` branch
- Builds client via `npm run build -w client`
- Copies `client/dist` → `docs/`, commits with `[skip ci]`
- GitHub Pages serves from `main` branch `/docs` folder (built-in, not actions/deploy-pages)
- Vite `base` is `/camarero_virtual/` in production
- Use `[skip ci]` in commit messages when committing `docs/` to prevent CI loop
- **Important**: Backend is NOT deployed — only the static frontend (Firebase handles auth + data)
