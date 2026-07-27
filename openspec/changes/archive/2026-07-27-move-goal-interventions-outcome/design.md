## Context

`Need` (in `packages/core/src/schema/plan.ts`) currently owns a single `interventions: string[]` and a single
`outcome: { status, note }`, alongside `goals: Goal[]`. Clinically, interventions and outcome tracking belong to each
goal, not the need as a whole — a need with two goals should be able to show one goal met and another unmet, each with
its own supporting interventions.

The `Template` schema (`packages/core/src/schema/template.ts`) mirrors this today: `Statement` (the printed, per-need
block) has one `interventions`/`outcome` pair and an array of `Goal`s (`label`, `task`, `doneBy`) with no
interventions/outcome of their own. `convertData` (`packages/core/src/converter.ts`) currently copies
`Need.interventions`/`Need.outcome` straight onto the `Statement`.

Per the proposal, `Plan.Goal` gains `interventions`/`outcome` and `Plan.Need` loses them. This design also moves
`Template.Statement`'s `interventions`/`outcome` down onto `Template.Goal`, so the printed output mirrors the data model
1:1 — each rendered goal shows its own interventions and outcome, rather than one aggregated pair per need.

## Goals / Non-Goals

**Goals:**

- Move `interventions` and `outcome` from `Need` to `Goal` in `Plan` (`packages/core/src/schema/plan.ts`).
- Move `interventions` and `outcome` from `Statement` to `Goal` in `Template` (`packages/core/src/schema/template.ts`).
- Update `convertData` to map each `Plan` goal's `interventions`/`outcome` onto the corresponding rendered goal.
- Update the PWA (`NeedCard.tsx`) so each goal in the expanded need view has its own outcome toggle and interventions
  list, instead of one toggle/list per need.
- Keep `Need.isMet` on `Need` — it is a need-level assessment flag (used to decide which needs get a `Statement` at all
  in `convertData`), independent of any individual goal's outcome status.

**Non-Goals:**

- No change to `Need.type`, `Need.name`, `Need.relatedTo`, `Need.evidencedBy`, or `Assessment`.
- No automated migration of existing sample/fixture `Plan` documents — this is a breaking schema change with no released
  external consumers; `sampler.ts` is updated in place instead.
- No change to `config.mapping.outcome` (status → label) shape — only what feeds it changes.
- No attempt to preserve backward compatibility (e.g. accepting both old and new shapes) — CLAUDE.md project convention
  is to change code directly rather than add compatibility shims.

## Decisions

### 1. `Outcome` shape is unchanged, just relocated

`Outcome = { status: "met" | "partial" | "unmet", note?: string }` stays exactly as defined; only its owner changes
(`Need` → `Goal` in `plan.ts`, `Statement` → `Goal` in `template.ts`). No new fields, no renamed fields — this keeps
`config.mapping.outcome[status]` valid as-is.

### 2. A `Goal` with no `outcome` is invalid — `outcome` is required on `Goal`, not optional

**Decision:** `Goal.outcome` is a required field (matching how `Need.outcome` was required today), so every goal must
declare a status. `Goal.interventions` stays optional (`z.array(z.string()).optional()`), matching how it was optional
on `Need`.

**Alternative considered:** making `outcome` optional on `Goal` and defaulting to some "not started" status in the
converter. Rejected — `Outcome.status` has no "not started" value in the enum, and a goal without a declared outcome is
a data-entry gap that should surface immediately (validation failure) rather than being silently defaulted.

### 3. Template restructure: per-goal interventions/outcome (chosen over statement-level aggregation)

**Decision:** `Template.Goal` gains `interventions?: string[]` and `outcome: Outcome` (same required/optional split as
the `Plan` side); `Template.Statement` drops its own `interventions`/`outcome` fields entirely. `convertData` maps each
`Plan` goal's `interventions`/`outcome` onto the matching rendered goal.

**Alternative considered:** keep `Statement`'s single `interventions`/`outcome` and have `convertData` aggregate across
a need's goals (concatenate interventions, resolve outcome via worst-status-wins). Rejected (explicit product decision)
because it silently discards per-goal detail in the one place — the printed output — where it matters most, and
reintroduces the same one-size-fits-all shape this change is meant to eliminate.

### 4. `convertData`'s goal-mapping closure gains two more fields, no new helper functions

`convertData`'s existing `goals: (need.goals ?? []).map((goal, goalIndex) => ({ label, task, doneBy }))` closure is
extended to also emit `interventions: goal.interventions ?? []` and
`outcome: { label: config.mapping.outcome[goal.outcome.status], note: goal.outcome.note }` per goal. This mirrors the
exact mapping logic previously done once per statement, just moved inside the per-goal map and reading from `goal`
instead of `need`.

### 5. PWA: outcome toggle and interventions list move inside the per-goal block

**Decision:** In `NeedCard.tsx`, the "Need is met / unmet" toggle buttons and the interventions list/add/remove controls
move from the need-level expanded section into each goal's block (alongside the existing task/doneBy fields), so each
goal gets its own toggle and its own interventions list. The evaluation note field similarly moves per-goal
(`goal.outcome.note` instead of `need.outcome.note`).

The need-level `relatedTo`/`evidencedBy` sentence and the need-level met/unmet status pill in the card header stay as
they are — `Need.isMet` still exists and still drives whether the need shows the "unmet" detail section at all. Only the
interventions/outcome editing UI moves down a level, from "once per need" to "once per goal, repeated for each goal in
the list".

**Alternative considered:** keep a single outcome toggle at the need level that sets `isMet` (as today), and add a
_separate_ per-goal outcome/interventions block underneath. Rejected — this creates two overlapping "outcome" concepts
(need-level `isMet` and goal-level `outcome.status`) with no clear reconciliation rule, and the proposal's premise is
that outcome belongs to the goal, not the need.

### 6. Every goal must render an outcome toggle, including a newly-added goal with no outcome yet

**Decision:** `addGoal()` in `NeedCard.tsx` initializes new goals with `outcome: { status: "unmet" }` (rather than
omitting `outcome`), since `Goal.outcome` is required. This mirrors today's need-level default (a freshly-expanded need
defaults to showing the unmet detail section).

## Risks / Trade-offs

- **[Risk]** Existing hand-written sample/fixture `Plan` JSON with `Need.interventions`/`Need.outcome` will fail schema
  validation after this change. → **Mitigation:** `sampler.ts` is updated as part of this change (see tasks.md); no
  other fixtures exist in the repo today (confirmed via search for `interventions`/`outcome` usage).
- **[Risk]** Making `Goal.outcome` required (not optional) means any goal added programmatically without an explicit
  status will fail validation. → **Mitigation:** the PWA's `addGoal()` sets a default `outcome.status` immediately,
  matching decision 6; this is the only goal-creation call site in the codebase.
- **[Trade-off]** Moving interventions/outcome to per-goal in the printed `Template` means a need with several goals now
  renders several interventions lists / outcome blocks instead of one combined block. This is the intended clinical
  improvement, not an accidental side effect, but changes the visual density of the printed output.

## Migration Plan

This is a pre-release, no-external-consumers change (per CLAUDE.md conventions, no backward-compatibility shims are
added). Steps: update `plan.ts` and `template.ts` schemas, update `converter.ts`, update `sampler.ts`, update the PWA,
update the affected spec docs, run `bun test:all` and `bun lint:fix`. No rollback strategy beyond reverting the commit —
there is no persisted data to migrate.

## Open Questions

None — the folding-strategy decision (design decision 3) was the one open question and has been resolved.
