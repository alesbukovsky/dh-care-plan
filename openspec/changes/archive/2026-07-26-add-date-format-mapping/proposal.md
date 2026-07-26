## Why

Care plan dates (`patient.dob`, `appointments`, `goal.doneBy`) are ISO
`YYYY-MM-DD` strings in `Plan`, and today `buildTemplateData` copies them
into `Template` unchanged. Templates are authored mostly by non-technical
staff, so requiring an Angular/docxtemplater date filter in every template
to get a readable date format is error-prone and hard to support. Adding
a configurable date format lets template authors receive
already-formatted date strings and write plain `{tag}` placeholders.

Once a date format pattern is added, the existing `Mapping` config
(label text for `need`/`outcome`) is no longer just text mapping — it now
holds a mix of label overrides and a formatting rule. Rather than
overload `Mapping` with a mismatched name, this change renames the
concept to `Config` and splits it into two clearly-scoped top-level
sections: `format` (formatting rules, currently just `date`) and
`mapping` (the existing label overrides, unchanged in content).

## What Changes

- **BREAKING**: Rename `Mapping` to `Config`
  (`packages/core/src/schema/mapping.ts` → `packages/core/src/schema/config.ts`)
  and restructure it with two required top-level keys:
  - `format`: formatting rules, currently just `date` — a date format
    pattern (e.g. `"MM/DD/YYYY"`) using `YYYY`/`MM`/`DD` tokens
  - `mapping`: the existing `need`/`outcome` label sections, moved
    unchanged under this key
- **BREAKING**: Rename all `Mapping`-related exports to match: `Mapping`
  → `Config`, `DEFAULT_MAPPING` → `DEFAULT_CONFIG`, `getMappingSchema` →
  `getConfigSchema`, `resolveMapping` → `resolveConfig`,
  `getMappingSample` → `getConfigSample`, `validateMapping` →
  `validateConfig`.
- **BREAKING**: `buildTemplateData` (`packages/core/src/renderer.ts`)
  SHALL format every date value (`patient.dob`, each entry in
  `appointments`, each `goal.doneBy`) using `config.format.date` before
  writing it into the generated `Template` data, instead of copying the
  raw ISO string, and SHALL derive need/outcome labels from
  `config.mapping.need`/`config.mapping.outcome` (previously
  `mapping.need`/`mapping.outcome`).
- **BREAKING**: `Template`'s date fields (`packages/core/src/schema/template.ts`)
  change from `z.iso.date()` to `z.string()`, since they now hold a
  formatted display string rather than a strict ISO date.
- **BREAKING**: CLI (`packages/core/cli/dhplan.ts`): the `--mapping <file>`
  option on `render` and `inspect` is renamed to `--config <file>`; the
  `schema`/`validate` subcommands' `mapping` type argument is renamed to
  `config` (e.g. `dhplan schema config`, `dhplan validate config <file>`).
- Include a sensible default date pattern in `DEFAULT_CONFIG.format.date`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `mapping`: renamed to `config` (see Impact) — restructured into
  `format` (new `date` pattern) and `mapping` (existing `need`/`outcome`
  sections, unchanged content) top-level keys; all exports renamed to
  match (`Config`, `DEFAULT_CONFIG`, `getConfigSchema`, `resolveConfig`,
  `getConfigSample`, `validateConfig`).
- `renderer`: `buildTemplateData` formats `patient.dob`, `appointments`,
  and `goal.doneBy` using `config.format.date` instead of copying the
  raw ISO date string, and reads label overrides from
  `config.mapping.need`/`config.mapping.outcome`.
- `template-schema`: `Template`'s date fields become `z.string()` (a
  formatted display string) instead of `z.iso.date()`.
- `cli`: `--mapping` option renamed to `--config`; `mapping` schema/type
  argument renamed to `config` across `schema`, `validate`, `render`, and
  `inspect` subcommands.

## Impact

- `packages/core/src/schema/mapping.ts` is renamed to
  `packages/core/src/schema/config.ts`; its schema gains `format`/`mapping`
  top-level structure and all its exports are renamed (see What Changes).
- `packages/core/src/schema/template.ts`: date field types loosen from
  `z.iso.date()` to `z.string()`.
- `packages/core/src/renderer.ts`: `buildTemplateData` gains date
  formatting logic (needs a date-formatting helper) and reads labels from
  the new `config.mapping.*` paths.
- `packages/core/src/validator.ts`: `validateMapping` is renamed to
  `validateConfig` and validates the new `Config` shape.
- `packages/core/src/sampler.ts` and `packages/core/src/index.ts`: update
  re-exports for the renamed symbols.
- `packages/core/cli/dhplan.ts`: `--mapping` → `--config`, `mapping`
  schema-type literal → `config`, internal variable names updated.
- Any existing mapping JSON files (checked in or distributed to users)
  become invalid: they must be restructured under `format`/`mapping` top
  keys and add `format.date`, since `resolveConfig` requires a complete
  config with no partial merge.
