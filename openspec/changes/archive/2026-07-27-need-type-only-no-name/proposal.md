## Why

`Need` (`packages/core/src/schema/plan.ts`) currently requires both `type` (the enum category) and `name` (a required
free-text label). This duplicates what `Config.mapping.need[type]` already provides — the canonical display label for a
need category — and is a common source of malformed `Plan` JSON, since every need's `name` must be filled in by hand
even though it's derivable from `type`. `Statement.need` (the unmet-need label) is already derived from
`config.mapping.need[need.type]`, not from `Need.name` — `assessments[].need` should follow the same pattern instead of
carrying its own redundant free-text field.

## What Changes

- **BREAKING**: Remove `name` from `Need` (`packages/core/src/schema/plan.ts`) — `Need` SHALL have only `type`, `isMet`,
  `relatedTo`, `evidencedBy`, and `goals`.
- `convertData` (`packages/core/src/converter.ts`) derives each `assessment.need` from `config.mapping.need[need.type]`
  (the canonical display label), the same way `statement.need` is already derived, instead of copying `need.name`.
- Update the PWA plan editor (`packages/pwa/src/components/NeedCard.tsx`) to stop setting `name` when constructing a
  `Need` object.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `plan-schema`: `Need` no longer has a `name` field — only `type`, `isMet`, `relatedTo`, `evidencedBy`, `goals`.
- `converter`: `convertData`'s `assessments` mapping changes from copying `need.name` to deriving `assessment.need` from
  `config.mapping.need[need.type]`, matching how `statement.need` is already derived.

## Impact

- `packages/core/src/schema/plan.ts`: `Need.name` field removed.
- `packages/core/src/converter.ts`: `assessments` mapping now reads from `config.mapping.need`, not `need.name`.
- `packages/core/src/sampler.ts`: sample `Plan` data no longer sets `name` on its needs.
- `packages/pwa/src/components/NeedCard.tsx`: no longer sets `name` when constructing a `Need`.
- `packages/core/tests/converter.test.ts`, `packages/core/tests/plan.test.ts`, `packages/core/tests/validator.test.ts`,
  `packages/core/tests/renderer.test.ts`, and CLI fixture tests that construct a `Need` with `name` need updating to
  drop it — and the "Deriving a statement's need label from the config, not the plan's free-text name" converter
  scenario becomes moot (no more free-text `name` to differ from) and should be removed/replaced.
- Zod objects are not strict by default, so an existing `Plan` document that still has a `name` field on a need
  continues to parse fine (the extra key is silently ignored) — no migration is required for old data, but `name` is no
  longer read anywhere.
