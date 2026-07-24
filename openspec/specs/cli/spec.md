# cli Specification

## Purpose

TBD - defines the `dhplan` command-line interface, including its entry
point and subcommands.

## Requirements

### Requirement: Commander-based CLI entry point

The `dhplan` CLI (`packages/core/cli/dhplan.ts`) SHALL be built on
Commander.js. `schema`, `validate`, and `render` SHALL be the registered
subcommands in this change.

#### Scenario: Running the CLI with no arguments

- **WHEN** `dhplan` is invoked with no subcommand
- **THEN** the system SHALL print usage/help listing the available
  subcommands (`schema`, `validate`, `render`) and exit non-zero

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

### Requirement: `validate` command validates a file against a schema

The `dhplan validate <type> <file>` command SHALL accept exactly two
positional arguments: `type`, either `plan` or `template`, and `file`, a
path to the file to validate. It SHALL validate `file` against the schema
named by `type` and report the result.

#### Scenario: Validating a valid plan file

- **WHEN** a user runs `dhplan validate plan <file>` and `<file>` contains
  JSON that satisfies `Plan`
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid plan file

- **WHEN** a user runs `dhplan validate plan <file>` and `<file>` contains
  JSON that violates `Plan`, or content that is not valid JSON
- **THEN** the system SHALL print every discovered validation issue to
  stderr and exit non-zero, without printing a success message

#### Scenario: Validating a valid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>` is a
  `.docx` document whose docxtemplater tags are all defined by `Template`
  at the scope where they are used
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid template file

- **WHEN** a user runs `dhplan validate template <file>` and `<file>`
  references at least one docxtemplater tag not defined by `Template`, or
  cannot be read as a `.docx` document
- **THEN** the system SHALL print every discovered validation issue to
  stderr and exit non-zero, without printing a success message

#### Scenario: Requesting an invalid schema type via `validate`

- **WHEN** a user runs `dhplan validate <anything other than plan or
  template> <file>`
- **THEN** the system SHALL print an error identifying the valid schema
  types (`plan`, `template`) and exit non-zero without attempting to read
  or validate `<file>`

### Requirement: `render` command renders a plan and template into an output file

The `dhplan render <plan> <template> <output>` command SHALL accept
exactly three positional arguments: `plan`, a path to a plan JSON file;
`template`, a path to a `.docx` template file; and `output`, a path to
write the rendered `.docx` to. It SHALL read `plan` and `template` from
disk, pass their contents to `render()`, and either write the returned
document bytes to `output` on success or report every returned issue on
failure — `render()` itself performs no file I/O, so all file reading and
writing is the CLI command's responsibility.

#### Scenario: Rendering with a valid plan and template

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where
  `plan` satisfies `Plan` and `template`'s tags are all satisfied by the
  generated template data
- **THEN** the system SHALL write the rendered document to `output`, print
  a success message to stdout, and exit `0`

#### Scenario: Rendering with an invalid plan

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where
  `plan` fails `Plan` validation, or is not valid JSON
- **THEN** the system SHALL print every discovered issue to stderr and
  exit non-zero, without reading `template` or writing `output`

#### Scenario: Rendering with an invalid template

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where
  `plan` is valid but `template` fails `Template` validation, or cannot be
  read as a `.docx` document
- **THEN** the system SHALL print every discovered issue to stderr and
  exit non-zero, without writing `output`

#### Scenario: One of the input files cannot be read

- **WHEN** a user runs `dhplan render <plan> <template> <output>` and
  either `plan` or `template` cannot be read from disk
- **THEN** the system SHALL print an error describing the read failure to
  stderr and exit non-zero, without writing `output`
