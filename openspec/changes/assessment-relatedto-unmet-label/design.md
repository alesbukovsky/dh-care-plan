## Context

`Template.Assessment` is one row per `Need` (met or unmet), currently `{ need: string, isMet: boolean }`. Every other
categorical/boolean value already reaching `Template` goes through a `Config`-driven display-label lookup before it gets
there — `Statement.need` via `config.mapping.need[type]`, `Goal.outcome.label` via `config.mapping.outcome[status]` —
except `Assessment.isMet`, which is still a raw boolean. `Statement` already carries `relatedTo`/`evidencedBy` for unmet
needs; `Assessment` (which lists every need, met or unmet) has neither.

## Goals / Non-Goals

**Goals:**

- `Assessment` gains `relatedTo`/`evidencedBy`, copied from the source `Need`, optional (undefined when absent —
  expected to be common for met needs).
- `Assessment.isMet` (boolean) is replaced by `Assessment.isUnmet` (a `Config`-derived display string), consistent with
  how `Statement.need`/`Goal.outcome.label` are already derived.
- A new, generic `Config.format.boolean` pair controls the two label strings for any boolean value, not just `isUnmet`,
  with sensible defaults.

**Non-Goals:**

- No change to `Need.isMet`'s type or meaning in `Plan` — it stays a plain boolean; only the `Template`-facing
  representation changes.
- No change to `Statement`'s existing `relatedTo`/`evidencedBy` (required, defaulted to `""` when absent) — that
  behavior is unrelated and untouched.

## Decisions

- **`format.boolean` is generic, keyed by the literal boolean, and lives under `format` not `mapping`** —
  `{ true: z.string(), false: z.string() }`, shared by any boolean value `convertData` renders as a string, not specific
  to `isUnmet`. `convertData` selects `config.format.boolean[!need.isMet ? "true" : "false"]` (a small
  `boolStr(value, config)` helper wraps the lookup).
  - Superseded alternative: this change originally added a field-specific `Config.mapping.isUnmet: { met, unmet }`,
    keyed by semantic state to mirror `mapping.outcome`'s `{ met, partial, unmet }` pattern, on the reasoning that
    boolean-shaped keys "read backwards" at the call site. Revised per explicit follow-up feedback: the formatter should
    not be specific to `isUnmet` at all — it should be a general boolean-to-label formatter reusable by any future
    boolean field, which means it belongs under `format` (a generic rendering rule) rather than `mapping` (a named,
    field-specific label lookup like `need`/`outcome`), and its keys should be the literal boolean values, not an
    invented semantic vocabulary tied to one field.
- **Field renamed from `unmet` to `isUnmet`** (the `Assessment` field only — the config-side name is now the generic
  `format.boolean`, not a field-specific section): the `is`-prefixed name signals more clearly that this is a
  boolean-like state rendered as a display string, matching the source field it derives from (`Need.isMet`).
- **Default label direction — confirmed with the user**: `format.boolean.true` defaults to `"Yes"` and
  `format.boolean.false` defaults to `"No"`, and `assessment.isUnmet` applies that pair to `!need.isMet` (not
  `need.isMet` directly). This was explicitly clarified during proposal: the `isUnmet` field asks "is this need unmet?",
  so an actually-unmet need (`isMet: false`) renders `format.boolean.true` (`"Yes"`), and a met need (`isMet: true`)
  renders `format.boolean.false` (`"No"`) — the inverse of `isMet`'s raw boolean value, not a direct passthrough.
- **`relatedTo`/`evidencedBy` stay optional on `Assessment`, unlike `Statement`'s required-with-`""`-default fields**:
  `Statement` only ever lists unmet needs, so defaulting a missing `relatedTo`/`evidencedBy` to `""` keeps every
  `Statement` field populated for template authors. `Assessment` lists every need — met needs have no reason to carry
  `relatedTo`/`evidencedBy` at all, so leaving them `undefined` (already reflected in the current `template.ts`, which
  has `relatedTo`/`evidencedBy` as `.optional()`) is more honest than forcing an empty string onto rows where the field
  doesn't apply.

## Risks / Trade-offs

- **Breaking change for any `.docx` template using `{assessments.isMet}`**: no such tag exists in this repo's fixtures
  today (they exercise `Plan`/`Template` JSON directly, not through a real assessments-boolean template tag), so no
  fixture updates are anticipated, but this is a breaking change for any external template already built against the old
  boolean field.
- **Field name still reads as an inversion of common sense at a glance** (`isUnmet: "No"` for a met need): this is the
  explicitly confirmed intent, not an oversight — flagged here so a future reader doesn't "fix" it back to a direct
  passthrough.
- **`nullGetter` default is global, not per-call**: setting `nullGetter: () => ""` as `createTemplater`'s default
  (rather than only in `render()`'s call site) means every consumer of `createTemplater` — including any future caller —
  silently treats missing tag values as empty strings unless it explicitly overrides `nullGetter`. This is a deliberate,
  codebase-wide default: `Assessment.relatedTo`/`evidencedBy` being `undefined` for met needs is expected and common,
  not an error condition to surface.
