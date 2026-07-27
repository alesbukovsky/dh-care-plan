## Why

`Template.Assessment` (the per-need row in the assessments list) currently carries only `need` (the category label) and
`isMet` (a raw boolean), and lacks `relatedTo`/`evidencedBy` context that's already available on `Statement` for unmet
needs. A `.docx` template author placing an assessment row can't show why a need is unmet, and can't place a
human-readable "is this need unmet?" label without hand-rolling boolean-to-string logic outside the schema — every other
status-like field in `Template` (`Statement.need`, `Goal.outcome.label`) is already a display string derived from
`Config`, not a raw enum/boolean.

## What Changes

- **BREAKING**: `Template.Assessment` (`packages/core/src/schema/template.ts`) gains `relatedTo` and `evidencedBy` (both
  `z.string().optional()`), copied verbatim from the source `Need` (undefined when the `Need` doesn't have them — met
  needs typically won't).
- **BREAKING**: `Template.Assessment.isMet` (`z.boolean()`) is replaced by `Assessment.isUnmet` (`z.string()`), a
  display label derived from `Need.isMet` via a new, generic `Config.format.boolean` pair, not a raw boolean.
- Add `Config.format.boolean` (`{ true: z.string(), false: z.string() }`) — a generic boolean-to-display-label pair, NOT
  specific to `isUnmet` or any single field; it's the shared formatter for any boolean value `convertData` renders as a
  string. `DEFAULT_CONFIG` sets `format.boolean.true` to `"Yes"` and `format.boolean.false` to `"No"`.
- `convertData` (`packages/core/src/converter.ts`) copies `need.relatedTo`/`need.evidencedBy` onto each `assessment` and
  derives `assessment.isUnmet` from `config.format.boolean[!need.isMet ? "true" : "false"]` — i.e. a need that is _not_
  met (`isMet: false`) renders `format.boolean.true` (`"Yes"`, yes it's unmet), and a need that _is_ met (`isMet: true`)
  renders `format.boolean.false` (`"No"`, not unmet) — instead of copying `need.isMet` directly.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `template-schema`: `Assessment` gains optional `relatedTo`/`evidencedBy`; `Assessment.isMet` (boolean) is replaced by
  `Assessment.isUnmet` (string label).
- `config`: `Config.format` gains a generic `boolean` pair (`{ true, false }` display labels, for any boolean value, not
  just `isUnmet`), with `DEFAULT_CONFIG` defaults `"Yes"`/`"No"` respectively.
- `converter`: `convertData`'s `assessments` mapping copies `relatedTo`/`evidencedBy` from each `Need` and derives
  `assessment.isUnmet` from `config.format.boolean`, instead of copying `need.isMet` as a raw boolean.

## Impact

- `packages/core/src/schema/template.ts`: `Assessment` shape change (`relatedTo`/`evidencedBy` added, `isMet` →
  `isUnmet`).
- `packages/core/src/schema/config.ts`: new generic `format.boolean` pair, `DEFAULT_CONFIG` update.
- `packages/core/src/converter.ts`: `assessments` mapping updated to copy `relatedTo`/`evidencedBy` and derive `isUnmet`
  from `format.boolean` applied to `!need.isMet`.
- Any `.docx` template that currently places an `{assessments.isMet}`-style boolean tag needs to switch to
  `{assessments.isUnmet}` (a string) — **BREAKING** for any such template; no fixtures in this repo currently do this
  (fixtures use `need`/`isMet` only in JSON test data, not in a real `.docx` template).
- `packages/core/tests/converter.test.ts`, `packages/core/tests/cli/dhplan-inspect.test.ts`, and any config
  fixtures/tests constructing a full `Config` need updating for the new `format.boolean` pair and the new
  `assessments[].isUnmet`/`relatedTo`/`evidencedBy` shape.
- `packages/core/src/templater.ts`: `createTemplater` now defaults `nullGetter` to `() => ""` (still overridable via
  `options`), so a real render (not just `validateTemplate`'s inspection pass) treats an `undefined`/`null` tag value
  (e.g. an assessment's absent `relatedTo`/`evidencedBy`) as an empty string instead of throwing or rendering
  `"undefined"`.
