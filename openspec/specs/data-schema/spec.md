# data-schema Specification

## Purpose

TBD - defines the structured, nested `DataSchema` representing care plan
data, independent of any template tag resolution format.

## Requirements

### Requirement: Structured data schema placeholder

The system SHALL define a zod schema (`DataSchema`,
`packages/core/src/schema/data.ts`) representing a care plan as nested,
natural-organization data, independent of any template tag resolution
format. Until the real nested shape is designed, this schema SHALL exist as
an explicit empty placeholder rather than carrying forward prior prototype
fields.

#### Scenario: Inspecting the data schema before the real shape is designed

- **WHEN** a data author or tool inspects `DataSchema`
- **THEN** the system SHALL expose it as the single source of truth for
  care-plan data shape (currently an empty placeholder, to be populated in
  a future change)

### Requirement: Data schema exportable as JSON Schema

The system SHALL be able to produce a JSON Schema document for `DataSchema`
on demand, so tooling and humans can inspect the required data shape
without reading the zod source.

#### Scenario: Generating JSON Schema for the data schema

- **WHEN** `DataSchema` is passed through the schema-to-JSON-Schema
  conversion
- **THEN** the system SHALL return a valid JSON Schema document (empty
  object schema until the nested fields are defined in a future change)
