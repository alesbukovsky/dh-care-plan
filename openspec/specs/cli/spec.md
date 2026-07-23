# cli Specification

## Purpose

TBD - defines the `dhplan` command-line interface, including its entry
point and subcommands.

## Requirements

### Requirement: Commander-based CLI entry point

The `dhplan` CLI (`packages/core/cli/dhplan.ts`) SHALL be built on
Commander.js. `schema` SHALL be the only registered subcommand in this
change.

#### Scenario: Running the CLI with no arguments

- **WHEN** `dhplan` is invoked with no subcommand
- **THEN** the system SHALL print usage/help listing the available
  subcommands (`schema`) and exit non-zero

### Requirement: `schema` command prints JSON Schema

The `dhplan schema <target>` command SHALL accept exactly one positional
argument, either `data` or `template`, and print the corresponding schema's
JSON Schema document to stdout.

#### Scenario: Requesting the data schema

- **WHEN** a user runs `dhplan schema data`
- **THEN** the system SHALL print the `data-schema` capability's JSON
  Schema document to stdout

#### Scenario: Requesting the template schema

- **WHEN** a user runs `dhplan schema template`
- **THEN** the system SHALL print the `template-schema` capability's JSON
  Schema document to stdout

#### Scenario: Requesting an invalid schema target

- **WHEN** a user runs `dhplan schema <anything other than data or template>`
- **THEN** the system SHALL print an error identifying the valid targets
  (`data`, `template`) and exit non-zero without printing a JSON Schema
  document
