## Context

`buildTemplateData` (`packages/core/src/renderer.ts`) currently hard-codes
a `Need.outcome.status` -> `Statement.outcome.label` lookup
(`OUTCOME_STATUS_LABEL`). This is the first of what the proposal expects
to be several similar "opinionated text" mappings over time. There's no
existing config-file concept in this codebase beyond the `Plan`/`Template`
JSON schemas and the CLI's own flags — this change introduces the first
one.

## Goals / Non-Goals

**Goals:**

- A `Mapping` object holds every user-overridable text choice. Today:
  `outcomeStatus`.
- Built-in defaults so a mapping file is optional to supply at all.
- A user-supplied mapping file must be complete (every key present) —
  no partial-override merge semantics.
- `buildTemplateData`/`render()` take an optional resolved `Mapping`.
- `dhplan render`/`dhplan inspect` gain `--mapping <file>`.
- `mapping` becomes a third type for `dhplan schema`/`dhplan validate`
  (including `schema mapping --sample`), consistent with `plan`/`template`.

**Non-Goals:**

- Migrating any other hard-coded text (e.g. goal labels `1a`, `2b`) into
  the mapping in this change — only `outcomeStatus` exists today;
  the structure is designed to grow, not populated speculatively.
- Partial/per-key overrides. Supplying a mapping file at all means
  supplying every key; there is no merge-over-defaults behavior — only
  the binary choice of "use the built-in defaults" (omit `--mapping`) or
  "use this fully-specified mapping" (`--mapping <file>`). This keeps a
  provided mapping file self-contained and unambiguous to read, at the
  cost of the user having to repeat values they don't want to change.
- Any persistence/discovery mechanism for mapping files beyond "pass a
  path on the CLI" (no config search paths, no env vars).

## Decisions

- **A single `Mapping` schema, fully required — no separate "overrides"
  schema.** A user-supplied mapping file must satisfy the exact same
  `Mapping` shape that `buildTemplateData` consumes internally: every
  section, every key, always a string. There's no partial/optional
  variant, so there's nothing to merge.

  ```ts
  const OutcomeStatusLabels = z.object({
    met: z.string(),
    partial: z.string(),
    unmet: z.string(),
  });

  export const Mapping = z.object({
    outcomeStatus: OutcomeStatusLabels,
  });
  export type Mapping = z.infer<typeof Mapping>;
  ```

- **Defaults live next to the schema, as a plain `Mapping`-typed
  constant**, in `packages/core/src/schema/mapping.ts`:

  ```ts
  export const DEFAULT_MAPPING: Mapping = {
    outcomeStatus: { met: "Met", partial: "Partially met", unmet: "Not met" },
  };
  ```

  These are exactly today's hard-coded `OUTCOME_STATUS_LABEL` values, so
  this change is behavior-preserving when no override file is given.

- **`resolveMapping(mapping?: Mapping): Mapping` is a simple fallback, not
  a merge**: it returns the given `Mapping` unchanged if one is provided,
  or `DEFAULT_MAPPING` if not. There is no per-key merging — a mapping
  file either replaces the defaults entirely (every key required) or is
  omitted entirely.

- **`buildTemplateData(plan: Plan, mapping: Mapping = DEFAULT_MAPPING):
  Template`** — the outcome label lookup becomes
  `mapping.outcomeStatus[need.outcome.status]` instead of the
  module-level `OUTCOME_STATUS_LABEL` constant, which is deleted.

- **`render(planInput, templateInput, mappingInput?: ArrayBuffer):
  RenderResult`** — a third, optional `ArrayBuffer` parameter, consistent
  with `render()`'s existing "no file I/O, `ArrayBuffer` in" contract. If
  provided, `render()` SHALL parse and validate it against `Mapping` (via
  a new `validateMapping`, mirroring `validateData`/`validateTemplate`)
  before using it; validation failure returns the same
  failure-with-issues shape the other two validations already use,
  without attempting to render. If omitted, `render()` uses
  `DEFAULT_MAPPING`.

- **CLI wiring**: `render` and `inspect` both gain an optional
  `--mapping <file>` option. `render` passes the file's raw bytes straight
  through to `render()`'s new third parameter (same pattern as `plan`/
  `template`). `inspect` doesn't go through `render()`, so it reads and
  validates the mapping file itself (mirroring how it already handles the
  plan file), then calls `buildTemplateData(plan, resolveMapping(mapping))`.

- **`mapping` joins `plan`/`template` as a `schema`/`validate` type.**
  `dhplan schema mapping` prints `getMappingSchema()` — the JSON Schema
  for `Mapping`, the exact shape a mapping file must satisfy. `dhplan
  schema mapping --sample` prints `getMappingSample()`, which returns
  `DEFAULT_MAPPING` as a ready-to-use, complete example. `dhplan validate
  mapping <file>` validates against `Mapping` via `validateMapping`.

- **`getMappingSample()` lives in `packages/core/src/sampler.ts`, not
  `schema/mapping.ts`.** `getPlanSample`/`getTemplateSample` already live
  together in `sampler.ts` (from an earlier change), so every `--sample`
  example is discoverable in one place; only `getMappingSchema()` — which
  is schema-derivation logic, not example data — stays in
  `schema/mapping.ts` next to `Mapping`.

## Risks / Trade-offs

- [Requiring a complete mapping file is less convenient than a
  single-key override when a user only wants to change one label] →
  accepted; `dhplan schema mapping --sample` gives a ready-to-copy full
  example, so the actual authoring cost is "copy the sample, edit the one
  line you care about," not writing a mapping from scratch. If partial
  overrides prove genuinely wanted later, `resolveMapping` is the single
  place that would need to grow a merge step.
- [Adding a third schema type touches four CLI commands at once
  (`schema`, `validate`, `render`, `inspect`)] → mitigated by `schema`/
  `validate` already being type-parameterized (`SCHEMA_TYPES` array), so
  adding `"mapping"` is mostly additive, not a rewrite.
