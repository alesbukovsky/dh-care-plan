## MODIFIED Requirements

### Requirement: Template schema exportable as JSON Schema

The system SHALL expose a `getTemplateSchema()` function
(`packages/core/src/schema/template.ts`) that produces a JSON Schema
document for `Template` on demand, using a `template.ts`-local zod
registry independent of `plan.ts`'s registry, mirroring the pattern used by
`getPlanSchema()`. Any object registered on that local registry SHALL be
extracted to `$defs` rather than inlined, and the returned document SHALL
carry its own `$id` of `${SCHEMA_BASE_URI}/template.schema.json`, where
`SCHEMA_BASE_URI` (`packages/core/src/schema/common.ts`) is the base URI
shared with the plan schema's `$id`. `SCHEMA_BASE_URI` itself SHALL NOT
have a trailing slash (for readability when referenced on its own); the
`/` separator SHALL be added at the `$id` join site instead.

#### Scenario: Generating JSON Schema for the template schema

- **WHEN** `getTemplateSchema()` is called
- **THEN** the system SHALL return a valid JSON Schema document whose
  top-level `$id` is `${SCHEMA_BASE_URI}/template.schema.json` (currently an
  empty object schema's `$defs`/properties until template fields are
  defined in a future change)
