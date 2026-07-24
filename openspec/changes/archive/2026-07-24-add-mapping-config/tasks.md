## 1. Mapping schema and resolution

- [x] 1.1 Create `packages/core/src/schema/mapping.ts` with a single
      `Mapping` zod schema (every field required), with an
      `outcomeStatus` section (`met`/`partial`/`unmet` -> string)
- [x] 1.2 Add `DEFAULT_MAPPING: Mapping` with today's exact values
      (`"Met"`, `"Partially met"`, `"Not met"`)
- [x] 1.3 Add `resolveMapping(mapping?: Mapping): Mapping` — returns the
      given `Mapping` unchanged if provided, else `DEFAULT_MAPPING` (no
      merge; a supplied mapping must be complete)
- [x] 1.4 Add `getMappingSchema(): object` (JSON Schema for `Mapping`) to
      `packages/core/src/schema/mapping.ts`, and add
      `getMappingSample(): Mapping` (returns `DEFAULT_MAPPING`) to
      `packages/core/src/sampler.ts`, alongside `getPlanSample`/
      `getTemplateSample`

## 2. Validation

- [x] 2.1 Add `validateMapping(input: ArrayBuffer): ValidationResult` to
      `packages/core/src/validator.ts`, parsing JSON and validating
      against `Mapping` (every key required), matching the shape of
      `validateData`/`validateTemplate`

## 3. Renderer

- [x] 3.1 Change `buildTemplateData`'s signature to
      `buildTemplateData(plan: Plan, mapping: Mapping = DEFAULT_MAPPING):
      Template` and use `mapping.outcomeStatus[need.outcome.status]`
      instead of the hard-coded `OUTCOME_STATUS_LABEL` (delete that
      constant)
- [x] 3.2 Change `render`'s signature to accept an optional third
      `ArrayBuffer` parameter; when present, validate it via
      `validateMapping`, return a failure result with its issues on
      failure (without rendering), otherwise parse it and pass the
      result to `buildTemplateData`; when absent, call `buildTemplateData`
      with no mapping argument

## 4. CLI

- [x] 4.1 Add `"mapping"` to the CLI's `SCHEMA_TYPES` tuple and wire
      `getMappingSchema`/`getMappingSample` into the `schema` command
- [x] 4.2 Wire `validateMapping` into the `validate` command for the
      `mapping` type
- [x] 4.3 Add an optional `--mapping <file>` option to `render`; when
      given, read the file and pass its bytes as `render()`'s third
      argument
- [x] 4.4 Add an optional `--mapping <file>` option to `inspect`; when
      given, read and validate the file with `validateMapping`, report
      issues and exit non-zero on failure (without calling
      `buildTemplateData`), otherwise pass the parsed mapping to
      `buildTemplateData`

## 5. Tests

- [x] 5.1 Add unit tests for `resolveMapping`: no mapping given (returns
      defaults), a given mapping is returned unchanged (no merge)
- [x] 5.2 Add unit tests for `validateMapping`: valid full mapping,
      rejects an empty object, rejects a partial mapping (missing keys),
      rejects a non-string label value, malformed JSON
- [x] 5.3 Update `buildTemplateData` tests for the new optional `mapping`
      parameter: default behavior unchanged, custom mapping changes the
      resulting label
- [x] 5.4 Update `render()` tests for the new optional third parameter:
      valid (full) mapping file, invalid/incomplete mapping file, omitted
      mapping
- [x] 5.5 Add CLI tests: `schema mapping`, `schema mapping --sample`,
      `validate mapping <file>` (valid/invalid), `render ... --mapping
      <file>` (valid/invalid), `inspect <plan> --mapping <file>`
      (valid/invalid)
- [x] 5.6 Run `bun test:core` and confirm it passes
