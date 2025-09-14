# Repository Guidelines

## Project Structure & Module Organization
- `app/` Next.js App Router (routes, `layout.tsx`, `page.tsx`).
- `components/` shared React components; `components/ui/*` contains shadcn-style primitives.
- `lib/` server/client utilities (Google APIs, PDF/sheets, actions).
- `public/` static assets; `styles/` global styles; `.taskmaster/` task workflows; `.claude/` automation config.

## Build, Test, and Development Commands
- `pnpm dev` or `npm run dev` — run local dev server at http://localhost:3000.
- `pnpm build` — production build. `pnpm start` — serve built app.
- `pnpm lint` — run ESLint via Next.js.
- Optional workflow: `task-master list` and `task-master next` to navigate project tasks.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation, consistent imports, avoid unused exports.
- Components in PascalCase (e.g., `CreateFolderButton.tsx`); files in `components/ui` use kebab-case (e.g., `button.tsx`).
- Pages/layouts follow Next conventions (`page.tsx`, `layout.tsx`). Prefer functional components and hooks.
- Use Tailwind CSS utilities; avoid inline styles; respect server/client component boundaries in `app/`.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests in `tests/` or `__tests__/` with `*.test.ts(x)` naming.
- Add a script like `"test": "vitest"` and run `pnpm test` locally and in CI.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, etc.
  - Example: `feat(dashboard): add certificate sharing`.
- Reference Task Master IDs when relevant (e.g., `task 1.2`).
- PRs must include a clear description, validation steps, and screenshots for UI changes.
- Ensure `pnpm lint` and `pnpm build` pass before requesting review.

## Security & Configuration Tips
- Store secrets in `.env.local` (see `.env.example`); never commit secrets.
- Keep third‑party keys and config centralized in `lib/`. Validate new env vars at startup.

## Agent-Specific Instructions
- This file is auto-loaded by local automation (CLAUDE/WARP symlinks). Keep it concise.
- Do not re-initialize Task Master; use `task-master generate` to resync task files.

