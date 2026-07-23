## MODIFIED Requirements

### Requirement: Commander-based CLI entry point

The `dhplan` CLI (`packages/core/cli/dhplan.ts`) SHALL be built on
Commander.js. `schema` and `validate` SHALL be the only registered
subcommands in this change.

#### Scenario: Running the CLI with no arguments

- **WHEN** `dhplan` is invoked with no subcommand
- **THEN** the system SHALL print usage/help listing the available
  subcommands (`schema`, `validate`) and exit non-zero

## ADDED Requirements

### Requirement: `validate` command validates a file against a schema

The `dhplan validate <schema_type> <file>` command SHALL accept exactly two
positional arguments: `schema_type`, either `data` or `template`, and
`file`, a path to the file to validate. It SHALL validate `file` against
the schema named by `schema_type` and report the result.

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

#### Scenario: Requesting an invalid schema type

- **WHEN** a user runs `dhplan validate <anything other than data or
  template> <file>`
- **THEN** the system SHALL print an error identifying the valid schema
  types (`data`, `template`) and exit non-zero without attempting to read
  or validate `<file>`
