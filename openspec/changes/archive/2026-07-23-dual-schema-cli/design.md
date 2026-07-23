## Context

`packages/core` currently has one zod schema (`DataSchema` in
`src/schema/data.ts`) and one CLI entry point (`cli/dhplan.ts`) that
positionally takes `<template> <data> <output>` and renders a docx via
`renderCarePlan`. There is no notion yet of a second, flat schema for
docxtemplater tags, no JSON Schema export, and no subcommand structure —
all three are needed to let data authors and template authors self-serve
against a published schema instead of reading `schema/data.ts` directly.

## Goals / Non-Goals

**Goals:**

- Give the `data-schema` and `template-schema` capabilities a concrete home
  in the source tree, each independently exportable and independently
  convertible to JSON Schema.
- Stand up a `dhplan schema <data|template>` command that prints JSON Schema
  to stdout for either. This is the only live command in this change.
- Move the CLI onto Commander.js.
- Preserve the previous render logic as commented-out code for future
  reference, so the read/render/write mechanics aren't lost, without
  wiring it up as a working command yet.

**Non-Goals:**

- Implementing the actual data→template conversion function. Only the
  schema placeholder for `template-schema` is introduced; the mapping logic
  is a future change.
- Deciding the final flat tag-naming convention (e.g. `patient_name` vs
  `patient.name` vs docxtemplater loop syntax for arrays). That decision
  depends on the conversion design, not on this change.
- Deciding the final nested shape of `data-schema`. The previous
  patient/subjective/objective/assessments fields were prototype
  exploration and are discarded, not carried forward as a draft.
- Re-wiring the render command. The previous `<template> <data> <output>`
  behavior is kept only as a commented-out reference in `cli/dhplan.ts`.

## Decisions

**1. Both `data-schema` and `template-schema` are empty/minimal zod object
placeholders, not a guessed real shape.**
The `DataSchema` fields previously in `schema/data.ts`
(patient/subjective/objective/assessments) were prototype exploration, not
a settled design — they are deleted rather than kept as a "draft." Flattening
into `template-schema` additionally requires a naming convention for nested
paths and a strategy for arrays (`appointments`, `medications`) that
docxtemplater loop tags need, which isn't decided yet either. Keeping both
schemas as explicit empty placeholders avoids the false impression that
either shape is settled:

```ts
// packages/core/src/schema/data.ts
import { z } from "zod";

// Placeholder: nested data shape TBD, previous prototype fields discarded.
export const DataSchema = z.object({});
export type DataSchema = z.infer<typeof DataSchema>;
```

```ts
// packages/core/src/schema/template.ts
import { z } from "zod";

// Placeholder: flat shape TBD once the data→template conversion is designed.
export const TemplateSchema = z.object({});
export type TemplateSchema = z.infer<typeof TemplateSchema>;
```

**2. Use zod v4's built-in `z.toJSONSchema()`, add no new JSON-schema
library.**
The pinned `zod` dependency (`4.4.3`) already ships native JSON Schema
conversion (`node_modules/zod/v4/core/to-json-schema.js`). A third-party
converter (e.g. `zod-to-json-schema`) would duplicate this and add a
dependency to keep pinned/updated for no benefit.

**3. Commander.js CLI with only `schema` wired up; render logic kept as a
commented-out block for future reference.**
Commander is the de facto standard for subcommand parsing in the Bun/Node
ecosystem, has zero runtime dependencies of its own, and its `.command()`
API maps directly onto `schema <data|template>`. The previous
`Bun.file`-read / `renderCarePlan` / `Bun.write` logic still has value as a
reference for the future `render` command, so it stays in `cli/dhplan.ts`
as a commented-out block (not deleted, not registered with Commander) —
explicit that it is inert. Alternative considered: delete the render code
outright — rejected since the user wants it kept for reference; also
considered wiring it up as a real `render` subcommand — rejected because
only `schema` was asked to be implemented in this change.

**4. `schema` prints to stdout, one JSON document, no file-writing.**
Keeps the command composable (`dhplan schema data > data.schema.json`)
without inventing an output-path argument.

## Risks / Trade-offs

- [Empty `template-schema` placeholder provides no real value to template
  authors yet] → Acceptable for this change; explicitly called out as a
  placeholder in the proposal and design so expectations are set, real
  fields land in the follow-up conversion change.
- [Removing `render` from the live command surface is a breaking CLI change
  for any existing scripts calling `dhplan <template> <data> <output>`
  directly] → Called out as **BREAKING** in the proposal; project is
  pre-1.0 (`0.1.0`) and CLI has no external consumers yet, so no migration
  shim is added.
- [Commented-out code drifts from the rest of the codebase over time (e.g.
  `renderCarePlan`'s signature changes, the comment doesn't)] → Acceptable
  short-term; it's explicitly a "future reference" note, not working code,
  and will be revisited (rewritten or deleted) when `render` is re-wired.
- [`z.toJSONSchema()` behavior/coverage could shift between zod minor
  versions] → Dependency is exact-pinned per project convention, so upgrades
  are explicit, reviewed commits, not silent.

## Migration Plan

Not applicable — no deployed consumers of the current CLI shape; this is a
direct code change on `main` behind the usual PR review, no data migration
or phased rollout needed.

## Open Questions

- What naming/flattening convention will `template-schema` actually use
  once the conversion is designed (dot-path vs underscore vs nested loops
  for docxtemplater sections)? Deferred to the conversion-process change.
- Should `schema` support an `--out <file>` flag in addition to stdout, or
  is stdout redirection sufficient? Deferred until a real user need shows up.
