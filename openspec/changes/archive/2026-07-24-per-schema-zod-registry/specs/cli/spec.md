## MODIFIED Requirements

### Requirement: `schema` command prints JSON Schema

The `dhplan schema <type>` command SHALL accept exactly one positional
argument, either `plan` or `template`, and print the corresponding
schema's JSON Schema document to stdout. The command SHALL obtain that
document by calling `getPlanSchema()` / `getTemplateSchema()` rather than
calling `z.toJSONSchema` on the zod schema directly.

#### Scenario: Requesting the plan schema

- **WHEN** a user runs `dhplan schema plan`
- **THEN** the system SHALL print the JSON Schema document returned by
  `getPlanSchema()` to stdout

#### Scenario: Requesting the template schema

- **WHEN** a user runs `dhplan schema template`
- **THEN** the system SHALL print the JSON Schema document returned by
  `getTemplateSchema()` to stdout

#### Scenario: Requesting an invalid schema type via `schema`

- **WHEN** a user runs `dhplan schema <anything other than plan or template>`
- **THEN** the system SHALL print an error identifying the valid schema
  types (`plan`, `template`) and exit non-zero without printing a JSON
  Schema document
