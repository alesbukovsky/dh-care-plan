## 1. Dependencies

- [x] 1.1 Add `lodash` as an exact-pinned dependency (`4.17.23`) of
      `packages/core/package.json`, required at runtime by docxtemplater's
      own `InspectModule` (undeclared in docxtemplater's own dependencies —
      discovered while implementing template validation, see design.md)

## 2. Data validation

- [x] 2.1 Add `packages/core/src/validator.ts` with `validateData(input:
      ArrayBuffer)` — matching `validateTemplate`'s signature so both
      validators share one interface — that `JSON.parse`s the buffer
      (reporting a parse failure as a `{ path: "", message }` issue,
      mirroring `validateTemplate`'s read-failure handling), then wraps
      `DataSchema.safeParse` and returns `{ valid: true }` or
      `{ valid: false, issues: { path, message }[] }` with every issue from
      `result.error.issues`

## 3. Template validation

- [x] 3.1 In `packages/core/src/validator.ts`, add
      `validateTemplate(templateBuffer: ArrayBuffer)`
- [x] 3.2 Inside it, build a `Docxtemplater` instance from the buffer using
      the same options as `renderCarePlan` (`expressionParser`,
      `paragraphLoop: true`, `linebreaks: true`), plus
      `modules: [new InspectModule()]` and `nullGetter: () => ""`; wrap zip
      loading and `doc.render({})` in try/catch, reporting a read-failure
      issue (not a tag issue) if either throws
- [x] 3.3 Extract the tag tree via `InspectModule#getAllTags()`
- [x] 3.4 Implement a recursive walk that matches the tag tree against
      `TemplateSchema.shape`, descending into a loop tag's nested tags via
      `field.element.shape` when the field is `instanceof z.ZodArray` with
      an `instanceof z.ZodObject` element, and collecting every tag not
      defined at its scope as a `{ path, message }` issue
- [x] 3.5 Return `{ valid: true }` when no undefined tags are found, else
      `{ valid: false, issues: [...] }`

## 4. Exports

- [x] 4.1 Export `validateData` and `validateTemplate` from
      `packages/core/src/index.ts`

## 5. CLI

- [x] 5.1 Add a `validate <schema_type> <file>` subcommand to
      `packages/core/cli/dhplan.ts`, using the same
      `.addArgument(new Argument(...).choices(["data", "template"]))` pattern
      as `schema`
- [x] 5.2 Read `<file>` once as an `ArrayBuffer` (`Bun.file(file).arrayBuffer()`),
      catching read errors (e.g. missing file) and reporting them to
      stderr with a non-zero exit before calling either validator
- [x] 5.3 Dispatch on `schema_type` to pick `validateData` or
      `validateTemplate` (`schemaType === "data" ? validateData :
      validateTemplate`), call it with the same buffer, print `"<file> is
      valid"` and exit `0` on success, or print each `path: message` issue
      to stderr and exit non-zero on failure — identical handling for both
- [x] 5.4 Confirm an invalid `schema_type` is rejected by Commander's
      `.choices()` before any file is read (consistent with `schema`'s
      existing behavior)

## 6. Tests and fixtures

- [x] 6.1 Add `packages/core/tests/validator.test.ts` covering
      `validateData` (malformed JSON input, and the placeholder schema's
      current accept-anything behavior — validating against real
      `DataSchema` field violations is out of scope while it's still a
      placeholder) and `validateTemplate` (a small fixture `.docx` with no
      tags, confirming it validates against the placeholder
      `TemplateSchema`; a fixture `.docx` with at least one tag, confirming
      it's reported as an undefined-tag issue against the placeholder
      schema); build fixture `.docx` buffers in-test via a small PizZip
      helper rather than committing binary files
- [x] 6.2 Split `packages/core/tests/cli/dhplan.test.ts` into
      `packages/core/tests/cli/dhplan-schema.test.ts` (move the existing
      `schema` subcommand tests there unchanged) and
      `packages/core/tests/cli/dhplan-validate.test.ts` (new `validate`
      subcommand tests: valid/invalid `data` file, valid/invalid `template`
      file, invalid `schema_type`), sharing the `runCli` helper via a small
      shared module instead of duplicating it
- [x] 6.3 Run `bun test:core` and `bun lint` from the repo root; fix any
      failures

## 7. Verification

- [x] 7.1 Manually run `dhplan validate data <valid-file>` and
      `dhplan validate data <malformed-json-file>`, confirm exit codes and
      messages
- [x] 7.2 Manually run `dhplan validate template <docx-without-tags>` and
      `dhplan validate template <docx-with-tags>`, confirm exit codes and
      messages
- [x] 7.3 Manually run `dhplan validate nonsense <file>`, confirm it errors
      before reading `<file>`
