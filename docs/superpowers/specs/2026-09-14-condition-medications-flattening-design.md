# Condition-driven medications/diseases flattening

## Problem

Medications and conditions/diseases currently must be entered twice in a `Plan`:
once as short summary strings in `objective.medical` (`medications`, `diseases`)
and again in full detail per-condition in `conditions[].medications` /
`conditions[].description`. The tool should let the user enter this data once,
under `conditions`, and derive the short-form `Medical` summary automatically
when generating the `Template`.

## Schema changes

### `packages/core/src/schema/plan.ts`

- `Medical`: remove `medications` and `diseases`. Remaining fields: `bmi`,
  `allergies`, `asa`, `referrals`.
- New `Medication` model: `{ name?: string, description?: string }`.
- `Condition`: add `name?: string` (short label, e.g. disease/condition name).
  Change `medications` from `z.string().optional()` to
  `z.array(Medication).default(() => [])`.
- All other `Condition` fields (`description`, `adverse`, `interactions`,
  `modifications`, `recommendations`) are unchanged.

### `packages/core/src/schema/template.ts`

No shape changes. `Objective.Medical.medications` / `.diseases` and
`Condition.description` / `.medications` remain `z.string().optional()` —
they are the rendered/flattened form; only how the converter fills them
changes.

### `packages/core/src/schema/config.ts`

Split `format` into two top-level buckets, both singular, matching the
existing `format` / `mapping` naming convention:

- `format`: strings containing `{placeholder}` tokens, applied via
  `.replace()`.
- `delimiter` (new): plain join strings, applied via `.join()`.

```
format: {
  date: string,                  // unchanged: "MM/DD/YYYY"
  goal: { doneBy: string },      // unchanged: "{date} / {relative}"
  vitals: string,                // unchanged: "Appointment {date}: {vitals}"
  conditionMedication: string,   // new: "{name} ({description})"
  conditionDescription: string,  // new: "{name} - {description}"
}
delimiter: {
  visits: string,                // moved from format.visits, default ", "
  medicalMedications: string,    // new, default ", "
  medicalDiseases: string,       // new, default ", "
  conditionMedications: string,  // new, default ", "
}
mapping: { need, outcome, exists }  // unchanged
```

`format.visits` is removed; its one use site (`converter.ts`, joining
formatted visit dates) moves to `delimiter.visits`. `DEFAULT_CONFIG` and any
config fixtures/tests referencing `format.visits` update accordingly.

## Converter logic (`packages/core/src/converter.ts`)

Shared helper:

```ts
function formatNameDescription(
  name: string | undefined,
  description: string | undefined,
  pattern: string,
): string | undefined {
  if (name && description) {
    return pattern.replace("{name}", name).replace("{description}", description);
  }
  return name ?? description;
}
```

If both `name` and `description` are present, the pattern is applied. If
only one is present, it's returned as-is — the pattern is never applied
with a missing side, avoiding stray literal text or separators (e.g. an
empty `" ()"` or `" - "`). If neither is present, the result is `undefined`.

### `Medical.medications` / `Medical.diseases`

- `medications` = every `condition.medications[*].name` across all
  `plan.conditions` that is defined and non-empty, joined with
  `config.delimiter.medicalMedications`. (Only names are used, not
  descriptions — this is the short summary form.)
- `diseases` = every `condition.name` across `plan.conditions` that is
  defined and non-empty, joined with `config.delimiter.medicalDiseases`.

The medical block is built (rather than passed through unchanged) whenever
`plan.objective.medical` is set, `hasVitals` is true, or either derived
string is non-empty. Otherwise it stays `undefined`, matching current
behavior of omitting an entirely-empty medical section.

### Per-condition `Template.Condition`

For each `plan.conditions[i]`:

- `description` = `formatNameDescription(condition.name, condition.description, config.format.conditionDescription)`
- `medications` = each `Medication` in `condition.medications` formatted via
  `formatNameDescription(m.name, m.description, config.format.conditionMedication)`,
  filtered to defined/non-empty results, joined with
  `config.delimiter.conditionMedications`
- `adverse`, `interactions`, `modifications`, `recommendations`: unchanged
  pass-through

## Other touch points

- `packages/core/src/sampler.ts`: sample `Plan` data must use the new
  `Condition.name` / `Condition.medications: Medication[]` shape, and drop
  `objective.medical.medications` / `.diseases`.
- Tests referencing removed/changed fields: `packages/core/tests/converter.test.ts`,
  `packages/core/tests/renderer.test.ts`, `packages/cli/tests/dhplan-render.test.ts`,
  `packages/cli/tests/dhplan-inspect.test.ts`, `packages/cli/tests/dhplan-validate.test.ts`.
- `packages/pwa/src/import.ts`: check for references to the removed
  `Medical.medications` / `.diseases` or old `Condition.medications` string
  shape and update to the new shapes.

## Out of scope

- No PWA UI changes for editing the new `Condition.name` / `Medication[]`
  fields are specified here beyond what's needed to keep existing
  import/validation working — a follow-up spec covers UI editing if needed.
