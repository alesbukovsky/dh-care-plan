## Context

`Template.appointments` is currently `z.array(z.string())`: `convertData` maps each `Plan.appointments` ISO date to a
formatted string, one per array entry. The rendered `.docx` document needs these as one comma-separated sentence, not a
repeated tag/loop, so the join needs to happen in `convertData` before the data reaches docxtemplater.

## Goals / Non-Goals

**Goals:**

- `Template.appointments` becomes a single `z.string()`.
- The separator used to join dates is configurable via `Config`, defaulting to `", "`.

**Non-Goals:**

- No change to `Plan.appointments` (stays `z.array(z.iso.date())`) — only the template-facing shape changes.
- No per-date formatting changes beyond what `config.format.date` already does.

## Decisions

- **Join location**: join inside `convertData` (`packages/core/src/converter.ts`), not in the template or in
  `Plan`/`Template` schema logic. `convertData` already owns `Plan` → `Template` field-by-field mapping (including
  per-date formatting via `dateStr`), so joining is one more step in that same mapping, not a new concern.
  - Alternative considered: join in the renderer/templater layer. Rejected — `Template` is validated data;
    `appointments` should already be a plain string by the time it's validated and handed to docxtemplater, matching how
    every other `Template` field is fully resolved before validation.
- **Config key shape**: `format.appointment: z.string()`, a flat separator string rather than a nested object.
  Alternative considered: `format.appointment` (nesting under an object, mirroring `format.goal.doneBy`). Rejected —
  `format.goal.doneBy` and `format.date` are both _substitution patterns_ (tokens like `{date}`/`YYYY` get replaced
  within them), so nesting under a field name reads naturally as "formatting rules for that field". A separator has no
  placeholders — it's just a joining string, not a pattern — so wrapping it in a `{ separator }` object added a level of
  nesting without adding meaning. A flat `format.appointment` string is the more direct fit.
- **Default value**: `", "`, matching the requested default and standard English list-joining convention.
- **No merge/partial-override behavior**: consistent with `resolveConfig`'s existing all-or-nothing behavior
  (`config/spec.md` "A supplied config replaces the defaults entirely"), a user-supplied `Config` must include
  `format.appointment` — no fallback to the default when a full config is supplied without it.

## Risks / Trade-offs

- **Breaking change for existing `.docx` templates**: any template built against the old array shape (e.g. looping with
  `{#appointments}...{/appointments}`) breaks and must switch to a plain `{appointments}` tag. No such templates exist
  in this repo's fixtures today. Mitigation: proposal calls this out explicitly as **BREAKING**; no migration shim is
  planned since this is pre-1.0 and no external templates are known to depend on the array shape.
- **Empty appointments list**: joining zero entries yields `""` (empty string). This is consistent with `Array.join`
  semantics and requires no special-casing.
