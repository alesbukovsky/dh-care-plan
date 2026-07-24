## Why

`Plan` and `Template` have both grown new fields (`patient`,
`appointments`, `Need.interventions`, `Need.outcome`) since
`buildTemplateData` was last implemented, but the mapping function was
never updated to cover them. Right now those fields are silently dropped:
`render()` will fail template validation (or produce a document missing
patient/appointment/intervention/outcome data) for any template that
references them, because `buildTemplateData` never populates them on the
`Template` object it returns.

## What Changes

- `buildTemplateData` (`packages/core/src/renderer.ts`) SHALL copy
  `plan.patient` to `Template.patient` unchanged (the shapes are
  identical: `initials`, `dob`, `chartId`).
- `buildTemplateData` SHALL copy `plan.appointments` to
  `Template.appointments` unchanged, preserving order (the shapes are
  identical: an array of ISO dates).
- Each `Statement` (i.e. each unmet `Need`) SHALL carry the source
  `Need`'s `interventions` copied 1:1, defaulting to an empty array when
  the `Need` has no `interventions`. Met needs are unaffected, since only
  unmet needs become statements.
- Each `Statement` SHALL carry an `outcome` derived from the source
  `Need`'s `outcome`: `outcome.note` copies 1:1 (both optional), and
  `outcome.status` maps to `outcome.label` via a fixed lookup: `"met"` ->
  `"Met"`, `"partial"` -> `"Partially met"`, `"unmet"` -> `"Not met"`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `renderer`: `buildTemplateData`'s Plan-to-Template mapping is extended
  to cover `patient`, `appointments`, `interventions`, and `outcome`, all
  of which are currently unmapped.

## Impact

- `packages/core/src/renderer.ts` (`buildTemplateData`)
- `packages/core/src/sampler.ts` (`getPlanSample()` /
  `getTemplateSample()` need updating to include the new `Plan`/`Template`
  fields, since `Plan` and `Template` now require them)
- Core test suite: existing plan/template fixtures across
  `tests/renderer.test.ts`, `tests/schema.test.ts`, and the CLI tests
  under `tests/cli/` need updating for the now-required `patient`,
  `appointments`, and `outcome` fields, plus new coverage for the four
  newly-mapped fields
