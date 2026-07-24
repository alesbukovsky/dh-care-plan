## Why

`buildTemplateData()` in `packages/core/src/renderer.ts` currently returns an
empty object regardless of input, as a scaffold. `Plan` models needs and
their relations naturally (a list of `Need`, each optionally with goals), but
`Template` must flatten and repeat that data to fit docxtemplater's
loop-only templating model (a separate `assessments` list and a `statements`
list, with generated per-goal labels). Implementing this mapping is the core
remaining piece connecting the plan and template data models.

## What Changes

- Implement `buildTemplateData(plan: Plan): Template` to derive template
  data from a plan instead of returning `{}`.
- `assessments`: one entry per `Need` in `plan.needs`, in order, mapping
  `need.name` -> `assessment.need` and `need.isMet` -> `assessment.isMet`.
- `statements`: one entry per `Need` in `plan.needs` where `isMet` is
  `false`, preserving order, mapping `need.name` -> `statement.need`,
  `need.relatedTo` -> `statement.relatedTo`, `need.evidencedBy` ->
  `statement.evidencedBy` 1:1.
- `statement.goals`: `need.goals` mapped 1:1 (task, doneBy), with each
  goal's `label` generated as `<statement number><goal letter>`, e.g. the
  2nd unmet need's 3rd goal is labelled `2c`. Statement numbers are 1-based
  per position in `statements`; goal letters are `a`, `b`, `c`, ... per
  position within that statement's goals.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `renderer`: `buildTemplateData` now computes real `Template` data from a
  `Plan` (assessments + statements + generated goal labels) instead of
  always returning an empty object.

## Impact

- `packages/core/src/renderer.ts` (`buildTemplateData`)
- `packages/core/src/schema/plan.ts`, `packages/core/src/schema/template.ts`
  (read-only, no shape changes expected)
- Core test suite (`bun test:core`) gains coverage for the new mapping logic
