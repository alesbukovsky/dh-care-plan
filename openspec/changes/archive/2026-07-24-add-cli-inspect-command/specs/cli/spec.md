## MODIFIED Requirements

### Requirement: Commander-based CLI entry point

The `dhplan` CLI (`packages/core/cli/dhplan.ts`) SHALL be built on Commander.js. `schema`, `validate`, `render`, and
`inspect` SHALL be the registered subcommands in this change.

#### Scenario: Running the CLI with no arguments

- **WHEN** `dhplan` is invoked with no subcommand
- **THEN** the system SHALL print usage/help listing the available subcommands (`schema`, `validate`, `render`,
  `inspect`) and exit non-zero

## ADDED Requirements

### Requirement: `inspect` command prints the generated template data for a plan

The `dhplan inspect <plan>` command SHALL accept exactly one positional argument, `plan`, a path to a plan JSON file. It
SHALL read `plan` from disk, validate it against `Plan` (using the same validation `validate plan` performs), and, if
valid, SHALL call `buildTemplateData` with the parsed plan and print the resulting `Template` data as formatted JSON to
stdout.

#### Scenario: Inspecting a valid plan

- **WHEN** a user runs `dhplan inspect <plan>` and `<plan>` contains JSON that satisfies `Plan`
- **THEN** the system SHALL print the `Template` JSON produced by `buildTemplateData` for that plan to stdout and exit
  `0`

#### Scenario: Inspecting an invalid plan

- **WHEN** a user runs `dhplan inspect <plan>` and `<plan>` contains JSON that violates `Plan`, or content that is not
  valid JSON
- **THEN** the system SHALL print every discovered validation issue to stderr and exit non-zero, without calling
  `buildTemplateData`

#### Scenario: Plan file cannot be read

- **WHEN** a user runs `dhplan inspect <plan>` and `<plan>` cannot be read from disk
- **THEN** the system SHALL print an error describing the read failure to stderr and exit non-zero
