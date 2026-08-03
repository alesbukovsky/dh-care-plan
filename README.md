# Dental Hygiene Care Plan Builder

The project consists of teh following parts:

- `packages/core`: shared library with common logic
- `packages/cli`: command-line interface (CLI) 
- `packages/pwa`: progressive web application (PWA)

## Getting started

From a fresh clone, install dependencies, verify everything and start development PWA server:

```sh
pnpm install
pnpm test
pnpm dev
```

If you editor complains about unresolved imports from `@dh-care-plan/core`, build it explicitly via `pnpm build:core`.

If you want the `dhplan` CLI command sim-linked on your PATH: 

```sh
pnpm setup
pnpm link:cli
```

## PWA Deployment

Uses Cloudflare Worker with static assets. Create `.cf` file in the project root and export your `CLOUDFLARE_API_TOKEN` 
within.

- `pnpm deploy`: uploads to live URL, and immediately routes traffic.
- `pnpm deploy:stage`: stages a version for preview, no traffic yet.

The `wrangler.sh` script is a wrapper around the Cloudflare CLI tool. It sources the `.cf` file and ensures that the 
version installed as a PWA dependency is executed, using the associated `wrangler.jsonc` configuration. For example:

- `wrangler.sh versions deploy`: promotes staged version to receive live traffic.
- `wrangler.sh rollback`: rollbacks to previous live version.

## Toolchain

Prerequisites: Node 24+, `pnpm` 11+

Vitest is used for all unit tests, Vite for the PWA and `tsdown` for the core and CLI publishable packages.

## Gotchas

- `pnpm-workspace.yaml` has to list `esbuild` and `workerd` under `allowBuilds`, because the tool blocks dependency 
  lifecycle scripts by default (needed here to install platform-specific binary). Without it Vite and `wrangler` 
  fail at run time, not at install time. Rolldown ships its binary as an optional platform dependency and needs no 
  entry here.

- Extensionl-ess relative imports work because a bundler-style resolver always sits in front of the source, `tsdown` 
  for core and CLI, Vite for the PWA and for Vitest, so no hand-written specifier ever reaches Node's ESM resolver. 
  This is a style preference, not a constraint. For example, `./converter.js` resolves in both a bundler and Node, 
  so the explicit form is a strict superset. It is kept because `.js` inside a `.ts` file reads wrong.

# To do 

- Maintenance need is only allowed when ALL other needs are met.
- Should "export / import" be renamed to "download / upload"?

## Ideas

- Add BMI calculator next to BMI field.
- Add slash shortcuts, e.g. `/i` for patient initials or `/n` for "Not needed".
