# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Collection of production-ready starter templates. Root `package.json` exists for repo-wide lint/format checks; template installs/tests run inside each template directory.

## Templates

| Template         | Stack                                | Test Framework |
| ---------------- | ------------------------------------ | -------------- |
| `about-me-page/` | Static HTML/CSS                      | None           |
| `api-service/`   | Express 5, TypeScript, Prisma        | Vitest         |
| `mobile-app/`    | React Native, Expo                   | Jest           |
| `saas-level-1/`  | Next.js 16, NextAuth, Stripe, Prisma | Vitest         |

## Commands

### From Template Directory

```bash
npm install && npm test && npm run build  # Full validation
npm run quality:check                      # Lint + type-check + test
npm run lint                               # ESLint
npm run type-check                         # TypeScript
```

### Single Test (Vitest - api-service, saas-level-1)

```bash
npm test -- src/path/to/file.test.ts       # Run single file
npm test -- -t "test name"                 # Run by test name
```

### Single Test (Jest - mobile-app)

```bash
npm test -- --testPathPattern=file.test.ts
npm test -- -t "test name"
```

### Prisma (api-service, saas-level-1)

```bash
npm run prisma:generate                    # Generate client
npx prisma db push                         # Push schema to DB
```

### Smoke Tests (From Root)

```bash
bash scripts/template-smoke-test.sh api-service
bash scripts/template-smoke-test.sh mobile-app
bash scripts/template-smoke-test.sh saas-level-1
bash scripts/cleanup-artifacts.sh
```

## Architecture

- `templates/` - Self-contained starter projects (each has own CLAUDE.md)
- `scripts/` - CI smoke tests, cleanup utilities
- `docs/` - Architecture guides, project-type guides
- Root `landing-page*.html` files are lightweight static showcases

## Conventions

- TypeScript/React components use PascalCase; functions and variables use
  camelCase.
- Keep environment helpers in `src/lib`.
- Prefer Tailwind utilities; shared CSS belongs in `src/styles` or local modules.
- Tests use Vitest/React Testing Library or Jest according to the template.
- For core-flow changes, run coverage and document any risk-based test omission
  in the PR.
- PRs include impact, verification evidence, linked issues, and UI screenshots
  when applicable.

## Template Env Requirements

| Template     | Required Env Vars                                            |
| ------------ | ------------------------------------------------------------ |
| api-service  | `DATABASE_URL`, `JWT_SECRET`                                 |
| saas-level-1 | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (DB/OAuth optional in dev) |
| mobile-app   | None required                                                |

## Constraints

- Use root npm scripts only for repo tooling (linting/formatting); run template installs/tests from within each template directory
- Run smoke tests before committing template changes
- Each template has its own CLAUDE.md with specific patterns
- Never commit secrets; update `SECURITY.md` and template READMEs when auth or
  payment configuration changes
