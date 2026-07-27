## Why

The rendered `.docx` document shows appointments as a single comma-separated sentence, not a list, but
`Template.appointments` is currently `z.array(z.string())` — a per-entry array of formatted date strings. Template
authors placing the `appointments` tag get an array where they need one joined string, and there's no way to control the
separator between dates.

## What Changes

- **BREAKING**: `Template.appointments` (`packages/core/src/schema/template.ts`) changes from `z.array(z.string())` to
  `z.string()` — one joined string instead of one entry per date.
- `convertData` (`packages/core/src/converter.ts`) joins `plan.appointments`'s formatted date strings into that single
  string, using a configurable separator, instead of returning the array unjoined.
- Add `format.appointment` (`z.string()`, a plain separator string) to `Config` (`packages/core/src/schema/config.ts`),
  with `DEFAULT_CONFIG.format.appointment` set to `", "`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `template-schema`: `Statement`'s sibling field `appointments` on `Template` changes from an array of date strings to a
  single joined string.
- `config`: `Config.format` gains an `appointments` key (a plain separator string, `", "` default) controlling how
  `convertData` joins appointment dates into `Template.appointments`.
- `converter`: `convertData`'s `appointments` mapping changes from "one formatted string per entry" to "all formatted
  entries joined into one string using `config.format.appointment`".

## Impact

- `packages/core/src/schema/template.ts`: `appointments` field type change.
- `packages/core/src/schema/config.ts`: new `format.appointment` key, `DEFAULT_CONFIG` update.
- `packages/core/src/converter.ts`: `convertData`'s appointments mapping now joins instead of mapping to an array.
- Any `.docx` template that previously looped over the `appointments` array (e.g. `{#appointments}...{/appointments}`)
  must instead use `{appointments}` as a plain tag. No such templates exist in this repo yet (fixtures use tag-only
  content), so no fixture updates are anticipated, but this is a breaking change for any external template already built
  against the array shape.
- `packages/core/tests/converter.test.ts`, `packages/core/tests/renderer.test.ts`, and any config fixtures/tests
  constructing a full `Config` need updating for the new `format.appointment` key and the joined `appointments` string.
