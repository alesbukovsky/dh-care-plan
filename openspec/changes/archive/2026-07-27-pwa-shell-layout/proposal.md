## Why

The PWA package (`packages/pwa`) currently only has a placeholder `App.tsx`. Before wiring up persistence,
import/export, or docx generation, we need the visual shell in place: a three-pane layout (command bar, patient case,
plan editor) modeled on the `_demo` prototype and backed by the real `Plan`/`Need` types from `packages/core`. This
change nails the visuals with static/mock data so layout and interaction patterns can be validated before any storage or
file-I/O logic is built.

## What Changes

- Add a three-pane app shell to `packages/pwa`: collapsible command bar (left), patient case pane (middle), plan editor
  pane (right).
- Command bar shows placeholder actions (Import data, Export data, Generate plan, Configure) and the current app
  version; no per-need completion indicator (no circular progress wheel). Collapses to icon-only rail with hover
  tooltips.
- Patient case pane is read-only paste-in text (no edit/preview toggle) — just a textarea/contenteditable surface for
  pasting patient case text from another source.
- Plan editor pane renders the `Need` list from a `Plan` as collapsible, editable sections/cards, seeded from
  `getPlanSample()` in `packages/core`. Each card prefills a sentence ("Unmet human need for X, related to _**as
  evidenced by**_") with fill-in-the-blank inputs, plus editable goals, interventions, and outcome status/note — all
  held in in-memory state only (no persistence).
- No persistence (no localStorage, no import/export wiring) — all state is in-memory/mock for this change.
- No new PWA tests added for this change (visuals-first, tests deferred).

## Capabilities

### New Capabilities

- `pwa-shell`: Three-pane application shell layout for the PWA — collapsible command bar, patient case pane, plan editor
  pane — rendering a `Plan`'s needs as collapsible cards, with no persistence or file I/O.

### Modified Capabilities

(none)

## Impact

- Affected code: `packages/pwa/src/**` (new components, replaces placeholder `App.tsx`).
- Dependencies: reads `Plan`/`Need` types and `getPlanSample()` from `packages/core` (`dh-care-plan` workspace package);
  no new external dependencies expected beyond what's already available for styling.
- No changes to `packages/core` schemas or CLI.
- No test suite changes (PWA tests explicitly skipped for this change per user direction).
