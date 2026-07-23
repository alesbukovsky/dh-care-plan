## 1. Shared type and lookup tables

- [x] 1.1 Export the existing `Validator` type from `validator.ts` via
      `packages/core/src/index.ts`
- [x] 1.2 In `packages/core/cli/dhplan.ts`, add
      `const SCHEMA_TYPES = ["data", "template"] as const;` and
      `type SchemaType = (typeof SCHEMA_TYPES)[number];`
- [x] 1.3 Add `SCHEMAS: Record<SchemaType, z.ZodType>` mapping `data` →
      `DataSchema`, `template` → `TemplateSchema`
- [x] 1.4 Add `VALIDATORS: Record<SchemaType, Validator>` mapping `data` →
      `validateData`, `template` → `validateTemplate`

## 2. Wire up `schema` command

- [x] 2.1 Rename `schema`'s positional argument from `<target>` to
      `<schema_type>`, using `.choices(SCHEMA_TYPES)` instead of the
      inline `["data", "template"]` array
- [x] 2.2 Rename the action callback's parameter from `target` to
      `schemaType: SchemaType`, and replace
      `target === "data" ? DataSchema : TemplateSchema` with
      `SCHEMAS[schemaType]`

## 3. Wire up `validate` command

- [x] 3.1 Update `validate`'s existing `<schema_type>` argument to use
      `.choices(SCHEMA_TYPES)` instead of its own inline
      `["data", "template"]` array
- [x] 3.2 Type the action callback's `schemaType` parameter as the shared
      `SchemaType` (instead of the inline `"data" | "template"` union),
      and replace
      `schemaType === "data" ? validateData : validateTemplate` with
      `VALIDATORS[schemaType]`

## 4. Tests and verification

- [x] 4.1 Update the test description in
      `packages/core/tests/cli/dhplan-schema.test.ts` that currently reads
      "schema with an invalid target errors..." for accuracy (no
      assertion changes expected, since assertions check for `data`/
      `template` substrings, not `target`)
- [x] 4.2 Run `bun test:core` and `bun lint` from the repo root; fix any
      failures
- [x] 4.3 Manually run `dhplan schema --help` and `dhplan validate --help`,
      confirm both show `schema_type` as the argument name
- [x] 4.4 Manually run `dhplan schema nonsense` and
      `dhplan validate nonsense <file>`, confirm both error the same way

## 5. Shrink `schema_type` to `type`

- [x] 5.1 Rename both commands' argument from `<schema_type>` to `<type>`
      and their callback parameter from `schemaType` to `type` in
      `packages/core/cli/dhplan.ts` (`SchemaType`/`SCHEMA_TYPES` type names
      unchanged — only the CLI-facing argument/parameter shrinks)
- [x] 5.2 Update the test descriptions mentioning `schema_type` in
      `dhplan-schema.test.ts` and `dhplan-validate.test.ts` to say `type`
      (no assertion changes)
- [x] 5.3 Run `bun test:core` and `bun lint` from the repo root; fix any
      failures
- [x] 5.4 Manually run `dhplan schema --help`, `dhplan validate --help`,
      `dhplan schema nonsense`, and `dhplan validate nonsense <file>`,
      confirm both commands now say `type` instead of `schema_type`

## 6. Drop the `SCHEMAS`/`VALIDATORS` lookup tables

- [x] 6.1 Remove `SCHEMAS`/`VALIDATORS` from `packages/core/cli/dhplan.ts`;
      restore each command's `type === "data" ? A : B` ternary (retyped to
      the shared `SchemaType`) per direct user confirmation that there are,
      and will only ever be, exactly two schema types — keep
      `SCHEMA_TYPES`/`SchemaType` for the unified argument naming/choices
- [x] 6.2 Remove the now-unused `Validator` type export from
      `packages/core/src/index.ts`
- [x] 6.3 Run `bun test:core` and `bun lint` from the repo root; fix any
      failures
