## REMOVED Requirements

### Requirement: `Mapping` holds user-overridable text choices with built-in defaults

**Reason**: The `mapping` capability is renamed to `config` and restructured with `format`/`mapping` top-level sections
— see the `config` capability's `Config holds user-overridable formatting and text choices with built-in defaults`
requirement.

**Migration**: Replace `Mapping` (`packages/core/src/schema/mapping.ts`) with `Config`
(`packages/core/src/schema/config.ts`). Move existing `need`/`outcome` sections unchanged under a new `mapping` key
(`config.mapping.need`, `config.mapping.outcome`), and add a required `format.date` pattern. `DEFAULT_MAPPING` becomes
`DEFAULT_CONFIG` with the same values, restructured under `format`/`mapping`.

The system SHALL provide a `Mapping` config (`packages/core/src/schema/mapping.ts`) representing every user-overridable
text mapping used when converting a `Plan` into `Template` data, with every key in every section required. `Mapping`
SHALL include:

- a `need` section mapping each `Need.type` value (`"image"`, `"peace"`, `"integrity"`, `"health"`, `"comfort"`,
  `"dentition"`, `"understanding"`, `"responsibility"`, `"maintenance"`) to a canonical display label for that need
  category
- an `outcome` section mapping each `Need.outcome.status` value (`"met"`, `"partial"`, `"unmet"`) to a display string

The system SHALL provide a `DEFAULT_MAPPING` constant with a canonical label for each `need` key (e.g. `"integrity"` ->
`"Skin and mucous membrane integrity of head and neck"`) and `outcome` set to `"Met"`, `"Partially met"`, and
`"Not met"` respectively.

#### Scenario: Default mapping values

- **WHEN** no mapping is supplied
- **THEN** `resolveMapping()` (called with no arguments, or `undefined`) SHALL return a `Mapping` equal to
  `DEFAULT_MAPPING`

### Requirement: A supplied mapping replaces the defaults entirely

**Reason**: Renamed to `config`'s `resolveConfig` — see the `config` capability.

**Migration**: Replace calls to `resolveMapping` with `resolveConfig`.

The system SHALL provide a `resolveMapping(mapping?: Mapping): Mapping` function that returns the given `Mapping`
unchanged when one is provided, or `DEFAULT_MAPPING` when omitted. There SHALL be no partial-override or per-key merge
behavior: a user-supplied mapping must fully specify every key in every section.

#### Scenario: A given mapping is returned unchanged

- **WHEN** `resolveMapping(mapping)` is called with a complete `Mapping`
- **THEN** the system SHALL return that `Mapping` unchanged, without merging it against `DEFAULT_MAPPING`

### Requirement: Mapping files are validated against `Mapping`

**Reason**: Renamed to `config`'s `validateConfig` — see the `config` capability.

**Migration**: Replace calls to `validateMapping` with `validateConfig`.

The system SHALL provide a `validateMapping` function (`packages/core/src/validator.ts`) that parses a buffer as JSON
and validates it against `Mapping` (every section and key required), returning the same `ValidationResult` shape
(`{ valid: true }` or `{ valid: false, issues }`) that `validateData`/`validateTemplate` already return.

#### Scenario: Valid mapping file

- **WHEN** `validateMapping` is called with a buffer containing JSON that satisfies `Mapping` (every key present)
- **THEN** the system SHALL return `{ valid: true }`

#### Scenario: Invalid or incomplete mapping file

- **WHEN** `validateMapping` is called with a buffer containing JSON that violates `Mapping` (e.g. a non-string label
  value, or a `need`/`outcome` key missing), or content that is not valid JSON
- **THEN** the system SHALL return `{ valid: false, issues }` describing every violation

### Requirement: `getMappingSchema()` and `getMappingSample()` describe the mapping file format

**Reason**: Renamed to `config`'s `getConfigSchema()`/`getConfigSample()` — see the `config` capability.

**Migration**: Replace calls to `getMappingSchema`/`getMappingSample` with `getConfigSchema`/`getConfigSample`.

The system SHALL provide `getMappingSchema(): object`, returning the JSON Schema document for `Mapping`, and
`getMappingSample(): Mapping`, returning `DEFAULT_MAPPING` as a complete, ready-to-use sample mapping document.

#### Scenario: Requesting the mapping JSON Schema

- **WHEN** `getMappingSchema()` is called
- **THEN** the system SHALL return the JSON Schema document for `Mapping`

#### Scenario: Requesting a mapping sample

- **WHEN** `getMappingSample()` is called
- **THEN** the system SHALL return `DEFAULT_MAPPING`, which SHALL itself satisfy `Mapping`
