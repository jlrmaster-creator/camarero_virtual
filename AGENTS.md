# AGENTS.md — CamareroVirtual

## Project Overview

Bar/restaurant table management PWA. React + Vite + TypeScript frontend, Node.js + Express backend, SQLite database. Optimized for mobile, works on tablet/desktop.

---

## Build / Lint / Test Commands

### Root
```bash
npm install              # Install all dependencies (root + client + server)
npm run dev              # Start both client and server concurrently
npm run build            # Build client for production
npm run lint             # Lint all packages
npm run typecheck        # Run TypeScript type checking across project
npm run test             # Run all tests
npm run clean            # Remove node_modules, dist, and db files
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

### Server
```bash
cd server
npm run dev              # ts-node-dev with hot reload (default :3001)
npm run build            # Compile TypeScript -> dist/
npm run start            # Run compiled JS from dist/
npm run lint             # ESLint (ts files)
npm run typecheck        # tsc --noEmit
npm run test             # Vitest (all tests)
npm run test -- --run    # Single run
npm run test -- File.test.ts    # Single test file
```

### Database
```bash
npm run db:migrate       # Run SQLite migrations
npm run db:seed          # Seed default data (tables, products)
npm run db:reset         # Drop + migrate + seed
```

---

## Code Style Guidelines

### Project Structure
```
/client                # React SPA (Vite)
  /components          # Reusable UI components
  /pages               # Route-level page components  
  /hooks               # Custom React hooks
  /services            # API client functions
  /context             # React context providers
  /types               # Shared TypeScript types
  /utils               # Utility functions
/server                # Express API
  /routes              # Express route definitions
  /controllers         # Request handlers (thin)
  /models              # Database access layer (better-sqlite3)
  /database            # Migrations, seeds, connection
  /middleware           # Express middleware
  /utils               # Server utilities
  /types               # Server-specific types
/public                # Static assets, manifest, SW
```

### Imports
- Groups (separated by blank line): 1) Node built-ins / 3rd-party, 2) internal absolute (`@/`), 3) relative (`./`)
- Sort within each group alphabetically
- Use `@/` alias for client source root (`client/src`) and server source root (`server/src`)
- No default exports except for Pages and entry points. Prefer named exports.

```typescript
// Good
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useTables } from '@/hooks/useTables';
import { formatCurrency } from '@/utils/format';
import type { Table, TableStatus } from '@/types/models';

// Bad
import Button from '@/components/ui/Button';  // default export
```

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

```typescript
// Good
interface TableProps {
  table: TableData;
  onSelect: (id: number) => void;
}

type Status = 'free' | 'occupied' | 'pending_payment';

// Bad
const Table = (props: any) => { ... };
type TableProps = { table: any; onSelect: any };
```

### Naming Conventions
- **Files**: `kebab-case.ts`, `kebab-case.tsx` for utilities; `PascalCase.tsx` for components/pages
- **Components**: `PascalCase` — `UserTable.tsx`, `OrderPanel.tsx`
- **Hooks**: `camelCase` prefixed with `use` — `useTables`, `useAutoSave`
- **Functions**: `camelCase` — `fetchTables()`, `formatCurrency()`
- **Constants**: `UPPER_SNAKE_CASE` for module-level constants — `MAX_COMENSALES = 8`
- **CSS classes**: Tailwind utility classes only (no custom CSS unless unavoidable; then `kebab-case`)
- **Database tables/columns**: `snake_case` — `mesas`, `fecha_creacion`
- **API routes**: `kebab-case` — `/api/tables`, `/api/occupations/active`
- **Props interface**: Component name + `Props` — `TableCardProps`

### Error Handling
- Server: use an `AppError` class with `statusCode` and `code` properties; catch in centralized error middleware
- Client: wrap API calls in try/catch; surface errors via toast/notification (never silent `catch {}`)
- SQLite errors: never expose raw SQL errors to client; log server-side, return generic error response
- Input validation: validate at Express middleware layer with Zod schemas
- React: use ErrorBoundary at page level; log to console in development

```typescript
// Server error middleware pattern
class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

// Controller pattern
async getAllTables(req: Request, res: Response, next: NextFunction) {
  try {
    const tables = await tableModel.findAll();
    res.json({ data: tables });
  } catch (err) {
    next(err);
  }
}
```

### React / Component Conventions
- Functional components only, with hooks
- Props typed with inline `interface` at top of file
- One component per file, except small tightly-coupled helpers
- Use `useCallback`/`useMemo` only for expensive computations or stable callback references
- State management: React Context for global auth/settings; local state for UI; React Query (or custom hooks) for server data
- No class components, no `any` prop types

### API Conventions
- RESTful; return `{ data: ... }` for success, `{ error: { code, message } }` for errors
- Version under `/api/` prefix
- Use HTTP methods semantically: GET (read), POST (create), PUT (update), DELETE (remove)
- Pagination: `{ data: [], meta: { page, pageSize, total } }`

### Testing
- Vitest as test runner (both client and server)
- Test files co-located next to source files: `TableCard.tsx` → `TableCard.test.tsx`
- React Testing Library for component tests
- Supertest for API integration tests
- Descriptive test names: `describe('TableCard') / it('renders table number and status')`

### Security
- Validate all inputs with Zod schemas on the server
- Parameterized SQL queries only (use `better-sqlite3` prepared statements)
- Sanitize user-generated content before rendering (text areas, table names)
- No secrets in code; use `.env` files for configuration

### Git / Commits
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`, `chore:`
- `.gitignore` must exclude: `node_modules/`, `dist/`, `*.db`, `*.db-journal`, `.env`, `.DS_Store`

### PWA
- Service worker in `/public/sw.js` (or generated via vite-plugin-pwa)
- Manifest at `/public/manifest.json` with short_name, icons, theme_color
- Cache-first strategy for static assets; network-first for API calls

### Deployment (GitHub Pages)
- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main` branch
- Builds client via `npm run build -w client`
- Uses `actions/deploy-pages` to publish
- Vite `base` is `/camarero_virtual/` in production (auto-detected via `NODE_ENV`)
- Manifest, SW, and assets use relative paths (`.`) for subpath compatibility
- **Important**: Backend is NOT deployed — only the static frontend. For full stack, deploy server separately.
