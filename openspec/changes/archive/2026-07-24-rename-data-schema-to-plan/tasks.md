## 1. Rename the data schema file and symbol

- [x] 1.1 `git mv packages/core/src/schema/data.ts packages/core/src/schema/plan.ts`
- [x] 1.2 In `plan.ts`, rename `export const DataSchema` → `export const Plan` and `export type DataSchema` →
      `export type Plan` (keep the shape and internal `Goal`/`Need`/`MetNeed`/`UnmetNeed` definitions unchanged).

## 2. Rename the template schema symbol

- [x] 2.1 In `packages/core/src/schema/template.ts`, rename `export const TemplateSchema` → `export const Template` and
      `export type TemplateSchema` → `export type Template` (file itself keeps the name `template.ts`).

## 3. Update `validator.ts`

- [x] 3.1 Update the import from `./schema/data` to `./schema/plan` and from `DataSchema` to `Plan`; update the import
      of `TemplateSchema` to `Template`.
- [x] 3.2 Update `validateData` to call `Plan.safeParse(...)` instead of `DataSchema.safeParse(...)` (function name
      `validateData` stays the same — see design.md).
- [x] 3.3 Update `validateTemplate`/`collectUndefinedTags` to reference `Template.shape` instead of
      `TemplateSchema.shape`, and change the `"not defined in TemplateSchema"` issue message to
      `"not defined in Template"`.

## 4. Update package exports

- [x] 4.1 In `packages/core/src/index.ts`, export `Plan` from `./schema/plan` and `Template` from `./schema/template` in
      place of `DataSchema`/`TemplateSchema`.

## 5. Update the CLI

- [x] 5.1 In `packages/core/cli/dhplan.ts`, change `SCHEMA_TYPES` from `["data", "template"]` to `["plan", "template"]`.
- [x] 5.2 Update the `import { DataSchema, TemplateSchema, ... }` to `import { Plan, Template, ... }` and update the
      `schema` command's `type === "data" ? DataSchema : TemplateSchema` to `type === "plan" ? Plan : Template`.
- [x] 5.3 Update the `validate` command's `type === "data" ? validateData : validateTemplate` condition to
      `type === "plan" ? validateData : validateTemplate` (the underlying validator function name is unchanged, only the
      CLI argument value changes).

## 6. Update tests

- [x] 6.1 `packages/core/tests/cli/dhplan-schema.test.ts`: update imports to `Plan`/`Template` from
      `../../src/schema/plan` and `../../src/schema/template`; update `runCli(["schema", "data"])` to
      `runCli(["schema", "plan"])` and test names/assertions accordingly; the invalid-type test's
      `expect(stderr).toContain("data")` becomes `expect(stderr).toContain("plan")`.
- [x] 6.2 `packages/core/tests/cli/dhplan-validate.test.ts`: update the `"data"` CLI argument occurrences to `"plan"`;
      update `"not defined in TemplateSchema"` assertion to `"not defined in Template"`; update the invalid-type test's
      `expect(stderr).toContain("data")` to `expect(stderr).toContain("plan")`.
- [x] 6.3 `packages/core/tests/validator.test.ts`: update `"not defined in TemplateSchema"` assertions to
      `"not defined in Template"`; update test descriptions/imports that reference `DataSchema`/`TemplateSchema` by
      name.

## 7. Verify

- [x] 7.1 Run `bun test` and confirm the full suite passes.
- [x] 7.2 Run `bun run packages/core/cli/dhplan.ts schema plan` and `... schema template` manually; confirm both still
      print correctly and that `dhplan schema data` now fails with the "invalid schema type" error.
- [x] 7.3 `grep -rn "DataSchema\|TemplateSchema" packages/` and confirm no remaining references (aside from historical
      openspec change/spec files).

## 8. Spec housekeeping (at archive time)

- [x] 8.1 When this change is archived, rename `openspec/specs/data-schema/` to `openspec/specs/plan-schema/` to match
      the renamed capability.
