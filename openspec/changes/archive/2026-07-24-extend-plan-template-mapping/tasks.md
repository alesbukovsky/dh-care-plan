## 1. Map the new fields

- [x] 1.1 Copy `plan.patient` to `Template.patient` unchanged in `buildTemplateData`
- [x] 1.2 Copy `plan.appointments` to `Template.appointments` unchanged, preserving order
- [x] 1.3 Copy each unmet need's `interventions` onto its `Statement`, defaulting to `[]` when absent
- [x] 1.4 Add an exhaustive `status` -> `label` lookup (`"met"` -> `"Met"`, `"partial"` -> `"Partially met"`, `"unmet"`
      -> `"Not met"`) and use it to build each statement's `outcome` (`label` from the lookup, `note` copied 1:1 from
      the need's `outcome.note`)

## 2. Update samples and fixtures

- [x] 2.1 Update `getPlanSample()` (`packages/core/src/sampler.ts`) to include `patient`, `appointments`, and an
      `outcome` on both sample needs, and `interventions` on the unmet need
- [x] 2.2 Fix any `Plan`-shaped fixtures in `tests/renderer.test.ts`, `tests/schema.test.ts`, `tests/validator.test.ts`
      (not originally listed, but hit the same missing-field issue), and `tests/cli/*` that are now missing `patient`,
      `appointments`, or `outcome`

## 3. Tests

- [x] 3.1 Add unit tests for `buildTemplateData` covering: `patient`/ `appointments` passthrough, `interventions` copy
      and default-to-`[]`, and the `status` -> `label` mapping for all three status values
- [x] 3.2 Run `bun test:core` and confirm it passes
