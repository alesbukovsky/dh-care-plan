## Context

`packages/pwa` is a Vite + React 19 + Tailwind 4 app currently rendering only a placeholder `App.tsx`. The `_demo`
folder is a standalone prototype (plain CSS, localStorage, needs wheel, edit/preview toggle) that informs the desired
panes but is **not** wired into this workspace and uses different conventions (no Tailwind, no `dh-care-plan` core
types). `packages/core` already exports `Plan`, `Need`, and `getPlanSample()` which this change will consume directly
instead of `_demo`'s local `types.ts`/`data/needs.ts`.

This change builds the real PWA shell from scratch inside `packages/pwa`, using `_demo` only as visual/UX reference —
not as code to port — and deliberately drops the pieces of `_demo` the user doesn't want (needs wheel indicator,
edit/preview toggle, persistence).

## Goals / Non-Goals

**Goals:**

- Three-pane responsive layout: command bar / patient case / plan editor.
- Command bar collapses to icon rail with tooltips; shows placeholder actions + version.
- Plan editor renders `getPlanSample()` needs as independently collapsible, editable cards (prefilled PES-style
  sentence, goals, interventions, outcome), matching `_demo`'s mad-lib editing pattern.
- Patient case pane is a plain paste target (controlled text state, no formatting/preview).
- Everything driven by local component state (`useState`) — no external store, no persistence.

**Non-Goals:**

- No localStorage/import/export/docx logic (buttons are inert placeholders).
- No PWA tests for this change (per user direction — visuals first).
- No needs-completion wheel/progress indicator.
- No edit/preview toggle on the case pane.
- No add/remove/reorder of needs themselves — the set of needs is fixed to the sample plan; only each need's fields
  (relatedTo, evidencedBy, goals, interventions, outcome) are editable.

## Decisions

**Component layout — three sibling components composed in `App.tsx`** `App.tsx` holds top-level state (`plan`,
`caseText`, `commandBarCollapsed`) and renders `<CommandBar>`, `<CaseStudyPane>`, `<PlanEditor>` in a CSS grid/flex row.
Rationale: mirrors `_demo`'s `App.tsx` state-lifting pattern, keeps each pane a pure presentational component, easy to
later swap in real persistence without touching layout.

**Styling — Tailwind utility classes, no new CSS file** The PWA already depends on `@tailwindcss/vite` and
`tailwindcss`; `_demo` uses hand-written CSS variables instead. Rather than porting `_demo/src/styles/index.css`, this
change re-expresses the same visual intent (panes, card borders, muted rail) with Tailwind utilities directly in JSX,
consistent with the existing (if minimal) `App.tsx` which already uses Tailwind classes. Alternative considered: port
`_demo`'s CSS wholesale — rejected to avoid two competing styling systems in one small app.

**Command bar collapse — local boolean state, CSS width transition** `commandBarCollapsed` boolean in `App.tsx`, passed
down as a prop. Collapsed state renders icon-only buttons with a native `title` attribute for the hover tooltip (no
tooltip library needed for placeholder-fidelity). Alternative considered: a headless tooltip component — deferred as
unnecessary complexity for this visuals-first pass.

**Plan data source — `getPlanSample()` from `dh-care-plan`** The plan editor seeds from `getPlanSample()` (already
exported from `packages/core`) instead of hand-rolled mock data, so the shape always matches the real `Plan`/`Need` zod
schema and this work doesn't need to be redone when persistence lands.

**Need card collapse — independent per-card state** Each need card (`NeedCard`) owns its own `expanded` boolean via
`useState`, matching `_demo/src/components/NeedCard.tsx`'s pattern. No shared "expand all" control in this change (not
requested).

**Need card editing — controlled `Need` object, lifted through `Plan` state** `NeedCard` takes `need` and
`onChange(next: Need)`; `PlanEditor` maps over `plan.needs` and replaces the edited index, calling `App`'s `setPlan`.
This keeps the single source of truth in `App.tsx` (ready to swap for real persistence later) while each card stays a
plain controlled form. The card body follows `_demo/src/components/NeedCard.tsx` directly: two toggle buttons ("Need is
met" / "Need is unmet — build plan") shown first; selecting "met" collapses the body to a short static note (detail
fields hidden), otherwise the full detail fields render below — the `relatedTo`/`evidencedBy` fields as a single
prefilled sentence with two inline blanks (the PES-row mad-lib), editable goals/interventions arrays with add/remove,
and an evaluation note textarea. The core `Need.outcome.status` enum keeps its third `"partial"` value (pre-existing in
`packages/core`, not something this change removes), but the UI exposes only the two demo buttons; "partial" only
surfaces as the header status pill for data that already carries it.

**Case pane — plain `<textarea>`** A single controlled `<textarea>` bound to `caseText` state satisfies "paste text, no
edit/preview toggle." Simpler than `_demo`'s `CaseStudyPane` (which has edit/preview modes) — explicitly dropping that
toggle per requirement.

## Risks / Trade-offs

- [Risk] Tailwind-only styling may visually diverge from `_demo`'s exact look → Mitigation: this change targets
  equivalent _layout and interaction structure_, not pixel parity; acceptable since `_demo` is reference-only, not a
  spec.
- [Risk] Skipping tests now means no regression safety net for this UI → Mitigation: explicitly scoped out by user
  request; a follow-up change should add PWA tests once the shell stabilizes.
- [Risk] Native `title` tooltips are less discoverable/stylable than a custom tooltip → Mitigation: acceptable for a
  placeholder-fidelity pass; can be upgraded later without layout changes.

## Migration Plan

Not applicable — greenfield UI in an already-placeholder package; no existing users/data to migrate.

## Open Questions

None outstanding; visuals-first scope keeps decisions low-risk and reversible.
