## Context

Three pieces already exist but aren't connected end to end: `validateData`/`validateTemplate`
(`packages/core/src/validator.ts`) check a plan JSON buffer and a template `.docx` buffer against `Plan`/`Template`
respectively; `createTemplater`/`describeTemplaterError` (`packages/core/src/templater.ts`) wrap
`docxtemplater`+`pizzip` construction and error message extraction; and `renderCarePlan.ts` renders a template buffer
against an arbitrary `data` object, with no validation and no plan→template conversion, and isn't called from anywhere
(the CLI's `render` command is commented-out placeholder code). `Template` is still an empty placeholder schema
(`z.object({})`) — the real plan→template conversion logic doesn't exist yet and is explicitly out of scope here; this
change wires up the pipeline shape so that work has somewhere to plug in.

## Goals / Non-Goals

**Goals:**

- A single `render()` entry point in a new `packages/core/src/renderer.ts` that takes a plan buffer and a template
  buffer (both in-memory, no file paths) and returns either the rendered document bytes or a list of validation issues.
- `render()` validates the plan against `Plan` and the template against `Template` before attempting to render anything.
- The plan→template data conversion is isolated behind one function, `buildTemplateData(plan: Plan): Template`,
  scaffolded to return `{}` for now so the real conversion can be implemented later without touching `render()`'s
  control flow.
- A `dhplan render <plan> <template> <output>` CLI command that does all file I/O (reading the two inputs, writing the
  output) and leaves `renderer.ts` file-path agnostic.

**Non-Goals:**

- Implementing the actual `Plan` → `Template` conversion logic (still a scaffold returning `{}`).
- Populating `Template` with real fields (unchanged placeholder).
- Preserving `renderCarePlan.ts`'s API — it's removed (see Decisions).

## Decisions

- **Remove `renderCarePlan.ts` rather than keeping it alongside `renderer.ts`.** It has no callers today (the CLI's
  `render` command was commented-out placeholder code referencing it), does no validation, and takes a raw
  `data: unknown` instead of a `Plan`. Keeping both would mean two "render a docx" entry points with different
  contracts; `renderer.ts` fully supersedes it. `templater.ts` (the generic `createTemplater`/ `describeTemplaterError`
  helpers) stays as-is and is reused by `renderer.ts` — only the higher-level, single-purpose wrapper is removed.
- **`render()` signature and result shape:**

  ```ts
  export type RenderResult = { success: true; output: Uint8Array } | { success: false; issues: ValidationIssue[] };

  export function render(planInput: ArrayBuffer, templateInput: ArrayBuffer): RenderResult;
  ```

  Mirrors `ValidationResult`'s discriminated-union shape (issues use the same `ValidationIssue` type from
  `validator.ts`) so CLI error-printing code can stay consistent with the existing `validate` command. `index.ts`
  exports both `render` and `RenderResult` (replacing the removed `renderCarePlan` export) so the CLI can type its
  result without reaching into `renderer.ts` internals.

- **Validation is sequential and fails fast: plan first, then template.** If `validateData(planInput)` fails, `render()`
  returns immediately with the plan's issues without even looking at the template buffer. Only if the plan is valid does
  it call `validateTemplate(templateInput)`. This matches the proposal's explicit ordering ("first validates input file
  against the schema, followed with the same for template") and keeps the error message focused on one problem at a
  time, at the cost of not surfacing a template problem in the same run as a plan problem — acceptable since
  `dhplan validate` already exists for checking both independently before rendering.
- **`render()` reuses `validateData`/`validateTemplate` for validation, then re-parses the plan buffer to get a typed
  `Plan` for the conversion step.** `validateData` only returns a `ValidationResult` (valid/issues), not the parsed
  value, so once validation passes, `render()` does its own `Plan.parse(JSON.parse(...))` on the same buffer to obtain
  the object `buildTemplateData` needs. This duplicates a small amount of parsing work but avoids changing
  `validateData`'s signature/contract for every existing caller; revisit if this duplication becomes a real cost once
  the real plan→template conversion (and its own parsing needs) is designed.
- **`buildTemplateData(plan: Plan): Template` is exported from `renderer.ts` (for direct testability) but not
  re-exported from `index.ts`** — only `render`/`RenderResult` are part of the package's public surface, matching the
  proposal's Impact section. The scaffold simply returns `{}`, which satisfies today's empty `Template` shape.
- **Template rendering reuses the raw template buffer directly** (via `createTemplater(templateInput)`) rather than
  re-validating or re-encoding it — `validateTemplate` already confirmed its tags are covered by `Template`;
  docxtemplater renders against the buffer's zip contents directly, not a parsed `Template` object.
- **CLI argument order is `<plan> <template> <output>`**, per the proposal, which differs from `renderCarePlan`'s old
  `(templateBuffer, data)` parameter order — not a concern since that function is being removed.

## Risks / Trade-offs

- [Re-parsing the plan buffer after `validateData` already parsed it internally is wasted work] → Acceptable for a small
  JSON payload at CLI scale; revisit only if profiling ever shows it matters.
- [Fail-fast plan-then-template validation means a user fixing a plan error won't learn about a template error until the
  next run] → Acceptable trade-off; `dhplan validate plan <file>` and `dhplan validate template <file>` remain available
  to check both independently up front.
- [Removing `renderCarePlan.ts` is a breaking change to the package's public API] → **Materialized during
  implementation**: `packages/pwa/src/App.tsx` turned out to call `renderCarePlan` directly (missed by the initial "no
  callers" check, which only looked at the CLI). Its `staticData` (`packages/pwa/src/data.ts`) predated the
  `Plan`/`Template` split and matched neither schema, so the dead demo feature was removed rather than ported to the new
  `render()` API — `App.tsx` now renders a placeholder heading, and `data.ts` was deleted. Verified `pwa` typechecks and
  its test suite still passes.

## Migration Plan

No data migration. Implementation order: add `renderer.ts` (with the scaffolded `buildTemplateData`), remove
`renderCarePlan.ts`, update `index.ts` exports, wire the CLI's `render` command, add tests, run the full suite.
