# Dental Hygiene Care Plan Builder

## Deploy

- Create `.cf` file in the project root and export `CLOUDFLARE_API_TOKEN` within.
- `bun run deploy`: runs lint, all tests and publishes to the live URL.
- `bun run deploy:preview`: same gates, but uploads a new Worker version that gets its own preview URL without shifting 
  production traffic. Promote it from the Cloudflare dashboard, or roll back with `bunx wrangler rollback`.

## Gotchas

- Use `bun test:all` to test both Core and PWA in one swing, `bun test` ignores override in `package.json`.

- The two packages run on different test runners, which is why `test:core` and `test:pwa` do not look alike. Core 
  uses bun's built-in runner. The PWA needs Vite's transform and a `jsdom` environment. This also means the coverage 
  is configured, if needed,  in two places: `packages/core/bunfig.toml` for Core and `packages/pwa/vite.config.ts` 
  for the PWA.

# To do 

- Should "export / import" be renamed to "download / upload"?
- The plan data JSON needs to carry test of the case study to be fully importable back.

## Ideas

- Add BMI calculator next to BMI field.
- Add slash shortcuts, e.g. `/i` for patient initials or `/n` for "Not needed".
