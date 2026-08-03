# Configure command

## Purpose

Enable the disabled "Configure" action in `CommandBar`. It opens a modal editor for
the app's `Config` object (date/goal/visit/vitals formatting strings and the
need/outcome label mappings), and lets that config be exported to and imported
from a JSON file using the same mechanism as plan data export/import. The
generate flow already accepts an optional `Config`; today nothing ever supplies
one, so it silently falls back to `DEFAULT_CONFIG` inside `render`. This wires a
real config through.

## Scope

- Session-only config state: resets to `DEFAULT_CONFIG` on reload, same as the
  plan. No `localStorage` persistence.
- Draft editing model: the modal owns its own draft, seeded from the current
  committed config when opened. "Save" commits the draft to app state; "Cancel"
  or Escape discards it and leaves app state untouched.
- Import and Export operate on the draft, not directly on app state — so
  importing a file just loads it into the open editor; it still needs Save to
  take effect.
- "Reset to defaults" reloads `DEFAULT_CONFIG` into the draft (also needs Save
  to take effect).

Out of scope: no config persistence across sessions, no partial/field-level
import, no config versioning/migration.

## App-level wiring (`packages/pwa/src/App.tsx`)

- New `config` state: `useState<Config>(() => structuredClone(DEFAULT_CONFIG))`.
- New `configuring` boolean state (mirrors `generating`/`GenerateDialog`).
- `CommandBar`'s `configure` action loses `disabled: true` and gets an
  `onConfigure` handler wired to `setConfiguring(true)`.
- New `configImportFailure` state (mirrors `importFailure`), rendered through
  the existing `ImportErrorDialog` with `title="Cannot import this file"`
  (config-specific summary/issues come from `readConfigFile`).
- `handleGenerate` changes from `renderPlan(plan, templateSelection.template)`
  to `renderPlan(plan, templateSelection.template, config)`.
- `ConfigDialog` is rendered conditionally like `GenerateDialog`, receiving
  `config`, `onSave={(next) => { setConfig(next); setConfiguring(false); }}`,
  `onCancel={() => setConfiguring(false)}`.

## File I/O (`packages/pwa/src/configFile.ts`, new)

Mirrors `export.ts` / `import.ts` for the `Config` type:

- `exportConfig(config: Config): Promise<void>` — serializes as pretty JSON and
  calls `saveFile(json, "config.json", "application/json", [{ description:
  "Care plan config JSON", accept: { "application/json": [".json"] } }])`.
  Fixed filename — unlike a plan, a config has no patient identity to slug into
  the name.
- `readConfigFile(file: File): Promise<ConfigImportResult>` where
  `ConfigImportResult = { ok: true; config: Config } | ImportFailure` (reusing
  `ImportFailure`/`ImportIssue` from `import.ts`). Uses `parseConfig` from
  `@dh-care-plan/core`, following the same empty-file/JSON-error/schema-issue
  branches as `readPlanFile`.

### Shared issue-describing helpers (`packages/pwa/src/schemaIssues.ts`, new)

`import.ts` currently has `describePath`, `valueAt`, `describeValue`,
`describeIssue`, `humanize`, and `EXPECTED_LABELS` — all generic over any
`SchemaIssue`/parsed data except for the `FIELD_LABELS` map, which is
plan-specific. Extract the generic parts into `schemaIssues.ts`:

```ts
export function describeSchemaIssues(
  issues: readonly SchemaIssue[],
  raw: unknown,
  fieldLabels: Record<string, string>,
): ImportIssue[]
```

`import.ts` and `configFile.ts` each keep their own `FIELD_LABELS` map (plan's
existing one stays where it is; config's is new — `format`, `mapping`, `need`,
`outcome`, `date`, `goal`, `doneBy`, `visits`, `vitals`, plus the need/outcome
leaf keys already listed in `import.ts`'s map, duplicated locally since the two
modules must not depend on each other) and call `describeSchemaIssues` instead
of inlining the walk.

## `ConfigDialog` component (`packages/pwa/src/components/ConfigDialog.tsx`, new)

Props: `{ config: Config; onSave: (config: Config) => void; onCancel: () => void }`.

- Local draft state: `useState(() => structuredClone(config))`, seeded once on
  mount (dialog is mounted/unmounted by `App`'s conditional render, so this
  needs no reset effect — matches `GenerateDialog`'s `templateSelection` reset
  pattern of relying on remount).
- Visual shell matches `GenerateDialog`/`ImportErrorDialog`: fixed overlay,
  `role="dialog"`, header/body/footer, Escape-to-cancel and initial-focus
  effect copied from those components.
- Body: scrollable, three grouped sections using the existing `Field`
  component (no new field primitives needed):
  - **Format** — `date`, `visits`, `vitals`, `goal.doneBy` (4 fields).
  - **Need labels** — `mapping.need.*`, 9 fields.
  - **Outcome labels** — `mapping.outcome.*`, 4 fields.
- Header/footer actions:
  - **Import…** — hidden `<input type="file" accept="application/json,.json">`
    (same trick as `App.tsx`'s existing file inputs) triggers `readConfigFile`;
    on success replaces the draft; on failure calls `onImportFailure` (bubbled
    prop to `App`, which shows `ImportErrorDialog`) and leaves the draft as-is.
  - **Export** — calls `exportConfig(draft)` directly on the current draft.
  - **Reset to defaults** — `setDraft(structuredClone(DEFAULT_CONFIG))`.
  - **Cancel** — calls `onCancel`.
  - **Save** — calls `onSave(draft)`.

## Testing

- `configFile.ts`: unit tests mirroring `export.ts`/`import.ts`'s existing
  tests — round-trip export/import, empty file, invalid JSON, schema-invalid
  JSON (missing field, wrong type).
- `schemaIssues.ts`: covered indirectly through `import.ts`'s and
  `configFile.ts`'s existing/new tests; no separate suite needed since it has
  no independent behavior beyond what those exercise.
