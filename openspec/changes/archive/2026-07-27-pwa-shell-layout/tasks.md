## 1. App shell & state

- [x] 1.1 Replace `packages/pwa/src/App.tsx` placeholder with a three-column layout (grid/flex) rendering `CommandBar`,
      `CaseStudyPane`, `PlanEditor`.
- [x] 1.2 Lift state in `App.tsx`: `plan` (seeded from `getPlanSample()`), `caseText` (string, initially empty),
      `commandBarCollapsed` (boolean, initially false).

## 2. Command bar

- [x] 2.1 Create `packages/pwa/src/components/CommandBar.tsx` with expanded view: placeholder buttons for "Import data",
      "Export data", "Generate plan", "Configure" (as separate items), and a version label.
- [x] 2.2 Add collapse/expand toggle control to `CommandBar`; collapsed state renders icon-only buttons with `title`
      tooltips for each action.
- [x] 2.3 Wire placeholder actions as no-ops (e.g. `onClick={() => {}}` or console-log stub) — no persistence/file I/O.
- [x] 2.4 Do not include any circular/wheel-style needs-completion indicator.

## 3. Patient case pane

- [x] 3.1 Create `packages/pwa/src/components/CaseStudyPane.tsx` with a single controlled `<textarea>` bound to
      `caseText`, no edit/preview mode toggle.

## 4. Plan editor

- [x] 4.1 Create `packages/pwa/src/components/PlanEditor.tsx` that maps `plan.needs` to `NeedCard` items and lifts edits
      back into `App`'s `plan` state via `onChange`.
- [x] 4.2 Create `packages/pwa/src/components/NeedCard.tsx`: a collapsible card with header (need `type`/`name`) and
      body (goals/interventions/outcome fields from the `Need` schema), each card owning its own expanded/collapsed
      state.
- [x] 4.3 Make the need body editable: a prefilled sentence with inline blanks for `relatedTo`/`evidencedBy`; an
      addable/removable/editable goals list (task text + target date/relative term); an addable/removable/editable
      interventions list; an outcome status toggle (met/partial/unmet) and note textarea. All edits update in-memory
      `Plan` state only — no persistence.

## 5. Styling & polish

- [x] 5.1 Style all new components with Tailwind utility classes consistent with the existing `App.tsx` conventions (no
      new global CSS file).
- [x] 5.2 Verify responsive collapse behavior of the command bar and independent expand/collapse of need cards manually
      in the browser (`bun run dev` in `packages/pwa`) — no browser tool available this session; needs manual check.

## 6. Verification

- [x] 6.1 Run `bun run --cwd packages/pwa build` (runs `tsc --noEmit` + vite build) to confirm no type errors.
- [x] 6.2 Do not add or modify PWA tests for this change (explicitly deferred) — existing `App.test.tsx` passes
      unmodified.
