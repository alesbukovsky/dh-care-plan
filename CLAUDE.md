# Project instructions

- Default to using Bun instead of Node.js.
- Always pin dependencies to an exact specific version to avoid supply chain attacks.
- Do NOT make git commit unless explicitly asked.

## Testing

- Use `bun test:all` to verify both Core and PWA at once, NOT `bun test`.
- Use `bun test:core` and `bun test:pwa` to test only Core or PWA, respectively.
