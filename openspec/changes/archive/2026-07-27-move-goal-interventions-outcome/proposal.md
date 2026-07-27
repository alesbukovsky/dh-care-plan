## Why

`interventions` and `outcome` currently live on `Need`, as one shared list/outcome for the whole need — but clinically
each `Goal` has its own interventions and its own outcome (met/partial/unmet + note). A need with multiple goals (e.g.
"floss daily" and "reduce sugar intake") cannot today record that one goal is met while another is unmet, or which
interventions support which goal. The schema shape must move to match the domain: each `Goal` carries `interventions`
and `outcome`, not the `Need`.

## What Changes

- **BREAKING**: Remove `interventions` and `outcome` from `Need` in `packages/core/src/schema/plan.ts`.
- **BREAKING**: Add `interventions` (`z.array(z.string()).optional()`) and `outcome` (the existing `Outcome` shape:
  `status` + optional `note`) to `Goal`.
- `Need.isMet` stays on `Need` (it reflects the assessment-level met/unmet flag independent of per-goal outcomes) but
  `Need` no longer carries a single `outcome`/`interventions` pair of its own.
- **BREAKING**: Move `interventions` and `outcome` from `Statement` to `Statement.goals[]` (the template `Goal`) in
  `packages/core/src/schema/template.ts`, mirroring the `Plan` restructure so the printed output shows each goal with
  its own interventions and outcome instead of one shared pair per need.
- Update `convertData` (`packages/core/src/converter.ts`) so each rendered goal derives its own `interventions` and
  `outcome` from the corresponding `Plan` goal, rather than the whole `Statement` deriving one shared pair from the
  `Need`.
- Update the PWA (`NeedCard.tsx`, `App.tsx`) so the outcome toggle (met/partial/unmet) and interventions list are edited
  per-goal instead of once per need.
- Update `sampler.ts` sample data to the new shape.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `plan-schema`: `Goal` gains `interventions` and `outcome` fields; `Need` no longer has `interventions` or `outcome`.
- `converter`: `convertData`'s mapping of interventions/outcome changes source from `Need` to `Need.goals[]`, and target
  from `Statement` to `Statement.goals[]`.
- `template-schema`: `Statement.goals[]` (the template `Goal`) gains `interventions` and `outcome`; `Statement` no
  longer has its own `interventions`/`outcome` fields.
- `pwa-shell`: the need-card detail view moves the outcome toggle and interventions list from once-per-need to
  once-per-goal.

## Impact

- **Schema**: `packages/core/src/schema/plan.ts` (`Need`, `Goal`).
- **Conversion**: `packages/core/src/converter.ts` (`convertData`).
- **Template schema**: `packages/core/src/schema/template.ts` (`Statement`, `Goal`).
- **Sample data**: `packages/core/src/sampler.ts`.
- **PWA UI**: `packages/pwa/src/components/NeedCard.tsx` (outcome toggle + interventions list currently rendered once
  per need, at the need level, outside the goals loop).
- **Config/mapping**: `packages/core/src/schema/config.ts`'s `mapping.outcome` (status → label) is unaffected in shape,
  only in what data feeds it.
- **Existing spec docs to update**: `openspec/specs/plan-schema/spec.md`, `openspec/specs/converter/spec.md`,
  `openspec/specs/pwa-shell/spec.md` (`openspec/specs/config/spec.md` references `Need.outcome.status` in prose and will
  need wording updates but its mapping shape requirement is unchanged).
- Any existing sample/fixture `Plan` JSON documents with `Need.interventions`/`Need.outcome` will no longer validate and
  must be migrated to the new per-goal shape (no automated migration is in scope — this is a breaking schema change with
  no released consumers yet).
