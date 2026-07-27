# renderer Specification

## Purpose

TBD - defines `render()`, the pure (no file I/O) plan+template rendering function in `packages/core/src/renderer.ts`.

## Requirements

### Requirement: `render()` validates plan and template before rendering

The system SHALL provide a function (`render`, `packages/core/src/renderer.ts`) that accepts a plan JSON buffer and a
template `.docx` buffer (both `ArrayBuffer`, no file paths) and, before attempting to render anything, SHALL validate
the plan against `Plan` (using the same validation `validateData` performs) and, if the plan is valid, SHALL validate
the template against `Template` (using the same validation `validateTemplate` performs). `render()` SHALL do no file
I/O.

#### Scenario: Plan fails validation

- **WHEN** `render()` is called with a plan buffer that fails `Plan` validation
- **THEN** the system SHALL return a failure result carrying every plan validation issue, without inspecting the
  template buffer at all

#### Scenario: Plan is valid but template fails validation

- **WHEN** `render()` is called with a plan buffer that passes `Plan` validation and a template buffer that fails
  `Template` validation
- **THEN** the system SHALL return a failure result carrying every template validation issue, without attempting to
  render

### Requirement: `render()` renders the template with the generated template data

Once both the plan and template are valid, `render()` SHALL obtain template data by calling `convertData` (the
`converter` capability, `packages/core/src/converter.ts`), then construct a docxtemplater instance from the template
buffer (via the existing `createTemplater` helper), render it using that template data, and return the resulting
document bytes. `render()` SHALL accept an optional third `ArrayBuffer` parameter carrying a config file's raw contents;
if provided, `render()` SHALL validate it against `Config` (every key required) before passing it to `convertData`. If
omitted, `render()` SHALL use `DEFAULT_CONFIG`.

#### Scenario: Successful render

- **WHEN** `render()` is called with a valid plan buffer and a valid template buffer whose tags are all satisfied by the
  generated template data
- **THEN** the system SHALL return a success result carrying the rendered document as bytes

#### Scenario: Docxtemplater render failure

- **WHEN** the docxtemplater render step throws (e.g. an unresolved expression or a malformed template body that
  validation didn't catch)
- **THEN** the system SHALL return a failure result carrying an issue describing the render failure, rather than
  throwing out of `render()`

#### Scenario: Rendering with a valid config file

- **WHEN** `render()` is called with a plan buffer and template buffer that are both valid, and a third buffer
  containing JSON that satisfies `Config`
- **THEN** the system SHALL use that config when building template data, without reporting any config-related issue

#### Scenario: Rendering with an invalid config file

- **WHEN** `render()` is called with a third buffer containing JSON that violates `Config` (including an incomplete
  config missing a key), or content that is not valid JSON
- **THEN** the system SHALL return a failure result carrying every discovered config validation issue, without
  attempting to render

#### Scenario: Rendering without a config file

- **WHEN** `render()` is called with only the plan and template buffers (no third argument)
- **THEN** the system SHALL use `DEFAULT_CONFIG` when building template data
