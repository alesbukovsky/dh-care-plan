# Project instructions

- Use pnpm and Node. There is no Bun in this repo; do not reintroduce it.
- Relative imports are extensionless (`./converter`, not `./converter.js`). This holds because
  Core and the CLI are bundled by tsup and the PWA by Vite, so no hand-written specifier ever
  reaches Node's ESM resolver. Keep new imports in that style.
- Always pin dependencies to an exact specific version to avoid supply chain attacks.
- Do NOT make git commit unless explicitly asked.
- Do NOT out code into specifications unless absolutely necessary to describe the objective.
- If generic functionality is needed in PWA (e.g. file validation) ALWAYS REUSE what is available in Core.

## Tools

- `pnpm test:all`: type check and test Core, the CLI and the PWA at once
- `pnpm check`: type check via `tsc --noEmit` over all three packages
- `pnpm lint:fix`: run linter with auto-fix enabled
