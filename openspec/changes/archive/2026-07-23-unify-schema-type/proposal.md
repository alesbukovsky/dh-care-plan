## Why

`schema` and `validate` each independently declare the same `data`/`template`
choice: `schema` names its positional argument `<target>` (parameter
`target`), `validate` names the same concept `<schema_type>` (parameter
`schemaType`), and both repeat the literal `["data", "template"]` choices
array. As more commands are added, this drift (different argument names
for the same concept, duplicated choice lists) will only compound. (Each
command's `condition === "data" ? A : B` ternary that picks the matching
schema or validator stays a ternary — confirmed there are, and will only
ever be, exactly two schema types, so unifying the choices list is the
only duplication worth fixing here.)

## What Changes

- Introduce one `SchemaType` union (`"data" | "template"`) and its backing
  `SCHEMA_TYPES` const array in `packages/core/cli/dhplan.ts`, reused by
  both commands' `Argument(...).choices(...)`.
- Both commands' positional argument (and callback parameter) is renamed
  to `<type>` (parameter `type`): `schema`'s from `<target>` (parameter
  `target`), and `validate`'s from its already-shipped `<schema_type>`
  (parameter `schemaType`). `type` was chosen over the initially-considered
  `schema_type` as too verbose for a two-value CLI choice (see design.md
  Decision 2).
- **BREAKING** (loosely): both commands' `--help` text and invalid-argument
  error message now say `type` instead of `target` (`schema`) or
  `schema_type` (`validate`). Each argument's position and accepted values
  (`data`, `template`) are unchanged; only the displayed name changes.
  Pre-1.0, no external consumers.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `cli`: Both the `schema` and `validate` command requirements are updated
  to name their positional argument `type` (`schema` was `target`;
  `validate` was `schema_type`). No change to either command's accepted
  values or exit-code behavior.

## Impact

- `packages/core/cli/dhplan.ts` — add `SCHEMA_TYPES`/`SchemaType`; rename
  both commands' argument/parameter to `type`; each command's
  `type === "data" ? A : B` ternary is kept, just retyped to the shared
  `SchemaType`.
- `packages/core/tests/cli/dhplan-validate.test.ts` — test description
  mentioning `schema_type` updated to `type` (no assertion changes).
- `packages/core/tests/cli/dhplan-schema.test.ts` — no assertion changes
  expected (tests check for the substrings `data`/`template`, not
  `target`), but the test description is updated for accuracy.
