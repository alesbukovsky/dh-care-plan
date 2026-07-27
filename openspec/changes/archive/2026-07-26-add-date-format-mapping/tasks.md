## 1. Config schema (rename + restructure)

- [x] 1.1 Rename `packages/core/src/schema/mapping.ts` to `packages/core/src/schema/config.ts`
- [x] 1.2 Rename `Mapping` → `Config`, and restructure it with two top-level required keys: `format` (new `Format`
      object with `date: z.string()`) and `mapping` (existing `Need`/`Outcome` sections, unchanged, moved under this
      key)
- [x] 1.3 Rename `DEFAULT_MAPPING` → `DEFAULT_CONFIG`; update its shape to
      `{ format: { date: "MM/DD/YYYY" }, mapping: { need: {...},     outcome: {...} } }` (same label values as before)
- [x] 1.4 Rename `getMappingSchema` → `getConfigSchema` and `resolveMapping` → `resolveConfig`; update the schema's
      `$id` to `config.schema.json`

## 2. Date formatting helper

- [x] 2.1 Add a pure `formatDate(iso: string, pattern: string): string` function (in `packages/core/src/renderer.ts` or
      a new `packages/core/src/format.ts`) that parses a `YYYY-MM-DD` string and substitutes `YYYY`/`MM`/`DD` tokens in
      the given pattern, passing through unrecognized characters literally
- [x] 2.2 Add unit tests for `formatDate` covering `MM/DD/YYYY`, `DD.MM.YYYY`, `YYYY-MM-DD`, and a pattern with literal
      separators

## 3. Template schema

- [x] 3.1 Change `patient.dob`, `appointments` entries, and `Goal.doneBy` in `packages/core/src/schema/template.ts` from
      `z.iso.date()` to `z.string()`

## 4. Renderer

- [x] 4.1 Update `buildTemplateData` in `packages/core/src/renderer.ts` to accept `Config` (default `DEFAULT_CONFIG`)
      instead of `Mapping`
- [x] 4.2 Format `plan.patient.dob` using `config.format.date`
- [x] 4.3 Format every entry in `plan.appointments` using `config.format.date`
- [x] 4.4 Format each goal's `doneBy` using `config.format.date` when present, leaving it `undefined` otherwise
- [x] 4.5 Update need/outcome label lookups from `mapping.need`/ `mapping.outcome` to
      `config.mapping.need`/`config.mapping.outcome`
- [x] 4.6 Update/add renderer unit tests for: formatted `patient.dob`, formatted `appointments`, formatted and absent
      `goal.doneBy`, a custom `format.date` pattern producing different output than the default, and need/outcome label
      lookups via `config.mapping.*`

## 5. Validator, sampler, and index exports

- [x] 5.1 Rename `validateMapping` → `validateConfig` in `packages/core/src/validator.ts`, validating against `Config`
- [x] 5.2 Rename `getMappingSample` → `getConfigSample` in `packages/core/src/sampler.ts`, returning `DEFAULT_CONFIG`
- [x] 5.3 Update `packages/core/src/index.ts` re-exports: `Config`, `DEFAULT_CONFIG`, `getConfigSchema`,
      `resolveConfig`, `getConfigSample`, `validateConfig` (remove the old `Mapping`-named exports)

## 6. CLI

- [x] 6.1 Update `SCHEMA_TYPES` in `packages/core/cli/dhplan.ts`: `"mapping"` → `"config"`
- [x] 6.2 Update the `schema`/`validate` subcommands' type-dispatch tables to call
      `getConfigSample`/`getConfigSchema`/`validateConfig` for the `config` type
- [x] 6.3 Rename the `--mapping <file>` option to `--config <file>` on both `render` and `inspect`, and rename internal
      variables/parameters (`mappingBuffer` → `configBuffer`, `mapping` → `config`, etc.) accordingly
- [x] 6.4 Update CLI help text/usage strings that mention "mapping" to say "config"

## 7. Samples, fixtures, and cleanup sweep

- [x] 7.1 Update any sample/fixture JSON files (test data, CLI samples) that use the old flat `Mapping` shape to the new
      `format`/`mapping` `Config` shape
- [x] 7.2 Grep the codebase for remaining `Mapping`/`mapping` identifiers tied to the renamed config (schema file,
      types, function names, CLI flags) and fix any stragglers — needs/outcomes' own field names (e.g. `Need`,
      `outcome.label`) are unaffected and SHOULD NOT be renamed

## 8. Verification

- [x] 8.1 Run `bun test:core` and fix any failures surfaced by the rename or the `Template` date field type change
- [x] 8.2 Run `bun test:all` to confirm PWA (if it consumes `Mapping`/ `Config` or `Template` types) still passes and
      has no remaining references to the old `Mapping` API
