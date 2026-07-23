## MODIFIED Requirements

### Requirement: `schema` command prints JSON Schema

The `dhplan schema <type>` command SHALL accept exactly one positional
argument, either `data` or `template`, and print the corresponding
schema's JSON Schema document to stdout.

#### Scenario: Requesting the data schema

- **WHEN** a user runs `dhplan schema data`
- **THEN** the system SHALL print the `data-schema` capability's JSON
  Schema document to stdout

#### Scenario: Requesting the template schema

- **WHEN** a user runs `dhplan schema template`
- **THEN** the system SHALL print the `template-schema` capability's JSON
  Schema document to stdout

#### Scenario: Requesting an invalid schema type via `schema`

- **WHEN** a user runs `dhplan schema <anything other than data or template>`
- **THEN** the system SHALL print an error identifying the valid schema
  types (`data`, `template`) and exit non-zero without printing a JSON
  Schema document

### Requirement: `validate` command validates a file against a schema

The `dhplan validate <type> <file>` command SHALL accept exactly two
positional arguments: `type`, either `data` or `template`, and `file`, a
path to the file to validate. It SHALL validate `file` against the schema
named by `type` and report the result.

#### Scenario: Validating a valid data file

- **WHEN** a user runs `dhplan validate data <file>` and `<file>` contains
  JSON that satisfies `DataSchema`
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid data file

- **WHEN** a user runs `dhplan validate data <file>` and `<file>` contains
  JSON that violates `DataSchema`, or content that is not valid JSON
- **THEN** the system SHALL print every discovered validation issue to
  stderr and exit non-zero, without printing a success message

#### Scenario: Validating a valid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>` is a
  `.docx` document whose docxtemplater tags are all defined by
  `TemplateSchema` at the scope where they are used
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>`
  references at least one docxtemplater tag not defined by
  `TemplateSchema`, or cannot be read as a `.docx` document
- **THEN** the system SHALL print every discovered validation issue to
  stderr and exit non-zero, without printing a success message

#### Scenario: Requesting an invalid schema type via `validate`

- **WHEN** a user runs `dhplan validate <anything other than data or
  template> <file>`
- **THEN** the system SHALL print an error identifying the valid schema
  types (`data`, `template`) and exit non-zero without attempting to read
  or validate `<file>`
