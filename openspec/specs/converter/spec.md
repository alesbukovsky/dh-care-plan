# converter Specification

## Purpose

TBD - defines `convertData`, the pure `Plan`→`Template` mapping function in `packages/core/src/converter.ts`.

## Requirements

### Requirement: `convertData` converts a Plan into flattened Template data

The system SHALL provide a function (`convertData`, `packages/core/src/converter.ts`) that converts a natural, nested
`Plan` into the flattened shape `Template` expects, mapping `Plan`'s top-level fields and `plan.needs` into `Template`'s
`patient`, `appointments`, `assessments`, and `statements`. `convertData` SHALL accept an optional resolved `Config` as
its second parameter, defaulting to `DEFAULT_CONFIG` when omitted:

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
  `task` mapped 1:1 and `doneBy` derived from the source `Goal`'s `doneBy.date` and `doneBy.relative` as follows:
  - if neither is present (or the `Goal` has no `doneBy` at all), the resulting `doneBy` SHALL be `undefined`
  - if exactly one of `date`/`relative` is present, the resulting `doneBy` SHALL be that value alone — `date` formatted
    using the given `Config`'s `format.date` pattern, or `relative` used verbatim
  - if both are present, the resulting `doneBy` SHALL be the given `Config`'s `format.goal.doneBy` pattern with `{date}`
    substituted by `date` formatted per `format.date` and `{relative}` substituted by `relative` verbatim

  plus a generated `label` of the form `<n><letter>` where `n` is the 1-based position of the statement within the
  `statements` array and `letter` is the 0-based position of the goal within that statement's `goals`, rendered as `a`,
  `b`, `c`, ... (e.g. the 3rd goal of the 2nd statement is labelled `2c`).

- Each statement's `interventions` SHALL be copied from the source `Need`'s `interventions`, defaulting to an empty
  array when the `Need` has no `interventions`.
- Each statement's `outcome` SHALL be derived from the source `Need`'s `outcome`: `outcome.note` SHALL be copied 1:1,
  and `outcome.status` SHALL be mapped to `outcome.label` via the given `Config`'s `mapping.outcome` section (i.e.
  `config.mapping.outcome[need.outcome.status]`), not a hard-coded lookup.
- If an unmet `Need` is missing `relatedTo` or `evidencedBy`, `convertData` SHALL default the corresponding `Statement`
  field to an empty string rather than throwing, so an incomplete `Plan` can still be converted.

#### Scenario: Converting a valid plan to template data

- **WHEN** `convertData` is called with a validated `Plan` with a mix of met and unmet needs
- **THEN** the system SHALL return a `Template` whose `patient` and `appointments` carry the plan's values with every
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

#### Scenario: Goal doneBy with neither date nor relative

- **WHEN** `convertData` maps a `Goal` whose `doneBy` is `undefined`, or whose `doneBy` is present but has neither
  `date` nor `relative`
- **THEN** the resulting `Statement` goal's `doneBy` SHALL be `undefined`, without attempting to format anything

#### Scenario: Goal doneBy with only a specific date

- **WHEN** `convertData` maps a `Goal` whose `doneBy` has `date` set and `relative` absent
- **THEN** the resulting `Statement` goal's `doneBy` SHALL be that date formatted per the given `Config`'s `format.date`
  pattern

#### Scenario: Goal doneBy with only a relative term

- **WHEN** `convertData` maps a `Goal` whose `doneBy` has `relative` set and `date` absent
- **THEN** the resulting `Statement` goal's `doneBy` SHALL equal that `relative` value verbatim, with no date formatting
  applied

#### Scenario: Goal doneBy with both a date and a relative term

- **WHEN** `convertData` maps a `Goal` whose `doneBy` has both `date` (e.g. `"2026-08-01"`) and `relative` (e.g.
  `"by next visit"`) set, using a `Config` whose `format.date` is `"MM/DD/YYYY"` and whose `format.goal.doneBy` is
  `"{date}, {relative}"`
- **THEN** the resulting `Statement` goal's `doneBy` SHALL equal `"08/01/2026, by next visit"`

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
</content>
