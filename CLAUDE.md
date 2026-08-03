# Project instructions

## General

- Use pnpm and Node, no Bun in this repo
- Do NOT make git commit unless explicitly asked
- Do NOT update README.md unless explicitly asked

## Code

- Always pin dependencies to an exact specific version to avoid supply chain attacks
- Relative imports are extension-less, e.g. `./converter` not `./converter.js`
- Core is runtime agnostic: no Node builtins, no DOM, no `fetch`
 
## Tools

- `pnpm test`: type-checks and tests everything
- `pnpm typecheck`: only type-checks everything
- `pnpm lint` / `pnpm lint:fix`: lints Typescript code, the latter with auto-fix enabled
- `pnpm dev`: start Vite development server for the PWA
- If you launch Vite locally, make sure to shut it down after the fact.
