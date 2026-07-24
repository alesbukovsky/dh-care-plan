## ADDED Requirements

### Requirement: `render()` validates plan and template before rendering

The system SHALL provide a function (`render`,
`packages/core/src/renderer.ts`) that accepts a plan JSON buffer and a
template `.docx` buffer (both `ArrayBuffer`, no file paths) and, before
attempting to render anything, SHALL validate the plan against `Plan`
(using the same validation `validateData` performs) and, if the plan is
valid, SHALL validate the template against `Template` (using the same
validation `validateTemplate` performs). `render()` SHALL do no file I/O.

#### Scenario: Plan fails validation

- **WHEN** `render()` is called with a plan buffer that fails `Plan`
  validation
- **THEN** the system SHALL return a failure result carrying every plan
  validation issue, without inspecting the template buffer at all

#### Scenario: Plan is valid but template fails validation

- **WHEN** `render()` is called with a plan buffer that passes `Plan`
  validation and a template buffer that fails `Template` validation
- **THEN** the system SHALL return a failure result carrying every template
  validation issue, without attempting to render

### Requirement: `render()` converts Plan to template data via a scaffolded function

Once both the plan and template are valid, `render()` SHALL convert the
parsed `Plan` into `Template`-shaped data by calling a function
(`buildTemplateData`, `packages/core/src/renderer.ts`) that currently
returns an empty object, regardless of the input `Plan`, as a scaffold for
future plan→template computation.

#### Scenario: Converting a valid plan to template data

- **WHEN** `render()` has a validated `Plan` and calls `buildTemplateData`
  with it
- **THEN** the system SHALL receive an empty object back (today's
  scaffolded behavior) and SHALL use it as the data passed to the
  docxtemplater render step

### Requirement: `render()` renders the template with the generated template data

Once template data has been generated, `render()` SHALL construct a
docxtemplater instance from the template buffer (via the existing
`createTemplater` helper), render it using the generated template data, and
return the resulting document bytes.

#### Scenario: Successful render

- **WHEN** `render()` is called with a valid plan buffer and a valid
  template buffer whose tags are all satisfied by the (currently empty)
  generated template data
- **THEN** the system SHALL return a success result carrying the rendered
  document as bytes

#### Scenario: Docxtemplater render failure

- **WHEN** the docxtemplater render step throws (e.g. an unresolved
  expression or a malformed template body that validation didn't catch)
- **THEN** the system SHALL return a failure result carrying an issue
  describing the render failure, rather than throwing out of `render()`
