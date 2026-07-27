## MODIFIED Requirements

### Requirement: Commander-based CLI entry point

The `dhplan` CLI (`packages/core/cli/dhplan.ts`) SHALL be built on Commander.js. `schema`, `validate`, and `render`
SHALL be the registered subcommands in this change.

#### Scenario: Running the CLI with no arguments

- **WHEN** `dhplan` is invoked with no subcommand
- **THEN** the system SHALL print usage/help listing the available subcommands (`schema`, `validate`, `render`) and exit
  non-zero

## ADDED Requirements

### Requirement: `render` command renders a plan and template into an output file

The `dhplan render <plan> <template> <output>` command SHALL accept exactly three positional arguments: `plan`, a path
to a plan JSON file; `template`, a path to a `.docx` template file; and `output`, a path to write the rendered `.docx`
to. It SHALL read `plan` and `template` from disk, pass their contents to `render()`, and either write the returned
document bytes to `output` on success or report every returned issue on failure — `render()` itself performs no file
I/O, so all file reading and writing is the CLI command's responsibility.

#### Scenario: Rendering with a valid plan and template

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where `plan` satisfies `Plan` and `template`'s tags
  are all satisfied by the generated template data
- **THEN** the system SHALL write the rendered document to `output`, print a success message to stdout, and exit `0`

#### Scenario: Rendering with an invalid plan

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where `plan` fails `Plan` validation, or is not valid
  JSON
- **THEN** the system SHALL print every discovered issue to stderr and exit non-zero, without reading `template` or
  writing `output`

#### Scenario: Rendering with an invalid template

- **WHEN** a user runs `dhplan render <plan> <template> <output>` where `plan` is valid but `template` fails `Template`
  validation, or cannot be read as a `.docx` document
- **THEN** the system SHALL print every discovered issue to stderr and exit non-zero, without writing `output`

#### Scenario: One of the input files cannot be read

- **WHEN** a user runs `dhplan render <plan> <template> <output>` and either `plan` or `template` cannot be read from
  disk
- **THEN** the system SHALL print an error describing the read failure to stderr and exit non-zero, without writing
  `output`
