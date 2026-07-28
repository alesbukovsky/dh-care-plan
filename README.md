# Dental Hygiene Care Plan Builder

## Deploy

The PWA is fully static and is served by an assets-only Cloudflare Worker
(`packages/pwa/wrangler.jsonc`, Worker name `dhplan`, so the default URL is
`dhplan.<account-subdomain>.workers.dev`). Renaming the Worker changes that URL;
Cloudflare treats the new name as a separate Worker, so delete the old one.

One-time setup:

1. `bunx wrangler login` (or export `CLOUDFLARE_API_TOKEN` with the
   *Edit Cloudflare Workers* permission, plus `CLOUDFLARE_ACCOUNT_ID` if the
   token can reach more than one account).
2. Optional: `bunx wrangler telemetry disable`.

Every deploy:

- `bun run deploy` — lint, test Core + PWA, build, then publish to the live URL.
- `bun run deploy:preview` — same gates, but uploads a new Worker version that
  gets its own preview URL without shifting production traffic. Promote it from
  the Cloudflare dashboard, or roll back with `bunx wrangler rollback`.

Both scripts refuse to publish unless lint, tests and the type-checked build all
pass, so the deploy step never runs against a broken tree.

## Gotchas

- Use `bun test:all` to test both Core and PWA in one swing, `bun test` ignores override in `package.json`.

## Ideas

- Add BMI calculator next to BMI field.
- Add slash shortcuts, e.g. `/i` for patient initials or `/n` for "Not needed".