# Dental Hygiene Care Plan Builder

## Getting started

From a fresh clone, in this order:

```sh
pnpm install     # workspace deps, plus the esbuild/workerd binaries allowBuilds permits
pnpm build:core  # Core's dist — see the Gotchas note on why this comes first
pnpm test:all    # typecheck + all three suites; confirms the clone is sound
pnpm dev         # Vite dev server for the PWA
```

`pnpm test:all` and `pnpm dev` both build Core themselves, so step 2 is not strictly required to run
them — do it anyway, because it is also what stops your editor from flagging every
`@dh-care-plan/core` import as unresolved.

Only if you want the `dhplan` binary on your PATH: `pnpm setup` once (it creates the global bin
directory), then `pnpm link:cli`.

Day to day: `pnpm test:all` before pushing, `pnpm lint:fix` to autofix, `pnpm --filter
@dh-care-plan/pwa test` to run one package's suite.

## Deploy

- Create `.cf` file in the project root and export `CLOUDFLARE_API_TOKEN` within.
- `pnpm deploy:cf`: runs lint, all tests and publishes to the live URL.
- `pnpm deploy:cf:preview`: same gates, but uploads a new Worker version that gets its own preview URL without shifting 
  production traffic. Promote it from the Cloudflare dashboard, or roll back with `pnpm dlx wrangler rollback`.

## Toolchain

pnpm workspaces, Node, Vitest everywhere, tsup for the two publishable packages and Vite for the PWA. Requires pnpm 11+ 
and Node 24+ (see `engines`); `npm install -g pnpm` if you do not have it.

`pnpm-workspace.yaml` has to name `esbuild` and `workerd` under `allowBuilds` — pnpm blocks install scripts by default 
and both fetch a platform binary that way. Without it tsup, Vite and wrangler all fail at run time, not at install time.

## Gotchas

- Use `pnpm test:all` to test Core, the CLI and the PWA in one swing.

- **Relative imports are extensionless** (`./converter`, not `./converter.js`). This only works because every package is 
  bundled before anything executes it — tsup for Core and the CLI, Vite for the PWA — so no specifier written by hand 
  ever reaches Node's ESM resolver, which would reject the extensionless form. If you ever unbundle a package, this rule 
  inverts and every relative import in it needs `.js` back.

- Core's `tsup.config.ts` sets `splitting: true` on purpose. Both entries (`.` and `./schema`) pull in the schema 
  modules, and without splitting each bundle would carry its own copy — so `DEFAULT_CONFIG` imported from 
  `@dh-care-plan/core` and from `@dh-care-plan/core/schema` would be two different objects with two different zod 
  schemas. Splitting hoists the shared code into a chunk and keeps it one instance.

- `packages/cli` is its own package (`@dh-care-plan/cli`) and reaches Core only through its public `exports`, the same 
  way the PWA does. `pnpm link:cli` builds and links it globally, which is what puts `dhplan` on your PATH. This needs a 
  one-time `pnpm setup` first — without `PNPM_HOME` set there is no global bin directory and `pnpm link --global` fails.

- Core's `exports` point at `dist`, not `src`, so **anything consuming Core needs Core built** — the CLI, the PWA, and 
  their typechecks. Every root script that needs it runs `build:core` first, via a `pre*` hook (`predev`, `prebuild`, 
  `prebuild:cli`, `precheck`, `pretest`), so you should never hit this from the root. It bites in two places: running 
  `vitest` inside `packages/cli` or `packages/pwa` directly, and your editor on a fresh clone, where 
  `@dh-care-plan/core` imports show as unresolved until the first build. `pnpm build:core` fixes both.

- `packages/cli` is the only package with a `"pretest"`, and it exists for **three tests**. Everything else runs 
  in-process under Vitest, where Vite transforms TypeScript on the fly and no build output is needed — that is the whole 
  reason the PWA has no `pretest`. But `runCliProcess` in `tests/run-cli.ts` spawns a separate plain `node` process on 
  `dist/dhplan.js`, and plain Node cannot read TypeScript, so that file has to exist first. It looks like dead weight 
  because it adds nothing to coverage (v8 instruments only the Vitest process, so the `import.meta.main` guard reports 
  as uncovered even when those tests pass). Keep it anyway: they are the only tests here that execute a `dist` artifact, 
  covering the entry guard, the real process exit code, and Core's published `exports` map. One second of `tsup`.

- Editing Core during `pnpm dev` needs a rebuild to show up. There is no watcher wired up; run `pnpm build:core` again, 
  or `pnpm --filter @dh-care-plan/core exec tsup --watch` alongside it.

## Publishing

- Both packages emit bundled ESM via tsup; Core also emits rolled-up declarations. Sourcemaps carry `sourcesContent`, so 
  `dist` alone is enough and `files` no longer ships `src`. Nothing runtime-specific reaches the published output — 
  `dhplan` runs on plain Node.
- Core needs Node >= 18. The CLI needs Node >= 24, because its entry guard uses `import.meta.main`. That guard is 
  deliberate: it is the only form that stays correct when npm installs the bin as a symlink.
- The CLI depends on Core as `workspace:0.1.0`. pnpm links it locally and strips the protocol on publish, so the tarball 
  carries a plain `0.1.0` and installs from a registry. Whatever range you write is what ships, minus the protocol: 
  `workspace:^0.1.0` and `workspace:^` both yield `^0.1.0`, and a bare `workspace:*` yields the exact current version. 
  The exact pin here is deliberate — the CLI bundles against a specific Core build, so it should not silently float onto 
  a Core minor it was never tested with. The cost is that **every Core release needs a matching CLI release**, even a 
  patch; loosen it to `workspace:^0.1.0` if that becomes tedious and you trust Core's semver.
- **Publish with `pnpm publish`, never `npm publish`.** That protocol rewrite is pnpm's doing, and it happens at 
  pack time. npm does not understand a pnpm workspace, so it ships `workspace:0.1.0` verbatim and the tarball is 
  uninstallable — `npm install -g @dh-care-plan/cli` fails on an unknown protocol. Verify before releasing with 
  `pnpm --filter @dh-care-plan/cli exec pnpm pack --pack-destination /tmp`, then 
  `tar -xzOf /tmp/dh-care-plan-cli-0.1.0.tgz package/package.json` and confirm no `workspace:` survives.
- Bump both versions together and publish Core first, or the CLI's dependency will not resolve. With the exact pin this 
  is not optional: a CLI tarball asking for Core `0.1.1` is broken until Core `0.1.1` is actually on the registry.
- Both are scoped (`@dh-care-plan/*`), which npm treats as private by default, so each carries 
  `publishConfig.access: "public"`. Without it `npm publish` fails on a free account.

# To do 

- Should "export / import" be renamed to "download / upload"?
- The plan data JSON needs to carry test of the case study to be fully importable back.

## Ideas

- Add BMI calculator next to BMI field.
- Add slash shortcuts, e.g. `/i` for patient initials or `/n` for "Not needed".
