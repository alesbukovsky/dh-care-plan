## Context

`packages/core` has two placeholder zod schemas (`DataSchema`,
`TemplateSchema`, both `z.object({})`) and a `dhplan schema <target>` CLI
command that prints either as JSON Schema. Nothing currently checks a real
file against either schema. `renderCarePlan` (`src/renderCarePlan.ts`)
already uses `docxtemplater`/`pizzip` to render a `.docx` against data, but
only as a render step — it has no mode for inspecting a template's tags
without data.

Two very different kinds of validation are being asked for:

- **Data**: a JSON *value* validated against a zod schema — a direct,
  well-supported `safeParse` call.
- **Template**: a `.docx` file has no data to validate; only tag *names*
  (and their nesting inside loop/section tags) can be checked against the
  schema's *keys*. This requires extracting tags from the document without
  rendering it, then matching that tag tree against the schema's shape.

## Goals / Non-Goals

**Goals:**

- Add a generic `validateData`/`validateTemplate` pair in `src/validator.ts`
  that works against whatever `DataSchema`/`TemplateSchema` contain today
  *and* after they're populated in a future change — no CLI or validation
  logic changes needed when that happens.
- Wire both into `dhplan validate <schema_type> <file>`, reporting every
  issue found, not just the first.
- Reuse existing pinned dependencies (`zod`, `docxtemplater`, `pizzip`) as
  much as possible, adding only what docxtemplater's own tooling requires
  (see Decision 2).

**Non-Goals:**

- Defining the real (non-placeholder) shape of `DataSchema` or
  `TemplateSchema`. Out of scope, per the existing `data-schema`/
  `template-schema` specs.
- Validating a template's tags *against actual data* (i.e., a dry-run
  render). `validate template` only checks tag names/nesting against the
  schema; it never needs a data file.
- A `--json` / machine-readable output mode for validation results. Deferred
  until a real consumer needs it (stdout/stderr text is sufficient for now,
  matching `schema`'s minimalism).

## Decisions

**1. `validateData` and `validateTemplate` share one interface: both take
the file's raw bytes (`ArrayBuffer`) and return `ValidationResult`.**

Both functions have the signature `(input: ArrayBuffer) => ValidationResult`
(aliased as `Validator` in `src/validator.ts`). `validateData` does its own
`JSON.parse` internally and reports a parse failure as an ordinary
`{ path: "", message }` issue in the same result shape, exactly mirroring
how `validateTemplate` already reports a bad `.docx`/zip read as an issue
rather than throwing. This lets a caller like the CLI read a file once
(`Bun.file(file).arrayBuffer()`) and dispatch to either validator without
branching on how each one wants its input pre-processed:
`schemaType === "data" ? validateData : validateTemplate`. An earlier
version had `validateData` take an already-parsed value, with `JSON.parse`
happening in the CLI action — rejected on review because it gave the two
validators different call shapes for no real benefit, and pushed
content-level error handling (JSON parsing) out to the caller for data
while keeping it inside the function for templates, an inconsistency with
no justification once both report failures the same way.

**2. `validateTemplate` extracts tags via docxtemplater's `InspectModule`,
using a `nullGetter` so extraction never depends on real data.**

Docxtemplater ships an `InspectModule` (`docxtemplater/js/inspect-module`)
that records every tag it encounters while the document is processed. Tags
are recorded during `doc.render()`, not `doc.compile()`, so rendering still
has to run — but with no real data, `render()` throws on any undefined tag
by default. To avoid needing a data file at all, the `Docxtemplater`
instance is constructed with the module attached and `nullGetter: () =>
""`, then rendered with `{}`, so every tag resolves to an empty string
instead of throwing.

Building the `Docxtemplater` instance (wrapping the buffer in `PizZip`,
plus the fixed `parser`/`paragraphLoop`/`linebreaks` options) is shared
with `renderCarePlan` via `createTemplater(input, options?)` in
`templater.ts` — `parser: expressionParser`, `paragraphLoop: true`, and
`linebreaks: true` are hardcoded inside it (so every call site sees the
document parsed identically), while everything else
(`Docxtemplater.DXT.ConstructorOptions` minus those three keys — e.g.
`modules`, `nullGetter`) is passed through by the caller.
`validateTemplate` calls it with `{ modules: [inspector], nullGetter: () =>
"" }`; `renderCarePlan` calls it with no extra options. This is what lets
tag extraction see the document the same way an actual render would, by
construction rather than by keeping two option lists in sync. Alternative
considered:
parse the `.docx` XML directly with a regex/XML walk for `{tag}` patterns —
rejected because it would reimplement docxtemplater's own tag/loop/section
parsing (delimiters, nested scopes, `{#loop}` syntax) and drift from it
over time. Alternative also considered: use `doc.getFullText()` (raw text
with tag markers intact, no module needed) plus a small hand-written
scanner for `{tag}`/`{#loop}...{/loop}` patterns — rejected for the same
reimplementation-drift reason, and because it would only reliably handle
simple tag/loop syntax, not the full range docxtemplater's own parser
already handles (custom delimiters, inverted sections, sub-templates).

`InspectModule` (`docxtemplater/js/inspect-module.js`) turned out to
`require("lodash")` internally, which is **not** a dependency of the
installed `docxtemplater` package — only a devDependency docxtemplater
uses for its own build/tests — so calling `new InspectModule()` throws
`Cannot find package 'lodash'` unless it's present. `lodash` (`4.17.23`,
matching the version docxtemplater's own devDependency pins) is added as
an explicit exact-pinned dependency of `packages/core` to satisfy this.
This was confirmed via a smoke test against a hand-built minimal `.docx`
before and after adding the dependency.

**3. Tag-tree-vs-schema matching walks `TemplateSchema`'s zod shape
recursively, scope by scope.**

`getAllTags()` returns a tree: top-level keys are tags used at the root
scope; a key's value is itself a tag tree for tags used *inside* that
tag's loop/section scope. Matching walks this tree against
`TemplateSchema.shape`, and when descending into a loop tag whose field is
`instanceof z.ZodArray` with an `instanceof z.ZodObject` element, continues
into that array element's `.shape` for the nested tags — both are public
zod v4 APIs, not internal fields. A tag not present in the current scope's
shape is
recorded as an issue (path + tag name); a tag with nested children but no
matching array-of-object field reports every nested tag as undefined too,
since there is no schema to validate against at that scope. Alternative
considered: only check top-level tag names and ignore loop nesting
entirely — rejected because the proposal explicitly asks for tags to be
validated against what `TemplateSchema` "specifies," and a flat
top-level-only check would let a template reference nonsense fields inside
a loop undetected.

**4. `validate` CLI output is plain text to stdout/stderr, one issue per
line; no output file.**

Same minimalism as `schema`: `dhplan validate data care-plan.json` prints
`care-plan.json is valid` on success, or one `<path>: <message>` line per
issue on stderr on failure (`<tag> at <scope>: not defined in
TemplateSchema` for templates). Composable with shell exit-code checks
(`&&`, CI steps) without needing a flag to opt into that behavior.

## Risks / Trade-offs

- [`validate template` currently rejects almost any real-world `.docx`,
  since `TemplateSchema` is still `z.object({})`] → Expected placeholder
  behavior, same as `schema template`'s empty output today; resolves once
  `template-schema` is populated in a future change. Called out in the
  proposal so it isn't mistaken for a bug.
- [Rendering with `nullGetter: () => ""` to extract tags means any
  docxtemplater module/parser behavior that depends on actual values (e.g.
  a custom parser branching on a value's type) could extract a different
  tag set than a real render would] → Acceptable: `renderCarePlan`'s parser
  (`expressions.js`) resolves tag *names* independent of their eventual
  values, so this only matters for exotic custom parsers, which this
  project doesn't use.
- [`lodash` is a large, general-purpose dependency added solely to satisfy
  `InspectModule`'s own undeclared runtime requirement, not something this
  project otherwise needs] → Accepted: it's the officially shipped
  docxtemplater API for tag inspection, exact-pinned like every other
  dependency, and avoids reimplementing docxtemplater's own tag/loop
  parsing (see Decision 2's rejected alternatives).

## Migration Plan

Not applicable — purely additive CLI surface and new `src/validator.ts`
module; no existing behavior changes other than the `cli` spec's help text
now listing `validate` alongside `schema`.

## Open Questions

- Should `validate template` report the *line/paragraph* location of an
  undefined tag, not just its name and loop scope? Deferred until
  `TemplateSchema` has real fields and this becomes a practical authoring
  pain point.
