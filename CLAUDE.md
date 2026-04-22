# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest

# Run a single test file
npm test -- src/lib/__tests__/file-system.test.ts

# Run tests matching a name pattern
npm test -- ChatInterface

npm run setup        # First-time setup: install + prisma generate + migrate
npm run db:reset     # Reset SQLite database (destructive)
```

All `dev`/`build`/`start` commands require `cross-env NODE_OPTIONS="--require ./node-compat.cjs"` (already in package.json scripts). This polyfill removes `localStorage`/`sessionStorage` globals during SSR to fix a Node 25+ compatibility issue.

## Architecture

**UIGen** is a Next.js 15 App Router app where users describe React components in natural language and Claude generates them in real-time with live preview.

### Request flow

1. User types a prompt → `ChatInterface` sends it to `POST /api/chat`
2. `/api/chat/route.ts` calls Claude (or `MockLanguageModel` if no API key) via Vercel AI SDK streaming
3. Claude responds with tool calls — `str_replace_editor` to create/edit files, `file_manager` to rename/delete
4. Tool results update `VirtualFileSystem` in context → Preview and code editor re-render

### Virtual file system

`src/lib/file-system.ts` — `VirtualFileSystem` is an in-memory tree (no disk I/O). It serializes to JSON for API transport and persistence. The file system state flows through `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`).

### State management

Two React contexts carry all runtime state:
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`, owns message history
- `FileSystemContext` — owns `VirtualFileSystem` instance, applies tool call mutations

### Authentication & persistence

- JWT sessions via `jose` + bcrypt (`src/lib/auth.ts`)
- SQLite + Prisma (`prisma/schema.prisma`): `User` → `Project` one-to-many
- Anonymous users tracked locally via `src/lib/anon-work-tracker.ts` (localStorage)
- `src/middleware.ts` guards `/api/projects` and `/api/filesystem`
- On login, anonymous work is migrated to a persisted project

### AI provider

`src/lib/provider.ts` exports either the real Anthropic provider (requires `ANTHROPIC_API_KEY` in `.env`) or `MockLanguageModel` that returns a static component. The model used is `claude-haiku-4-5`. System prompt is in `src/lib/prompts/generation.tsx` and uses `cacheControl: { type: "ephemeral" }` to reduce token cost.

### Preview

`src/components/preview/` uses Monaco Editor + Babel standalone to transpile and render the virtual `App.jsx` in-browser without a build step.

## Key conventions

- Path alias `@/` maps to `src/` — use it for all non-library imports
- Server-only modules are marked with the `"server-only"` package (caught at build time)
- Prisma client is a singleton in `src/lib/prisma.ts`
- Generated Prisma types live in `src/generated/prisma/` (do not edit)
- Test files co-locate with source in `__tests__/` subdirectories using `.test.ts`/`.test.tsx`
