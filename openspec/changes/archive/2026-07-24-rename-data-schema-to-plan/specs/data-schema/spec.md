## RENAMED Requirements

- FROM: `### Requirement: Structured data schema placeholder`
- TO: `### Requirement: Structured plan schema`

- FROM: `### Requirement: Data schema exportable as JSON Schema`
- TO: `### Requirement: Plan schema exportable as JSON Schema`

## MODIFIED Requirements

### Requirement: Structured plan schema

The system SHALL define a zod schema (`Plan`, `packages/core/src/schema/plan.ts`) representing a care plan as nested,
natural-organization data, independent of any template tag resolution format.

#### Scenario: Inspecting the plan schema

- **WHEN** a data author or tool inspects `Plan`
- **THEN** the system SHALL expose it as the single source of truth for care-plan data shape

### Requirement: Plan schema exportable as JSON Schema

The system SHALL be able to produce a JSON Schema document for `Plan` on demand, so tooling and humans can inspect the
required data shape without reading the zod source.

#### Scenario: Generating JSON Schema for the plan schema

- **WHEN** `Plan` is passed through the schema-to-JSON-Schema conversion
- **THEN** the system SHALL return a valid JSON Schema document describing `Plan`'s current shape
