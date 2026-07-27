## Why

`buildTemplateData()` (`packages/core/src/renderer.ts`) computes the `Template`-shaped data from a `Plan` (assessments +
statements + generated goal labels), but the only way to see its output today is indirectly, via a rendered `.docx`.
There's no quick way to visually check the mapping result on its own while authoring or debugging a plan.

## What Changes

- Add a new `dhplan inspect <plan>` CLI command that reads a plan JSON file, validates it, calls `buildTemplateData`,
  and prints the resulting `Template` JSON to stdout for visual inspection.
- Export `buildTemplateData` from `packages/core/src/index.ts` so the CLI package can call it without reaching into
  `renderer.ts` internals.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `cli`: adds the `inspect` subcommand alongside `schema`, `validate`, and `render`.

## Impact

- `packages/core/cli/dhplan.ts` (new `inspect` command)
- `packages/core/src/index.ts` (export `buildTemplateData`)
- Core test suite gains CLI coverage for `inspect`
