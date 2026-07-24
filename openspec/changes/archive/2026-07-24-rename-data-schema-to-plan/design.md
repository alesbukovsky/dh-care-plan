## Context

`DataSchema` (`packages/core/src/schema/data.ts`), `TemplateSchema`
(`packages/core/src/schema/template.ts`), and the CLI's `data`/`template`
schema-type argument were named early, before the domain object they model
was settled as a "care plan." The rename touches five source files and
their tests but changes no runtime behavior — it is a pure identifier/file
rename plus a CLI argument string change.

## Goals / Non-Goals

**Goals:**

- `Plan` (in `plan.ts`) and `Template` become the canonical names for the
  two schemas everywhere: exports, imports, CLI argument values, tests.
- `dhplan schema plan` / `dhplan validate plan <file>` replace the `data`
  variants with no other CLI behavior change.

**Non-Goals:**

- No change to either schema's shape/fields.
- No change to `validateData`/`validateTemplate` function names or the
  `ValidationResult`/`ValidationIssue` shapes — only the schema symbol
  `validateData` references changes (`DataSchema` → `Plan`).
- No backwards-compatible alias for the old `data` CLI argument or the old
  `DataSchema`/`TemplateSchema` export names — this is a clean rename, not
  a deprecation.

## Decisions

- **File rename, not a re-export shim**: `data.ts` is renamed to
  `plan.ts` outright (via `git mv` semantics) rather than keeping `data.ts`
  as a re-export of `plan.ts`. There are no external consumers to cushion
  yet (package is unpublished, single-repo), so a shim would only add
  dead weight.
- **`template.ts` keeps its filename**: only the exported `TemplateSchema`
  symbol becomes `Template`; the file already matches the domain term, so
  there's no reason to rename it.
- **`validateData`/`validateTemplate` keep their names**: these describe
  the *input file kind* (a data file vs. a template file), which is
  orthogonal to what the schema itself is called. Renaming them to
  `validatePlan` would be a bigger, separately-motivated change; out of
  scope here.
- **CLI type list becomes `["plan", "template"]`**: `SCHEMA_TYPES` and the
  `type === "data"` branches in `dhplan.ts` switch to `"plan"`. No alias
  for `"data"` is kept (see Non-Goals).
- **Capability spec rename**: `openspec/specs/data-schema/` is renamed to
  `openspec/specs/plan-schema/` when this change is archived, since the
  capability it documents is the same one, just renamed. The delta spec in
  this change is authored under the existing `data-schema` folder (per
  the spec-authoring tool's convention for modified capabilities) and
  states the new name explicitly; the archive step performs the folder
  rename.

## Risks / Trade-offs

- [Any external script or doc referencing `dhplan schema data` /
  `dhplan validate data` breaks immediately, with no transition period] →
  Acceptable: the CLI has no external users yet (initial-commit-stage
  project); call out the break clearly in the proposal and PR description.
- [Renaming both the type export and the value export
  (`export type DataSchema` / `export const DataSchema`) in one pass risks
  a partial rename leaving a stale reference] → Mitigated by `tsc`/type
  checking and running the full test suite after the rename; the compiler
  will surface any missed `DataSchema`/`TemplateSchema` reference.
