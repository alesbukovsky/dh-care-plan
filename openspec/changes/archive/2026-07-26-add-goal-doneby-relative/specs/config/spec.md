## MODIFIED Requirements

### Requirement: `Config` holds user-overridable formatting and text choices with built-in defaults

The system SHALL provide a `Config` config
(`packages/core/src/schema/config.ts`) representing every
user-overridable formatting rule and text mapping used when converting a
`Plan` into `Template` data, with every key in every section required.
`Config` SHALL have exactly two top-level sections:

- `format`: formatting rules. Holds two keys:
  - `date`: a date format pattern string (using `YYYY`, `MM`, `DD`
    tokens, e.g. `"MM/DD/YYYY"`) applied to every date value
    (`patient.dob`, each `appointments` entry, and a goal's `doneBy.date`
    when used) when converting a `Plan` into `Template` data.
  - `goal`: goal-specific formatting rules, holding one key: `doneBy`, a
    template string with `{date}` and `{relative}` placeholders (e.g.
    `"{date}, {relative}"`), used to combine a goal's `doneBy.date` and
    `doneBy.relative` into one display string when both are present.
- `mapping`: text label overrides, unchanged:
  - a `need` section mapping each `Need.type` value (`"image"`,
    `"peace"`, `"integrity"`, `"health"`, `"comfort"`, `"dentition"`,
    `"understanding"`, `"responsibility"`, `"maintenance"`) to a
    canonical display label for that need category
  - an `outcome` section mapping each `Need.outcome.status` value
    (`"met"`, `"partial"`, `"unmet"`) to a display string

The system SHALL provide a `DEFAULT_CONFIG` constant with `format.date`
set to a default pattern (`"MM/DD/YYYY"`), `format.goal.doneBy` set to a
default pattern (`"{date}, {relative}"`), and `mapping` containing a
canonical label for each `need` key (e.g. `"integrity"` -> `"Skin and
mucous membrane integrity of head and neck"`) and `outcome` set to
`"Met"`, `"Partially met"`, and `"Not met"` respectively.

#### Scenario: Default config values

- **WHEN** no config is supplied
- **THEN** `resolveConfig()` (called with no arguments, or `undefined`)
  SHALL return a `Config` equal to `DEFAULT_CONFIG`, including its
  `format.date` pattern, `format.goal.doneBy` pattern, and
  `mapping.need`/`mapping.outcome` sections

### Requirement: Config files are validated against `Config`

The system SHALL provide a `validateConfig` function
(`packages/core/src/validator.ts`) that parses a buffer as JSON and
validates it against `Config` (every section and key required, including
`format.date` and `format.goal.doneBy`), returning the same
`ValidationResult` shape (`{ valid: true }` or `{ valid: false, issues }`)
that `validateData`/`validateTemplate` already return.

#### Scenario: Valid config file

- **WHEN** `validateConfig` is called with a buffer containing JSON that
  satisfies `Config` (every key present, including `format.date` and
  `format.goal.doneBy`)
- **THEN** the system SHALL return `{ valid: true }`

#### Scenario: Invalid or incomplete config file

- **WHEN** `validateConfig` is called with a buffer containing JSON that
  violates `Config` (e.g. a non-string label value, or a
  `format`/`mapping` key missing), or content that is not valid JSON
- **THEN** the system SHALL return `{ valid: false, issues }` describing
  every violation

#### Scenario: Config file missing the format section

- **WHEN** `validateConfig` is called with a buffer containing JSON that
  has a complete `mapping` section but omits `format` (or omits
  `format.date` or `format.goal.doneBy`)
- **THEN** the system SHALL return `{ valid: false, issues }` describing
  the missing key(s)

### Requirement: `getConfigSchema()` and `getConfigSample()` describe the config file format

The system SHALL provide `getConfigSchema(): object`, returning the JSON
Schema document for `Config` (including the `format` and `mapping`
sections), and `getConfigSample(): Config`, returning `DEFAULT_CONFIG`
(including its `format.date` and `format.goal.doneBy` patterns) as a
complete, ready-to-use sample config document.

#### Scenario: Requesting the config JSON Schema

- **WHEN** `getConfigSchema()` is called
- **THEN** the system SHALL return a JSON Schema document for `Config`
  whose properties include both the `format` section (with its `date`
  key and nested `goal.doneBy` key) and the `mapping` section (with its
  `need`/`outcome` keys)

#### Scenario: Requesting a config sample

- **WHEN** `getConfigSample()` is called
- **THEN** the system SHALL return `DEFAULT_CONFIG`, which SHALL itself
  satisfy `Config`, including its `format.date` and `format.goal.doneBy`
  patterns
