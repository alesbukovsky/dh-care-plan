## ADDED Requirements

### Requirement: `Mapping` holds user-overridable text choices with built-in defaults

The system SHALL provide a `Mapping` config
(`packages/core/src/schema/mapping.ts`) representing every
user-overridable text mapping used when converting a `Plan` into
`Template` data. `Mapping` SHALL include an `outcomeStatus` section
mapping each `Need.outcome.status` value (`"met"`, `"partial"`,
`"unmet"`) to a display string, with every key required. The system
SHALL provide a `DEFAULT_MAPPING` constant with `outcomeStatus` set
to `"Met"`, `"Partially met"`, and `"Not met"` respectively.

#### Scenario: Default mapping values

- **WHEN** no mapping is supplied
- **THEN** `resolveMapping()` (called with no arguments, or `undefined`)
  SHALL return a `Mapping` equal to `DEFAULT_MAPPING`

### Requirement: A supplied mapping replaces the defaults entirely

The system SHALL provide a `resolveMapping(mapping?: Mapping): Mapping`
function that returns the given `Mapping` unchanged when one is provided,
or `DEFAULT_MAPPING` when omitted. There SHALL be no partial-override or
per-key merge behavior: a user-supplied mapping must fully specify every
key in every section.

#### Scenario: A given mapping is returned unchanged

- **WHEN** `resolveMapping(mapping)` is called with a complete `Mapping`
- **THEN** the system SHALL return that `Mapping` unchanged, without
  merging it against `DEFAULT_MAPPING`

### Requirement: Mapping files are validated against `Mapping`

The system SHALL provide a `validateMapping` function
(`packages/core/src/validator.ts`) that parses a buffer as JSON and
validates it against `Mapping` (every section and key required),
returning the same `ValidationResult` shape (`{ valid: true }` or
`{ valid: false, issues }`) that `validateData`/`validateTemplate`
already return.

#### Scenario: Valid mapping file

- **WHEN** `validateMapping` is called with a buffer containing JSON that
  satisfies `Mapping` (every key present)
- **THEN** the system SHALL return `{ valid: true }`

#### Scenario: Invalid or incomplete mapping file

- **WHEN** `validateMapping` is called with a buffer containing JSON that
  violates `Mapping` (e.g. a non-string label value, or a section/key
  missing), or content that is not valid JSON
- **THEN** the system SHALL return `{ valid: false, issues }` describing
  every violation

### Requirement: `getMappingSchema()` and `getMappingSample()` describe the mapping file format

The system SHALL provide `getMappingSchema(): object`, returning the JSON
Schema document for `Mapping`, and `getMappingSample(): Mapping`,
returning `DEFAULT_MAPPING` as a complete, ready-to-use sample mapping
document.

#### Scenario: Requesting the mapping JSON Schema

- **WHEN** `getMappingSchema()` is called
- **THEN** the system SHALL return the JSON Schema document for `Mapping`

#### Scenario: Requesting a mapping sample

- **WHEN** `getMappingSample()` is called
- **THEN** the system SHALL return `DEFAULT_MAPPING`, which SHALL itself
  satisfy `Mapping`
