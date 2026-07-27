## Why

A goal's target date is not always a specific calendar date — staff often only know a relative milestone (e.g. "by next
visit") at plan-authoring time, or want to give both ("by next visit, 2026-08-01") for extra clarity. `Goal.doneBy` in
`Plan` was recently changed (in-progress, uncommitted) from a single ISO date to an object with two independent optional
fields, `date` and `relative`, but that raw object literal isn't wrapped in `z.object(...)`, so it isn't yet a valid zod
schema, and nothing downstream (`convertData`, `Template`) knows how to turn the two fields into the single display
string a docx template expects. This change fixes the schema and defines how the two fields combine.

## What Changes

- Fix `Goal.doneBy` in `packages/core/src/schema/plan.ts` to be a proper optional zod object:
  `{ date?: string (ISO), relative?: string }`.
- Add a `format.goal.doneBy` pattern to `Config` (`packages/core/src/schema/config.ts`) — a template string with
  `{date}` and `{relative}` placeholders (e.g. `"{date}, {relative}"`), used only when both `date` and `relative` are
  given.
- **BREAKING**: `convertData` (`packages/core/src/renderer.ts`) SHALL derive each goal's `Template` `doneBy` string as
  follows:
  - neither `date` nor `relative` given → `doneBy` stays `undefined`
  - exactly one of `date`/`relative` given → `doneBy` is that value (with `config.format.date` applied if it's the date)
  - both given → `doneBy` is `config.format.goal.doneBy` with `{date}` substituted by the formatted date and
    `{relative}` substituted by the relative term
- Add a sensible default `format.goal.doneBy` pattern to `DEFAULT_CONFIG`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `plan-schema`: `Goal.doneBy` becomes a proper optional object with `date`/`relative` fields instead of the current
  invalid raw-object literal (fixing an in-progress, not-yet-committed schema edit).
- `config`: `Config.format` gains a nested `goal.doneBy` pattern (with `{date}`/`{relative}` placeholders) alongside the
  existing `date` pattern; `DEFAULT_CONFIG` includes a default value for it.
- `renderer`: `convertData`'s goal `doneBy` derivation changes from "format the single ISO date, or leave undefined" to
  the three-way date/relative/both logic described above.

## Impact

- `packages/core/src/schema/plan.ts`: `Goal.doneBy` shape fix (object wrapped in `z.object`, marked `.optional()`).
- `packages/core/src/schema/config.ts`: new `format.goal.doneBy` key, `DEFAULT_CONFIG` addition.
- `packages/core/src/renderer.ts`: new goal `doneBy` assembly logic (likely a small helper function alongside the
  existing `dateStr` usage).
- Any plan JSON that used the old single ISO-string `Goal.doneBy` shape (before the in-progress schema edit) is already
  invalid under the current uncommitted schema and must move to `{ date, relative }`; this change doesn't add new
  breakage beyond what the in-progress schema edit already introduced.
- Existing `Config`/config JSON files need a `format.goal.doneBy` key added, since `Config` requires every key in every
  section (`resolveConfig` has no partial-merge behavior).
