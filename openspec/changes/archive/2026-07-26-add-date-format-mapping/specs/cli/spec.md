## MODIFIED Requirements

### Requirement: `schema` command prints JSON Schema

The `dhplan schema <type>` command SHALL accept exactly one positional argument, one of `plan`, `template`, or `config`,
and print the corresponding schema's JSON Schema document to stdout. The command SHALL obtain that document by calling
`getPlanSchema()` / `getTemplateSchema()` / `getConfigSchema()` rather than calling `z.toJSONSchema` on the zod schema
directly.

The command SHALL also accept an optional `--sample` flag. When `--sample` is passed, the command SHALL instead print an
example JSON document matching `<type>`'s shape, obtained by calling `getPlanSample()` / `getTemplateSample()` /
`getConfigSample()`, and SHALL NOT print the JSON Schema document.

#### Scenario: Requesting the plan schema

- **WHEN** a user runs `dhplan schema plan`
- **THEN** the system SHALL print the JSON Schema document returned by `getPlanSchema()` to stdout

#### Scenario: Requesting the template schema

- **WHEN** a user runs `dhplan schema template`
- **THEN** the system SHALL print the JSON Schema document returned by `getTemplateSchema()` to stdout

#### Scenario: Requesting the config schema

- **WHEN** a user runs `dhplan schema config`
- **THEN** the system SHALL print the JSON Schema document returned by `getConfigSchema()` to stdout

#### Scenario: Requesting an invalid schema type via `schema`

- **WHEN** a user runs `dhplan schema <anything other than plan, template, or config>`
- **THEN** the system SHALL print an error identifying the valid schema types (`plan`, `template`, `config`) and exit
  non-zero without printing a JSON Schema document

#### Scenario: Requesting a plan sample

- **WHEN** a user runs `dhplan schema plan --sample`
- **THEN** the system SHALL print the example JSON document returned by `getPlanSample()` to stdout, and SHALL NOT print
  a JSON Schema document

#### Scenario: Requesting a template sample

- **WHEN** a user runs `dhplan schema template --sample`
- **THEN** the system SHALL print the example JSON document returned by `getTemplateSample()` to stdout, and SHALL NOT
  print a JSON Schema document

#### Scenario: Requesting a config sample

- **WHEN** a user runs `dhplan schema config --sample`
- **THEN** the system SHALL print the example JSON document returned by `getConfigSample()` to stdout, and SHALL NOT
  print a JSON Schema document

### Requirement: `validate` command validates a file against a schema

The `dhplan validate <type> <file>` command SHALL accept exactly two positional arguments: `type`, one of `plan`,
`template`, or `config`, and `file`, a path to the file to validate. It SHALL validate `file` against the schema named
by `type` (using `validateData` for `plan`, `validateTemplate` for `template`, or `validateConfig` for `config`) and
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

#### Scenario: Validating a valid config file

- **WHEN** a user runs `dhplan validate config <file>` and `<file>` contains JSON that satisfies `Config` (every key
  present, including `format.date`)
- **THEN** the system SHALL print a success message to stdout and exit `0`

#### Scenario: Validating an invalid config file

- **WHEN** a user runs `dhplan validate config <file>` and `<file>` contains JSON that violates `Config` (including an
  incomplete config missing a key), or content that is not valid JSON
- **THEN** the system SHALL print every discovered validation issue to stderr and exit non-zero, without printing a
  success message

#### Scenario: Requesting an invalid schema type via `validate`

- **WHEN** a user runs `dhplan validate <anything other than plan, template, or config> <file>`
- **THEN** the system SHALL print an error identifying the valid schema types (`plan`, `template`, `config`) and exit
  non-zero without attempting to read or validate `<file>`

### Requirement: `render` command renders a plan and template into an output file

The `dhplan render <plan> <template> <output>` command SHALL accept exactly three positional arguments: `plan`, a path
to a plan JSON file; `template`, a path to a `.docx` template file; and `output`, a path to write the rendered `.docx`
to. It SHALL read `plan` and `template` from disk, pass their contents to `render()`, and either write the returned
document bytes to `output` on success or report every returned issue on failure — `render()` itself performs no file
I/O, so all file reading and writing is the CLI command's responsibility.

The command SHALL also accept an optional `--config <file>` option. When given, the command SHALL read `<file>` from
disk and pass its contents as `render()`'s third argument; when omitted, `render()` is called with no third argument
(using its built-in default config).

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

#### Scenario: Rendering with a `--config` file

- **WHEN** a user runs `dhplan render <plan> <template> <output> --config <config-file>` where `plan` and `template` are
  valid and `<config-file>` contains JSON satisfying `Config` (every key present)
- **THEN** the system SHALL render using that config and write the rendered document to `output`

#### Scenario: Rendering with an invalid `--config` file

- **WHEN** a user runs `dhplan render <plan> <template> <output> --config <config-file>` where `<config-file>` fails
  `Config` validation (including an incomplete config missing a key), or cannot be read as JSON
- **THEN** the system SHALL print every discovered issue to stderr and exit non-zero, without writing `output`

### Requirement: `inspect` command prints the generated template data for a plan

The `dhplan inspect <plan>` command SHALL accept exactly one positional argument, `plan`, a path to a plan JSON file. It
SHALL read `plan` from disk, validate it against `Plan` (using the same validation `validate plan` performs), and, if
valid, SHALL call `buildTemplateData` with the parsed plan and print the resulting `Template` data as formatted JSON to
stdout.

The command SHALL also accept an optional `--config <file>` option. When given, the command SHALL read and validate
`<file>` against `Config` (every key required) before passing it to `buildTemplateData`; when omitted,
`buildTemplateData` is called with no config argument (using its built-in default).

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

#### Scenario: Inspecting with a `--config` file

- **WHEN** a user runs `dhplan inspect <plan> --config <config-file>` where `plan` is valid and `<config-file>` contains
  JSON satisfying `Config` (every key present)
- **THEN** the system SHALL print `Template` JSON built using that config

#### Scenario: Inspecting with an invalid `--config` file

- **WHEN** a user runs `dhplan inspect <plan> --config <config-file>` where `<config-file>` fails `Config` validation
  (including an incomplete config missing a key), or cannot be read as JSON
- **THEN** the system SHALL print every discovered issue to stderr and exit non-zero, without calling
  `buildTemplateData`
