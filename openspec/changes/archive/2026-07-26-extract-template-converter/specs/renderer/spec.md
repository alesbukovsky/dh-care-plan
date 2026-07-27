## REMOVED Requirements

### Requirement: `render()` converts Plan to template data by mapping needs to assessments and statements

**Reason**: `convertData` (and its mapping/formatting behavior) moved out of `renderer.ts` into its own `converter`
capability (`packages/core/src/converter.ts`), since it is pure `Plan`→`Template` mapping logic independent of
`render()`'s file-I/O-adjacent orchestration.

**Migration**: See the `converter` capability's "`convertData` converts a Plan into flattened Template data"
requirement, which carries this requirement's behavior and scenarios forward unchanged.

Once both the plan and template are valid, `render()` SHALL convert the parsed `Plan` into `Template`-shaped data by
calling a function (`convertData`, `packages/core/src/renderer.ts`) that maps `Plan`'s top-level fields and `plan.needs`
into `Template`'s `patient`, `appointments`, `assessments`, and `statements`. `convertData` SHALL accept an optional
resolved `Config` as its second parameter, defaulting to `DEFAULT_CONFIG` when omitted:

- `patient` SHALL be derived from `plan.patient`, with `initials` and `chartId` copied unchanged and `dob` formatted
  using the given `Config`'s `format.date` pattern.
- `appointments` SHALL contain one formatted date string per entry in `plan.appointments`, in the same order, each
  formatted using the given `Config`'s `format.date` pattern.
- `assessments` SHALL contain one entry per `Need` in `plan.needs`, in the same order, with `need.name` mapped to
  `assessment.need` and `need.isMet` mapped to `assessment.isMet`.
- `statements` SHALL contain one entry per `Need` in `plan.needs` whose `isMet` is `false`, in the same relative order,
  with `statement.need` derived from the given `Config`'s `mapping.need` section via `config.mapping.need[need.type]`
  (the canonical display label for that need category, not the `Need`'s free-text `name`), `need.relatedTo` mapped to
  `statement.relatedTo`, and `need.evidencedBy` mapped to `statement.evidencedBy`. `Need`s where `isMet` is `true` SHALL
  be excluded from `statements`.
- Each statement's `goals` SHALL contain one entry per `Goal` in the source `Need`'s `goals`, in the same order, with
  `task` mapped 1:1 and `doneBy` formatted using the given `Config`'s `format.date` pattern when present (left
  `undefined` when the source `Goal` has no `doneBy`), plus a generated `label` of the form `<n><letter>` where `n` is
  the 1-based position of the statement within the `statements` array and `letter` is the 0-based position of the goal
  within that statement's `goals`, rendered as `a`, `b`, `c`, ... (e.g. the 3rd goal of the 2nd statement is labelled
  `2c`).
- Each statement's `interventions` SHALL be copied from the source `Need`'s `interventions`, defaulting to an empty
  array when the `Need` has no `interventions`.
- Each statement's `outcome` SHALL be derived from the source `Need`'s `outcome`: `outcome.note` SHALL be copied 1:1,
  and `outcome.status` SHALL be mapped to `outcome.label` via the given `Config`'s `mapping.outcome` section (i.e.
  `config.mapping.outcome[need.outcome.status]`), not a hard-coded lookup.
- If an unmet `Need` is missing `relatedTo` or `evidencedBy`, `render()` SHALL default the corresponding `Statement`
  field to an empty string rather than throwing, so an incomplete `Plan` can still be rendered.

#### Scenario: Converting a valid plan to template data

- **WHEN** `render()` has a validated `Plan` with a mix of met and unmet needs and calls `convertData` with it
- **THEN** the system SHALL receive a `Template` whose `patient` and `appointments` carry the plan's values with every
  date formatted per `config.format.date`, whose `assessments` array lists every need (met and unmet) in original order
  with `need` and `isMet` copied from each `Need`, and whose `statements` array lists only the unmet needs in original
  relative order with `need` derived from the config's `mapping.need` section (per `need.type`), and `relatedTo` and
  `evidencedBy` copied from each `Need`

#### Scenario: Formatting patient date of birth

- **WHEN** `convertData` maps a `Plan` whose `patient.dob` is `"1990-05-03"` using a `Config` whose `format.date` is
  `"MM/DD/YYYY"`
- **THEN** the resulting `Template`'s `patient.dob` SHALL equal `"05/03/1990"`

#### Scenario: Formatting appointment dates

- **WHEN** `convertData` maps a `Plan`'s `appointments` list using a given `Config`'s `format.date` pattern
- **THEN** every entry in the resulting `Template`'s `appointments` SHALL be the corresponding source date formatted per
  that pattern, in the same order

#### Scenario: Formatting a goal's doneBy date

- **WHEN** `convertData` maps a `Goal` whose `doneBy` is defined
- **THEN** the resulting `Statement` goal's `doneBy` SHALL be that date formatted per the given `Config`'s `format.date`
  pattern

#### Scenario: Goal without a doneBy date

- **WHEN** `convertData` maps a `Goal` whose `doneBy` is `undefined`
- **THEN** the resulting `Statement` goal's `doneBy` SHALL remain `undefined`, without attempting to format it

#### Scenario: Generating goal labels for statements

- **WHEN** `convertData` maps an unmet `Need` with goals into a `Statement`
- **THEN** each resulting goal SHALL carry a `label` combining the statement's 1-based position in `statements` with the
  goal's position in that statement's `goals` list rendered as a letter (`a`, `b`, `c`, ...), independent of the need's
  position in `plan.needs`

#### Scenario: Unmet need missing relatedTo or evidencedBy

- **WHEN** `convertData` encounters an unmet `Need` whose `relatedTo` or `evidencedBy` is `undefined`
- **THEN** the system SHALL set the corresponding `Statement` field to an empty string instead of throwing

#### Scenario: Mapping interventions onto a statement

- **WHEN** `convertData` maps an unmet `Need` that has `interventions`
- **THEN** the resulting `Statement`'s `interventions` SHALL equal the `Need`'s `interventions`, in the same order

#### Scenario: Defaulting interventions when absent

- **WHEN** `convertData` maps an unmet `Need` that has no `interventions`
- **THEN** the resulting `Statement`'s `interventions` SHALL be an empty array

#### Scenario: Mapping outcome status to a display label using the default config

- **WHEN** `convertData` is called without an explicit `Config` argument, and maps an unmet `Need` whose
  `outcome.status` is `"met"`, `"partial"`, or `"unmet"`
- **THEN** the resulting `Statement`'s `outcome.label` SHALL be `"Met"`, `"Partially met"`, or `"Not met"` respectively
  (from `DEFAULT_CONFIG.mapping`), and `outcome.note` SHALL equal the `Need`'s `outcome.note`

#### Scenario: Mapping outcome status to a display label using a custom config

- **WHEN** `convertData` is called with an explicit `Config` whose `mapping.outcome` section differs from the defaults,
  and maps an unmet `Need`
- **THEN** the resulting `Statement`'s `outcome.label` SHALL come from the given `Config`, not `DEFAULT_CONFIG`

#### Scenario: Deriving a statement's need label from the config, not the plan's free-text name

- **WHEN** `convertData` maps an unmet `Need` whose `name` differs from the config's canonical label for that `Need`'s
  `type`
- **THEN** the resulting `Statement`'s `need` SHALL equal `config.mapping.need[need.type]`, not the `Need`'s `name`

## MODIFIED Requirements

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
