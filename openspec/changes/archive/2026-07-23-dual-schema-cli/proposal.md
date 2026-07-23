## Why

The core package currently exposes a single `DataSchema` schema shaped after the
natural hierarchy of a care plan (patient, subjective, objective,
assessments). Docxtemplater, however, resolves tags against a flat data
object, so the buffer/render step will eventually need a second, flat schema
generated from the structured one. Neither the flat schema nor a way to
inspect either schema currently exists, and there is no CLI surface for data
authors or template authors to discover the shape they must produce/target.

## What Changes

- The existing `DataSchema` content in `packages/core/src/schema/data.ts` was
  prototype/throwaway exploration, not a settled shape. It is replaced with
  an explicit empty placeholder, on equal footing with the new template
  schema, until the real nested shape is designed.
- Add a placeholder flat `template` schema (zod) representing the shape
  docxtemplater tag resolution expects. The actual data→template conversion
  logic is out of scope for this change; only the schema placeholder and its
  JSON Schema export are being introduced now.
- Add a `dhplan schema <data|template>` CLI command (Commander.js) that
  prints the JSON Schema for the requested schema to stdout, using zod's
  built-in `z.toJSONSchema()` (already available via the pinned zod
  dependency, no new JSON-schema library required). `schema` is the only
  command actually wired up in this change.
- Add `commander` as a new exact-pinned dependency of `packages/core`.
- **BREAKING**: The CLI's existing `dhplan <template> <data> <output>`
  render invocation is removed from the live command surface. The
  read/render/write logic is kept only as commented-out code in
  `cli/dhplan.ts` for future reference — it is not reachable from the CLI
  until a future change re-wires it (e.g. under a `render` subcommand).

## Capabilities

### New Capabilities

- `data-schema`: The structured, nested zod schema placeholder that
  care-plan data authors will eventually write JSON files against;
  exposable as JSON Schema. The previous prototype fields (patient/
  subjective/objective/assessments) are discarded, not carried forward.
- `template-schema`: The flat zod schema placeholder tailored to
  docxtemplater tag resolution, which the (future) conversion process
  produces from `data-schema`; exposable as JSON Schema.
- `cli`: The `dhplan` Commander.js CLI surface, starting with the `schema`
  command (`schema data`, `schema template`) that prints the requested
  schema's JSON Schema.

### Modified Capabilities

(none — no previously spec'd capability exists yet in this repo)

## Impact

- `packages/core/src/schema/data.ts` — prototype `DataSchema` fields removed;
  replaced with an empty placeholder for the `data-schema` capability.
- `packages/core/src/schema/template.ts` (new) — placeholder flat schema for
  `template-schema`.
- `packages/core/src/index.ts` — export the new template schema alongside
  `DataSchema`.
- `packages/core/cli/dhplan.ts` — rebuilt on Commander.js with only a
  `schema` subcommand live; the previous render invocation (`Bun.file`
  reads, `renderCarePlan` call, output write) is kept as commented-out code
  for future reference, not deleted and not wired up.
- `packages/core/package.json` — add pinned `commander` dependency.
