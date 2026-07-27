## Why

The CLI can validate a plan JSON file and a template `.docx` independently (`dhplan validate plan|template`), but there
is no way to actually produce a filled-in `.docx` from a plan and a template — the only rendering code that exists
(`renderCarePlan.ts`) skips validation entirely, doesn't convert `Plan` shape into the flat `Template` shape
docxtemplater expects, and isn't wired into the CLI (the `render` command is commented out as a placeholder). We need
the core scaffolding for the render pipeline — validate → convert → render — wired up end to end, even though the actual
plan→template conversion logic doesn't exist yet.

## What Changes

- **BREAKING**: Remove `packages/core/src/renderCarePlan.ts`. Its responsibility (validate-free, no plan→template
  conversion) is superseded by the new `renderer.ts` pipeline described below; nothing in the CLI currently calls it
  (the CLI's `render` command is commented out), so this has no live-behavior impact.
- Add `packages/core/src/renderer.ts` exporting a primary `render()` function that:
  1. Validates the plan JSON input against `Plan` (reusing `validateData`).
  2. Validates the template `.docx` input against `Template` (reusing `validateTemplate`).
  3. Converts the parsed `Plan` into the flat `Template`-shaped data via a new, currently-scaffolded
     `buildTemplateData(plan: Plan): Template` function that returns an empty object for now (real plan→template
     computation is out of scope for this change).
  4. Renders the template `.docx` using a `docxtemplater` instance (via the existing `createTemplater` helper in
     `templater.ts`) with the generated template data.
  5. Returns the rendered document bytes on success, or the validation issues on failure — `render()` takes and returns
     only in-memory buffers/objects; it does no file I/O.
- Add a `render` subcommand to `packages/core/cli/dhplan.ts`: `dhplan render <plan> <template> <output>`. This command
  owns all file I/O (reading the plan JSON and template `.docx`, calling `render()`, and writing the result to
  `<output>`) — `renderer.ts` itself stays file-path agnostic.
- `packages/core/src/index.ts`: export `render` from `./renderer` in place of the removed `renderCarePlan` export.

## Capabilities

### New Capabilities

- `renderer`: the plan+template → rendered `.docx` pipeline (validate plan, validate template, convert plan to template
  data, render via docxtemplater), exposed as `render()` in `packages/core/src/renderer.ts`.

### Modified Capabilities

- `cli`: adds a `render` subcommand alongside the existing `schema` and `validate` subcommands.

## Impact

- `packages/core/src/renderer.ts` (new)
- `packages/core/src/renderCarePlan.ts` (removed)
- `packages/core/src/index.ts`
- `packages/core/cli/dhplan.ts`
- `packages/core/src/templater.ts` (reused as-is; no changes expected)
- No new dependencies; uses the existing `docxtemplater`/`pizzip` setup already wrapped by `templater.ts`.
- `packages/pwa/src/App.tsx` and `packages/pwa/src/data.ts`: discovered during implementation that `App.tsx` directly
  called `renderCarePlan` with a hardcoded `staticData` object predating the `Plan`/`Template` split (not caught by the
  initial "no callers" assessment, which only checked the CLI). Since `staticData` doesn't match either current schema,
  the dead demo feature was removed rather than ported — `App.tsx` now renders a placeholder heading only, and `data.ts`
  was deleted.
