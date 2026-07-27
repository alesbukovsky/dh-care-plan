## Why

The domain concept these schemas model is a "care plan," not generic "data," and the CLI/exports should say what they
mean. `DataSchema` / `data.ts` and the `data` CLI schema-type argument are named after the generic JSON-file mechanism
instead of the domain object they represent. Renaming to `Plan` / `plan.ts` / the `plan` CLI type now — while the shape
is still small — avoids a larger churn later once more code and specs depend on the old names.

## What Changes

- **BREAKING**: `packages/core/src/schema/data.ts` is renamed to `packages/core/src/schema/plan.ts`; the exported
  `DataSchema` value and type become `Plan`.
- **BREAKING**: `packages/core/src/schema/template.ts`'s exported `TemplateSchema` value and type become `Template`
  (file keeps its name).
- **BREAKING**: `packages/core/src/index.ts` exports `Plan` and `Template` instead of `DataSchema` and `TemplateSchema`.
- **BREAKING**: `packages/core/src/validator.ts` imports and uses `Plan` in place of `DataSchema` (`validateData` keeps
  its current function name — it validates a JSON file against the `Plan` schema; no requirement change to the
  validator's behavior, only to the schema symbol it references).
- **BREAKING**: `packages/core/cli/dhplan.ts`'s `schema` and `validate` subcommands accept `plan` instead of `data` as a
  schema-type argument (`SCHEMA_TYPES` becomes `["plan", "template"]`); `dhplan schema data` and
  `dhplan validate data <file>` stop working, replaced by `dhplan schema plan` / `dhplan validate plan <file>`.
- Existing tests referencing `DataSchema`, `data.ts`, or the CLI's `data` argument are updated to the new names.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `data-schema`: the capability (and its spec file) is renamed to `plan-schema`; the schema it describes is now named
  `Plan` and defined in `packages/core/src/schema/plan.ts` rather than `DataSchema` in `data.ts`.
- `cli`: the `schema` and `validate` subcommands' schema-type argument changes from `data` to `plan` (`template` is
  unchanged).
- `validate`: `validateData`'s description is updated to reference the `Plan` schema instead of `DataSchema` (no
  behavioral change).

## Impact

- `packages/core/src/schema/data.ts` → renamed to `packages/core/src/schema/plan.ts`
- `packages/core/src/schema/template.ts`
- `packages/core/src/index.ts`
- `packages/core/src/validator.ts`
- `packages/core/cli/dhplan.ts`
- `packages/core/tests/validator.test.ts`
- `packages/core/tests/cli/dhplan-validate.test.ts`
- `packages/core/tests/cli/dhplan-schema.test.ts`
- Consumers of the `packages/core` package importing `DataSchema` or `TemplateSchema`, or scripting the `dhplan` CLI
  with the `data` schema type, must update to `Plan` / `plan`.
