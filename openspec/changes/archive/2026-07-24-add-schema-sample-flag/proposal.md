## Why

`dhplan schema <type>` prints the JSON Schema document for `plan` or `template`, which is precise but not easy to read
at a glance — a new user wanting to know "what does an actual plan/template JSON file look like" has to mentally
translate JSON Schema into an example. A `--sample` flag that prints a realistic example JSON document instead removes
that translation step.

## What Changes

- Add a `--sample` flag to the existing `dhplan schema <type>` command. When passed, the command prints a full example
  JSON document matching `Plan` or `Template` (depending on `<type>`) instead of the JSON Schema document.
- The sample SHALL be valid against the corresponding zod schema (i.e. parses successfully), and SHALL exercise every
  field defined on that schema, including optional ones (`Need.relatedTo`, `Need.evidencedBy`, `Need.goals`,
  `Goal.doneBy`), so it also serves as a template-authoring reference.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `cli`: `schema` command gains an optional `--sample` flag that changes its output from a JSON Schema document to an
  example JSON document.

## Impact

- `packages/core/cli/dhplan.ts` (`schema` command)
- `packages/core/src/sampler.ts` (new module; `getPlanSample()` / `getTemplateSample()`)
- `packages/core/src/index.ts` (export the new sample accessors)
