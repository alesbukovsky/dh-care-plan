## Why

`dhplan schema plan` and `dhplan schema template` currently call `z.toJSONSchema(Plan)` / `z.toJSONSchema(Template)`
directly. Because `Need`, `Goal`, `MetNeed`, etc. are (or will be) registered on the single shared `z.globalRegistry`,
two problems exist today or loom as both schemas grow: (1) nested objects are inlined wherever they're referenced
instead of extracted to `$defs`, hurting readability of the printed JSON Schema, and (2) `plan.ts` and `template.ts` are
forced to coordinate on a single global id namespace, so a natural id like `"Need"` in one schema collides with an
unrelated `"Need"` in the other the moment both get converted together (e.g. a future combined-docs generation path).
Moving to one local `z.registry()` per schema file, converted via `toJSONSchema`'s `external` option, gives each schema
its own id namespace and its own JSON Schema `$id`, and produces `$defs`-based output instead of inlining.

## What Changes

- `packages/core/src/schema/common.ts` (new): exports `SCHEMA_BASE_URI`, the shared base URI
  (`https://github.com/alesbukovsky/dh-care-plan/schema`, no trailing slash) both schema files build their `$id` from,
  joining a `/` at the call site.
- `packages/core/src/schema/plan.ts`: replace `z.globalRegistry` usage with a local `z.registry()` instance (named
  `registry`, unexported). Register `Goal`, `Need`, `MetNeed`, `UnmetNeed` on it. Add an exported `getPlanSchema()`
  function that calls `z.toJSONSchema(Plan, { metadata: registry })` and splices in
  `$id: ${SCHEMA_BASE_URI}/plan.schema.json` before returning the resulting JSON Schema document.
- `packages/core/src/schema/template.ts`: same pattern — local `registry`, register template-schema objects on it as
  they exist (currently just the placeholder), and an exported `getTemplateSchema()` function with
  `$id: ${SCHEMA_BASE_URI}/template.schema.json`.
- `packages/core/cli/dhplan.ts`: the `schema` command switches from calling `z.toJSONSchema(schema)` on the imported zod
  schema directly to calling `getPlanSchema()` / `getTemplateSchema()` and printing that result.
- `packages/core/src/index.ts`: export `getPlanSchema` and `getTemplateSchema` alongside the existing `Plan` /
  `Template` exports.
- **BREAKING**: none for external consumers of validation (`validateData` / `validateTemplate` keep using the zod
  schemas directly, unaffected). The shape of the printed JSON Schema document changes (nested objects appear under
  `$defs` with a `$id`/`$ref` instead of inlined) — anything scraping the old inlined JSON Schema output verbatim would
  need to adjust.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `plan-schema`: `Plan`'s JSON Schema is now produced via a local `z.registry()` and an exported `getPlanSchema()`
  function using `toJSONSchema`'s `external` option, rather than a bare `z.toJSONSchema(Plan)` call. Registered objects
  appear under `$defs` and the document carries a `$id` scoped to the plan schema.
- `template-schema`: same requirement change, mirrored for `Template` / `getTemplateSchema()`.
- `cli`: the `schema` command's output is now sourced from `getPlanSchema()` / `getTemplateSchema()` instead of calling
  `z.toJSONSchema` on the raw schema inline in the CLI.

## Impact

- `packages/core/src/schema/common.ts` (new)
- `packages/core/src/schema/plan.ts`
- `packages/core/src/schema/template.ts`
- `packages/core/src/index.ts`
- `packages/core/cli/dhplan.ts`
- `packages/core/tests/cli/dhplan-schema.test.ts` (existing test asserting the printed JSON Schema shape will need to
  account for `$defs`/`$ref` output instead of inlined objects)
- No new dependencies; uses zod's existing `z.registry()` / `toJSONSchema({ external })` API already present in
  `zod@4.4.3`.
- Depends on `rename-data-schema-to-plan` having landed first (the `Plan`/`plan.ts`/`Template` naming this change
  assumes) — apply that change before this one.
