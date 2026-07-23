## Why

`dhplan schema <data|template>` lets authors *discover* the required shape,
but nothing checks a file *against* that shape before it reaches
`renderCarePlan`. Data authors have no way to confirm a JSON file satisfies
`DataSchema` before rendering, and template authors have no way to confirm a
`.docx` only references tags that `TemplateSchema` will actually resolve.
Both failure modes currently surface only as opaque docxtemplater render
errors (or silent data loss) instead of an actionable, pre-render check.

## What Changes

- Add a `dhplan validate <schema_type> <file>` CLI command, mirroring the
  `schema <target>` argument pattern (`schema_type` accepts exactly `data` or
  `template`).
- `validate data <file>`: reads the file as JSON and fully validates it
  against `DataSchema` via zod's `safeParse`. Reports every validation issue
  (path + message), not just the first, and exits non-zero on any failure.
- `validate template <file>`: reads the file as a `.docx`, extracts every
  docxtemplater tag it references (including tags nested inside loop/section
  scopes) without rendering, and checks that each tag is a key `TemplateSchema`
  actually defines at that scope. This is a tag-existence check, not a
  render — there is no data to render against, so we validate structurally
  against the schema rather than resolving values.
- Both subcommands print a success message and exit `0` when the file is
  valid, or print every discovered issue to stderr and exit non-zero
  otherwise.
- `validateData` and `validateTemplate` share one interface: both take the
  file's raw bytes and return the same `ValidationResult` shape, including
  content-level failures (malformed JSON; an unreadable `.docx`) reported
  as an ordinary issue rather than a thrown exception. This lets the CLI
  read the file once and dispatch to whichever validator matches
  `schema_type` without special-casing either.
- Since `DataSchema` and `TemplateSchema` are still empty placeholders (see
  `data-schema`/`template-schema` specs), `validate data` currently accepts
  any JSON object and `validate template` currently rejects any template
  that references tags at all — this is expected placeholder behavior, not a
  bug, and resolves itself once those schemas are populated in a future
  change.

## Capabilities

### New Capabilities

- `validate`: Validation logic — fully validating a JSON data file against
  `DataSchema`, and validating that a `.docx` template's docxtemplater tags
  (including nested loop/section tags) are all defined by `TemplateSchema`.

### Modified Capabilities

- `cli`: Add the `validate <schema_type> <file>` subcommand alongside the
  existing `schema <target>` subcommand, including argument validation for
  an invalid `schema_type`.

## Impact

- `packages/core/src/validator.ts` (new) — `validateData` and
  `validateTemplate` functions. `validateData` wraps `DataSchema.safeParse`.
  `validateTemplate` uses docxtemplater's inspection module to extract
  referenced tags without rendering, then checks them against
  `TemplateSchema`'s shape (recursing into nested loop scopes).
- `packages/core/src/templater.ts` (new) — `describeTemplaterError`,
  extracted from `renderCarePlan.ts` so both it and `validateTemplate`
  share one implementation of reading docxtemplater's undocumented thrown
  error shape, instead of duplicating that type/logic per call site. Also
  `createTemplater(input, options?)`, which builds the `PizZip` +
  `Docxtemplater` instance shared by both call sites: `parser`,
  `paragraphLoop`, and `linebreaks` are hardcoded inside it, and any other
  `Docxtemplater.DXT.ConstructorOptions` (e.g. `modules`, `nullGetter`) can
  be passed in.
- `packages/core/src/renderCarePlan.ts` — its inline `DocxtemplaterError`
  handling and manual `PizZip`/`Docxtemplater` construction are replaced
  with calls to the shared `describeTemplaterError`/`createTemplater`; no
  behavior change.
- `packages/core/src/index.ts` — export `validateData` and
  `validateTemplate`.
- `packages/core/cli/dhplan.ts` — add the `validate <schema_type> <file>`
  subcommand.
- `packages/core/package.json` — reuses the existing pinned `zod`,
  `docxtemplater`, and `pizzip`; adds one new exact-pinned dependency,
  `lodash` (`4.17.23`), required at runtime by docxtemplater's own
  `InspectModule` (see design.md).
- Test fixtures (new) — a small valid/invalid JSON pair and valid/invalid
  `.docx` pair under `packages/core/tests` to exercise both subcommands.
