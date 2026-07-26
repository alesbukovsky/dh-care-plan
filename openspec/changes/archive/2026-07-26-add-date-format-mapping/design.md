## Context

`Plan` dates (`patient.dob`, `appointments[]`, `goal.doneBy`) are strict
ISO `YYYY-MM-DD` strings (`z.iso.date()`). `buildTemplateData`
(`packages/core/src/renderer.ts`) currently copies these straight into
`Template`, so a docx template must apply its own date formatting (e.g.
an Angular expression filter) to display anything other than raw ISO
text. Templates are authored by non-technical staff, so pushing date
formatting into the template is fragile.

`Mapping` already exists as the mechanism for user-overridable,
non-technical config (`need`/`outcome` label text). Adding a date format
pattern to it directly would leave a config object named "mapping" that
also carries a formatting rule — a name/content mismatch. So this change
renames `Mapping` to `Config` and gives it two top-level sections:
`format` (formatting rules — currently just `date`) and `mapping` (the
existing label overrides, unchanged in content, just nested one level
deeper).

## Goals / Non-Goals

**Goals:**

- Let a `Config` file specify one date display pattern (`format.date`)
  applied uniformly to every date value flowing into `Template` data.
- Keep template authoring simple: a plain `{tag}` placeholder receives an
  already-formatted string, no Angular date filter required.
- Give the renamed `Config` object an honest, self-describing shape:
  `format` for formatting rules, `mapping` for label overrides — so
  future formatting-only or mapping-only additions have an obvious home
  without further renames.

**Non-Goals:**

- Per-field or per-locale date formats (e.g. different pattern for
  `dob` vs. `doneBy`). One pattern for all dates is sufficient for now.
- Localization/i18n of month names or calendar systems.
- Formatting non-date values (times, numbers, currency) — out of scope,
  though `format` is now the natural home for these if they're added
  later.
- Adding a general-purpose date library dependency.
- Any behavior change to the `need`/`outcome` label mapping content
  itself — only its nesting path changes, from `mapping.need`/
  `mapping.outcome` to `config.mapping.need`/`config.mapping.outcome`
  (see Decisions for the full new shape).

## Decisions

- **Rename `Mapping` → `Config`, with two top-level keys: `format` and
  `mapping`.** `format.date` holds the date pattern; `mapping.need` and
  `mapping.outcome` hold the existing label sections, moved under
  `mapping` unchanged. Concretely:

  ```ts
  type Config = {
    format: { date: string };
    mapping: { need: Need; outcome: Outcome }; // same Need/Outcome shapes as before
  };
  ```

  So a full path is `config.format.date` (not `config.formats.date`) and
  `config.mapping.need[type]` / `config.mapping.outcome[status]` (not
  `config.need[type]`). Alternatives considered:
  - *Keep everything flat on `Mapping`/`Config` (`need`, `outcome`,
    `formats.date` all siblings)* — simpler one-level shape, but leaves
    formatting and label-mapping concerns interleaved at the same level,
    which is exactly what motivated the rename. Rejected.
  - *Separate top-level `Mapping` and `Formats` configs/files* — cleanest
    separation but doubles the file/CLI-flag/validation surface for a
    single date pattern today. Rejected as premature; revisit if more
    non-label config accumulates.
- **Token-based format string, hand-rolled formatter, no new dependency.**
  `format.date` is a pattern using `YYYY`, `MM`, `DD` tokens (e.g.
  `"MM/DD/YYYY"`, `"DD.MM.YYYY"`, `"YYYY-MM-DD"`). A small pure function
  in `renderer.ts` (or a new `packages/core/src/format.ts`) parses the
  ISO date string and substitutes tokens. Alternatives considered:
  - *Add `date-fns`/`dayjs`*: more powerful (locale-aware, more tokens)
    but overkill for reformatting a plain `YYYY-MM-DD` string with three
    numeric components, and adds a dependency to audit/pin. Rejected for
    now; can be revisited if format needs grow (e.g. weekday names).
  - *Use `Intl.DateTimeFormat`*: doesn't support arbitrary custom
    patterns like `MM/DD/YYYY`, only locale-preset styles. Rejected
    because template authors need to specify an exact pattern.
- **One `format.date` pattern applies to all three date sites.**
  `patient.dob`, every entry in `appointments`, and every `goal.doneBy`
  are all formatted with the same pattern. Keeps `Config` simple; can be
  split into per-field keys later without breaking this change's shape
  (would be an additive change under `format`).
- **`Template`'s date fields become `z.string()`.** They now hold a
  formatted display string, not a strict ISO date, so `z.iso.date()` no
  longer describes them accurately.
- **Formatting happens in `buildTemplateData`, not in `Config` itself.**
  `Config` stays a pure config/schema module; the formatting function
  lives with the other Plan→Template conversion logic in `renderer.ts`.
- **No partial/optional sections — `format` and `mapping` (and every key
  within them) stay required.** Consistent with the prior `Mapping`
  contract ("every key in every section required, no partial-override"),
  so a custom config must specify `format.date` and every `mapping.*`
  label explicitly.
- **Full rename, not an alias/back-compat shim.** `Mapping`, `--mapping`,
  `getMappingSchema`, etc. are removed outright rather than kept as
  deprecated aliases — per project convention (CLAUDE.md: prefer changing
  code directly over compatibility shims), and there's no persisted
  external mapping file format to preserve compatibility with yet.

## Risks / Trade-offs

- **BREAKING for existing config/mapping JSON files and CLI usage** →
  Mitigation: bump `DEFAULT_CONFIG`'s sample/schema so
  `getConfigSample()` users get the new shape for free; document the
  rename and new required `format.date` field in the proposal's Impact
  section. No automatic migration is needed since the project has no
  persisted user mapping files outside samples/tests today.
- **Rename touches many files (schema, validator, sampler, renderer, CLI,
  index exports, specs)** → Mitigation: tasks.md sequences the rename
  file-by-file with a final grep sweep for lingering `Mapping`/`mapping`
  identifiers before considering the change done.
- **Invalid/unparseable format pattern (e.g. unknown token, empty
  string)** → Mitigation: the formatter treats unrecognized characters
  as literal passthrough (same behavior as common date-format libraries);
  no new validation error surface is introduced beyond existing zod
  `format.date: z.string()` (non-empty not enforced, matching the
  minimal-validation style of the `need`/`outcome` label strings).
- **Ambiguous or malformed ISO date input** → not a new risk: `Plan`
  already enforces `z.iso.date()` at parse time, so `buildTemplateData`
  only ever receives well-formed `YYYY-MM-DD` strings.

## Migration Plan

- No runtime migration required (no persisted state). Consumers who keep
  a custom mapping JSON file must restructure it under `format`/`mapping`
  top keys and add `format.date` before their next render; CLI users must
  switch `--mapping` to `--config`. Both are called out in the proposal
  as breaking changes.
