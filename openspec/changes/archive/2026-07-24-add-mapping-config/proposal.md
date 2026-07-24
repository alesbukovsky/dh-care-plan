## Why

`buildTemplateData` currently hard-codes user-facing text choices —
today just the `Need.outcome.status` -> `Statement.outcome.label`
lookup (`"met"` -> `"Met"`, etc.) — directly in
`packages/core/src/renderer.ts`. As more such opinionated text mappings
get added over time, users will want to customize the wording (e.g. a
clinic's house style, or a different language) without forking the code.
A configurable mapping, with sensible built-in defaults and an optional
fully-specified replacement file, solves this for the current status
labels and gives a clear extension point for future ones.

## What Changes

- Introduce a `Mapping` concept: a small, versioned config object holding
  every user-overridable text mapping. For now it has one section,
  `outcomeStatus` (`met`/`partial`/`unmet` -> display string),
  matching today's hard-coded lookup.
- Ship built-in defaults (today's exact current text) so a mapping file
  is optional to supply at all.
- A user can supply a JSON mapping file that fully specifies every key
  (no partial overrides — supplying a file means supplying the whole
  thing); it's validated against a schema before use.
- `buildTemplateData` and `render()` SHALL accept an optional `Mapping`
  (defaults used when omitted) and use it instead of the hard-coded
  lookup.
- `--mapping <file>` SHALL be added as an optional flag to `dhplan render`
  and `dhplan inspect`, so a user can point either command at a custom
  mapping file.
- `mapping` SHALL become a third schema type alongside `plan`/`template`
  for `dhplan schema` (including `--sample`) and `dhplan validate`, so
  users can discover the mapping file's shape (and get a ready-to-copy
  full example via `--sample`) and validate one before using it.

## Capabilities

### New Capabilities

- `mapping`: the `Mapping` config concept — schema, defaults, the
  default-or-given resolution, and validation of mapping files.

### Modified Capabilities

- `renderer`: `buildTemplateData` and `render()` accept an optional
  `Mapping` and use it for the outcome status label lookup instead of a
  hard-coded table.
- `cli`: `schema` and `validate` gain `mapping` as a third `<type>`
  choice; `render` and `inspect` gain an optional `--mapping <file>` flag.

## Impact

- `packages/core/src/schema/mapping.ts` (new: `Mapping` schema, defaults,
  `resolveMapping()`)
- `packages/core/src/renderer.ts` (`buildTemplateData`, `render()`
  signatures and outcome label lookup)
- `packages/core/src/validator.ts` (mapping file validation)
- `packages/core/src/index.ts` (new exports)
- `packages/core/cli/dhplan.ts` (`schema`, `validate`, `render`, `inspect`
  commands)
- Core test suite: new tests for mapping resolution/validation, updated
  tests for `buildTemplateData`/`render()`'s new optional parameter, new
  CLI tests for `--mapping` and the `mapping` schema type
