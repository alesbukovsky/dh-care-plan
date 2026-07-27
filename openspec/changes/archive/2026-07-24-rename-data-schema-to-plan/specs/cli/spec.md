## MODIFIED Requirements

### Requirement: `schema` command prints JSON Schema

The `dhplan schema <type>` command SHALL accept exactly one positional argument, either `plan` or `template`, and print
the corresponding schema's JSON Schema document to stdout.

#### Scenario: Requesting the plan schema

- **WHEN** a user runs `dhplan schema plan`
- **THEN** the system SHALL print the `plan-schema` capability's JSON Schema document to stdout

#### Scenario: Requesting the template schema

- **WHEN** a user runs `dhplan schema template`
- **THEN** the system SHALL print the `template-schema` capability's JSON Schema document to stdout

#### Scenario: Requesting an invalid schema type via `schema`

- **WHEN** a user runs `dhplan schema <anything other than plan or template>`
- **THEN** the system SHALL print an error identifying the valid schema types (`plan`, `template`) and exit non-zero
  without printing a JSON Schema document

### Requirement: `validate` command validates a file against a schema

The `dhplan validate <type> <file>` command SHALL accept exactly two positional arguments: `type`, either `plan` or
`template`, and `file`, a path to the file to validate. It SHALL validate `file` against the schema named by `type` and
report the result.

#### Scenario: Validating a valid plan file

- **WHEN** a user runs `dhplan validate plan <file>` and `<file>` contains JSON that satisfies `Plan`
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid plan file

- **WHEN** a user runs `dhplan validate plan <file>` and `<file>` contains JSON that violates `Plan`, or content that is
  not valid JSON
- **THEN** the system SHALL print every discovered validation issue to stderr and exit non-zero, without printing a
  success message

#### Scenario: Validating a valid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>` is a `.docx` document whose docxtemplater tags are
  all defined by `Template` at the scope where they are used
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>` references at least one docxtemplater tag not
  defined by `Template`, or cannot be read as a `.docx` document
- **THEN** the system SHALL print every discovered validation issue to stderr and exit non-zero, without printing a
  success message

#### Scenario: Requesting an invalid schema type via `validate`

- **WHEN** a user runs `dhplan validate <anything other than plan or template> <file>`
- **THEN** the system SHALL print an error identifying the valid schema types (`plan`, `template`) and exit non-zero
  without attempting to read or validate `<file>`
