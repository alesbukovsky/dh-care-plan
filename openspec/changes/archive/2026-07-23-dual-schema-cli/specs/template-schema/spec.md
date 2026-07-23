## ADDED Requirements

### Requirement: Flat template schema placeholder

The system SHALL define a zod schema (`TemplateSchema`,
`packages/core/src/schema/template.ts`) representing the flat shape that
docxtemplater tag resolution expects. Until the data→template conversion
process is designed, this schema SHALL exist as an explicit placeholder
rather than a guessed flattening of the data schema.

#### Scenario: Template author inspects available tags

- **WHEN** a template author needs to know what tags are available to place
  in a `.docx` template
- **THEN** the system SHALL expose `TemplateSchema` as the single source of
  truth for those tags (currently empty, to be populated once the
  conversion process is designed)

### Requirement: Template schema exportable as JSON Schema

The system SHALL be able to produce a JSON Schema document for
`TemplateSchema` on demand, using the same conversion mechanism as the data
schema.

#### Scenario: Generating JSON Schema for the template schema

- **WHEN** `TemplateSchema` is passed through the schema-to-JSON-Schema
  conversion
- **THEN** the system SHALL return a valid JSON Schema document (empty
  object schema until template fields are defined in a future change)
