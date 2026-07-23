## 1. Dependencies

- [x] 1.1 Add `commander` as an exact-pinned dependency in
      `packages/core/package.json` (version `15.0.0`)

## 2. Schemas

- [x] 2.1 Remove the prototype fields (`Patient`, `History`, `Residency`,
      `Subjective`, `Objective`, `Assessment`, `Assessments`) from
      `packages/core/src/schema/data.ts`; replace `DataSchema` with the
      placeholder `z.object({})`
- [x] 2.2 Add `packages/core/src/schema/template.ts` with the placeholder
      `TemplateSchema = z.object({})` export
- [x] 2.3 Export `TemplateSchema` from `packages/core/src/index.ts`
      alongside `DataSchema` and `renderCarePlan`

## 3. CLI

- [x] 3.1 Rebuild `packages/core/cli/dhplan.ts` on Commander.js with a root
      program (name `dhplan`, no-args prints help and exits non-zero)
- [x] 3.2 Comment out the existing render logic (`Bun.file` reads,
      `renderCarePlan` call, `Bun.write`, confirmation/error handling) in
      `cli/dhplan.ts` as a reference block; do not register it as a
      Commander subcommand
- [x] 3.3 Add `schema <target>` subcommand accepting only `data` or
      `template`; print the matching schema's JSON Schema (via
      `z.toJSONSchema()`) to stdout
- [x] 3.4 Reject invalid `schema` targets with an error message listing
      valid targets (`data`, `template`) and a non-zero exit code

## 4. Verification

- [x] 4.1 Manually run `dhplan schema data` and `dhplan schema template`,
      confirm valid JSON Schema (`{}`-shaped object schema) is printed for
      each
- [x] 4.2 Manually run `dhplan` with no arguments and with an invalid
      `schema` target, confirm help/error text and non-zero exit codes
- [x] 4.3 Run `bun test:core` and `bun lint` from the repo root, fix any
      failures (update/remove any existing tests that assert on the
      removed `DataSchema` prototype fields)
