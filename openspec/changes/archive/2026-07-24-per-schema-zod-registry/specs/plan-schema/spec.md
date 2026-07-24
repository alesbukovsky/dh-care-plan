## MODIFIED Requirements

### Requirement: Plan schema exportable as JSON Schema

The system SHALL expose a `getPlanSchema()` function
(`packages/core/src/schema/plan.ts`) that produces a JSON Schema document
for `Plan` on demand, so tooling and humans can inspect the required
data shape without reading the zod source. Objects registered on a
`plan.ts`-local zod registry (not the shared `z.globalRegistry`) SHALL be
extracted to a `$defs` section with in-document `$ref`s rather than inlined,
and the returned document SHALL carry its own `$id` of
`${SCHEMA_BASE_URI}/plan.schema.json`, where `SCHEMA_BASE_URI`
(`packages/core/src/schema/common.ts`) is the base URI shared with the
template schema's `$id`. `SCHEMA_BASE_URI` itself SHALL NOT have a
trailing slash (for readability when referenced on its own); the `/`
separator SHALL be added at the `$id` join site instead.

#### Scenario: Generating JSON Schema for the plan schema

- **WHEN** `getPlanSchema()` is called
- **THEN** the system SHALL return a valid JSON Schema document whose
  top-level `$id` is `${SCHEMA_BASE_URI}/plan.schema.json`, and any
  registered nested object (e.g. `Goal`, `Need`, `MetNeed`, `UnmetNeed`)
  SHALL appear once under `$defs` and be referenced via `$ref` everywhere
  else it is used, rather than being inlined at each usage site

#### Scenario: Plan schema ids are independent of the template schema's ids

- **WHEN** `plan.ts` and `template.ts` each register an object under the
  same id string (e.g. both defining an object registered as `"Need"`)
- **THEN** the system SHALL NOT raise a duplicate-id error and each
  schema's `get*Schema()` output SHALL resolve its own `$ref`s against its
  own `$defs`, independent of the other schema's registry
