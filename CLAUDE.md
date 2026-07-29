# Project instructions

- Default to using Bun instead of Node.js.
- Always pin dependencies to an exact specific version to avoid supply chain attacks.
- Do NOT make git commit unless explicitly asked.
- Do NOT out code into specifications unless absolutely necessary to describe the objective.
- If generic functionality is needed in PWA (e.g. file validation) ALWAYS REUSE what is available in Core.

## Tools

- `bun test:all`: typecheck and test both Core and PWA at once, do NOT use `bun test`.
- `bun typecheck`: `tsc --noEmit` over both packages. Bun and Vitest only strip types, so tests
  pass on code that does not typecheck — this is the only check that catches type errors.
- `bun lint:fix`: run linter with auto-fix enabled
