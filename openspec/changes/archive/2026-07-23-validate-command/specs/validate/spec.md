## ADDED Requirements

### Requirement: Uniform validator interface

`validateData` and `validateTemplate` SHALL share one call signature: both
take the file's raw bytes (an `ArrayBuffer`) as input, and both return the
same `ValidationResult` shape (`{ valid: true }` or `{ valid: false,
issues: { path, message }[] }`). Content-level failures specific to one
schema type (malformed JSON for data; an unreadable `.docx` for template)
SHALL be reported as an issue within that same result shape, not thrown as
an exception, so callers can treat both validators identically regardless
of which schema type they're validating against.

#### Scenario: Caller dispatches on schema type without changing call shape

- **WHEN** a caller has a file's raw bytes and knows only whether to
  validate them as `data` or `template`
- **THEN** the system SHALL let the caller invoke `validateData` or
  `validateTemplate` with that same `ArrayBuffer` and handle the result the
  same way, without needing to pre-parse or branch on input type first

### Requirement: Data file validation against DataSchema

The system SHALL provide a function (`validateData`,
`packages/core/src/validator.ts`) that parses a given input as JSON and
validates it against `DataSchema` using zod's `safeParse`, returning every
validation issue found (not only the first) rather than throwing on the
first failure.

#### Scenario: Valid data file

- **WHEN** `validateData` is given JSON content that satisfies `DataSchema`
- **THEN** the system SHALL report the input as valid with no issues

#### Scenario: Invalid data file

- **WHEN** `validateData` is given JSON content that violates `DataSchema`
  (missing required fields, wrong types, or extra fields where the schema
  forbids them)
- **THEN** the system SHALL report the input as invalid and return every
  violated path and message from `DataSchema`'s validation, not only the
  first

#### Scenario: Content is not valid JSON

- **WHEN** `validateData` is given content that fails to parse as JSON
- **THEN** the system SHALL report the input as invalid with an issue
  describing the JSON parse failure, without attempting schema validation

### Requirement: Template tag validation against TemplateSchema

The system SHALL provide a function (`validateTemplate`,
`packages/core/src/validator.ts`) that reads a `.docx` file,
extracts every docxtemplater tag it references without rendering the
document, and checks that each tag is defined by `TemplateSchema` at the
scope (top level, or nested inside a loop/section tag) where it is used.

#### Scenario: Template only uses tags TemplateSchema defines

- **WHEN** `validateTemplate` is given a `.docx` file whose docxtemplater
  tags (at every scope, including inside loop/section tags) are all keys
  `TemplateSchema` defines at that scope
- **THEN** the system SHALL report the template as valid with no issues

#### Scenario: Template references an undefined tag

- **WHEN** `validateTemplate` is given a `.docx` file that references at
  least one docxtemplater tag not defined by `TemplateSchema` at the scope
  where it is used
- **THEN** the system SHALL report the template as invalid and return every
  undefined tag found (name and scope), not only the first

#### Scenario: Template omits tags TemplateSchema defines

- **WHEN** `validateTemplate` is given a `.docx` file that does not
  reference every tag `TemplateSchema` defines
- **THEN** the system SHALL still report the template as valid, since a
  template is not required to use every available tag

#### Scenario: File is not a readable .docx

- **WHEN** `validateTemplate` is given a file that cannot be read as a
  `.docx` (not a valid zip, or not a Word Open XML document)
- **THEN** the system SHALL report the input as invalid with an issue
  describing the read failure, without attempting tag validation
