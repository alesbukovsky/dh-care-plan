## Context

`dhplan schema <type>` currently calls `getPlanSchema()` / `getTemplateSchema()` and prints the resulting JSON Schema
document. There is no existing mechanism in this codebase for generating example data from a zod schema —
`getPlanSchema`/`getTemplateSchema` only wrap `z.toJSONSchema`. `Plan` and `Template` are both small, hand-maintained
schemas (`packages/core/src/schema/plan.ts`, `packages/core/src/schema/template.ts`).

## Goals / Non-Goals

**Goals:**

- `dhplan schema <type> --sample` prints one concrete, valid example JSON document for `Plan` or `Template`.
- The sample covers every field, including optional ones, so it doubles as a reference for hand-authoring plan files or
  docxtemplater templates.

**Non-Goals:**

- A generic "generate sample data from any zod schema" utility. Only two schemas exist in this codebase; a bespoke
  reflection-based generator would add real complexity (handling every zod type, optionals, unions, etc.) for no reuse
  benefit.
- Randomized/fuzzed sample data. A single fixed, realistic example is the goal, not variety.

## Decisions

- **Hand-author both samples together in a new `src/sampler.ts` module, not a generic schema-walker and not split across
  the schema files.** `getPlanSample(): Plan` returns a literal object matching `Plan`. `getTemplateSample(): Template`
  derives its result by calling `buildTemplateData(getPlanSample())`, imported from `renderer.ts`. Putting both in one
  module keeps "what do the samples look like" discoverable in a single place, and since `renderer.ts` never imports
  from `sampler.ts`, there's no circular import (`sampler.ts` depends on `renderer.ts` and the schema types; nothing
  depends back on `sampler.ts` except the CLI and `index.ts`). Rationale: `Plan` and `Template` are small and rarely
  change; a hand-written sample is trivial to keep in sync (a type error surfaces immediately if the shape changes) and
  is far simpler than writing/maintaining a zod-introspecting generator for a one-off CLI flag used by exactly two
  schemas.

- **Validate the samples via existing schema `.parse()` in tests, not at runtime in the CLI.** Since the sample is a
  literal typed as `Plan` / `Template`, TypeScript already guarantees shape correctness at compile time; a unit test
  additionally calls `Plan.parse(getPlanSample())` / `Template.parse(getTemplateSample())` to catch any future schema
  tightening (e.g. a new `z.string().min(1)`) that a same-shaped literal could still violate.

- **`--sample` is a boolean flag on the existing `schema` command, not a new subcommand.** It's a presentational variant
  of the same "give me <type>'s shape" request, consistent with how `validate`/`schema` already take a `<type>` argument
  rather than being split into `validate-plan`/`validate-template`.

- **Sample content**: the `Plan` sample includes one met need (no optional fields, to show they're optional) and one
  unmet need with `relatedTo`, `evidencedBy`, and two goals (one with `doneBy`, one without), so every optional field is
  demonstrated at least once. The `Template` sample is the `buildTemplateData` output for that same plan, keeping the
  two samples consistent with each other.

## Risks / Trade-offs

- [Sample drifts from schema if `Plan`/`Template` shapes change without updating the sample] → mitigated by TypeScript
  (sample is typed as `Plan`/`Template`) plus a parse-validation test; a shape change that adds a new required field
  will fail to compile until the sample is updated.
