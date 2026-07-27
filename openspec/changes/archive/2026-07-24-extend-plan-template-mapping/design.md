## Context

`Plan` (`packages/core/src/schema/plan.ts`) and `Template` (`packages/core/src/schema/template.ts`) have grown
independently since `buildTemplateData` (`packages/core/src/renderer.ts`) was last written:

- `Plan` gained a required top-level `patient` (`Patient`: `initials`, `dob`, `chartId`) and `appointments` (array of
  ISO dates).
- `Need` gained an optional `interventions` (`string[]`) and a required `outcome` (`Outcome`:
  `status: "met" | "partial" | "unmet"`, optional `note`).
- `Template` mirrors `patient` and `appointments` at the top level with the identical shape, and `Statement` gained a
  matching optional `interventions` and a required `outcome` — but `Template`'s `Outcome` shape is
  `{ label: string, note?: string }`, not `{ status, note? }`, because `status` is an internal enum value while `label`
  is the display text a docxtemplater template actually renders.

`buildTemplateData` currently only maps `needs[].{name, isMet, relatedTo, evidencedBy, goals}` into
`assessments`/`statements`; none of the four new-ish fields above are populated on its `Template` output.

## Goals / Non-Goals

**Goals:**

- Map every field on `Plan` to the corresponding field(s) on `Template`, per the field-by-field decisions below
  (confirmed with the user).
- Keep `getPlanSample()`/`getTemplateSample()` (`packages/core/src/sampler.ts`) and existing test fixtures valid against
  the now-larger `Plan`/`Template` schemas.

**Non-Goals:**

- Changing the `Plan` or `Template` zod schemas themselves — they're already in their target shape; only the mapping
  function and samples/fixtures need to catch up.
- Any UI/CLI-facing changes beyond what naturally follows from `buildTemplateData` covering more fields (no new commands
  or flags).

## Decisions

- **`patient`: direct 1:1 copy.** `Plan.patient` and `Template.patient` are structurally identical, so
  `buildTemplateData` copies the object straight through with no transform.

- **`appointments`: direct 1:1 copy, preserving order.** Same shape (an array of ISO date strings) on both sides; no
  sorting, filtering, or reformatting.

- **`interventions`: direct 1:1 copy per statement, defaulting to `[]`.** Only unmet needs become statements (existing
  behavior), so `interventions` only ever appears there — copied as-is from the source `Need`, or `[]` if the `Need` has
  no `interventions`. Met needs (assessments) don't carry interventions in either schema, so no decision is needed
  there.

- **`outcome`: `note` copies 1:1; `status` maps to `label` via a fixed lookup table**, confirmed with the user:
  - `"met"` -> `"Met"`
  - `"partial"` -> `"Partially met"`
  - `"unmet"` -> `"Not met"`

  Rationale: `status` is a machine-readable enum for the plan data format, while `Template.Outcome.label` is prose meant
  to appear verbatim in the rendered document — a docxtemplater template can't do this lookup itself (no built-in
  switch/case in the expression language used here), so `buildTemplateData` is the natural place for it. The lookup is a
  plain object/switch, not derived from the enum values themselves, so it stays correct even if enum casing changes
  independently of the display text.

- **Sample/fixture updates are mechanical, not a design decision**: `getPlanSample()` needs a `patient`, `appointments`,
  and per-need `outcome` (and can exercise `interventions` on the unmet need, per the existing pattern of showing every
  optional field at least once); `getTemplateSample()` continues to derive from `buildTemplateData(getPlanSample())` so
  it stays consistent automatically. Existing test fixtures across `renderer.test.ts`, `schema.test.ts`, and the
  `tests/cli/*` suite need the same additions wherever they construct a `Plan`-shaped object, or they'll fail
  `Plan.parse`/`Plan.safeParse` now that `patient`, `appointments`, and `outcome` are required.

## Risks / Trade-offs

- [Outcome label lookup gets out of sync if a new `status` enum value is added later without updating the lookup] →
  mitigated by making the lookup exhaustive over the `status` union type, so TypeScript flags a missing case at compile
  time if `Outcome.status`'s enum grows.
- [Existing fixtures across several test files need near-identical additions (`patient`, `appointments`, `outcome`)] →
  mechanical, low-risk changes; no behavior change to existing assertions, only fixture data.
