## MODIFIED Requirements

### Requirement: `convertData` converts a Plan into flattened Template data

The system SHALL provide a function (`convertData`, `packages/core/src/converter.ts`) that converts a natural, nested
`Plan` into the flattened shape `Template` expects, mapping `Plan`'s top-level fields and `plan.needs` into `Template`'s
`patient`, `appointments`, `assessments`, and `statements`. `convertData` SHALL accept an optional resolved `Config` as
its second parameter, defaulting to `DEFAULT_CONFIG` when omitted:

- `patient` SHALL be derived from `plan.patient`, with `initials` and `chartId` copied unchanged and `dob` formatted
  using the given `Config`'s `format.date` pattern.
- `appointments` SHALL be a single string formed by formatting every entry in `plan.appointments` using the given
  `Config`'s `format.date` pattern (in the same order as `plan.appointments`), then joining those formatted entries with
  the given `Config`'s `format.appointment`.
- `assessments` SHALL contain one entry per `Need` in `plan.needs`, in the same order, with `assessment.need` derived
  from the given `Config`'s `mapping.need` section via `config.mapping.need[need.type]` (the canonical display label for
  that need category), `assessment.isUnmet` derived from the given `Config`'s generic `format.boolean` pair via
  `config.format.boolean[!need.isMet ? "true" : "false"]` (not `need.isMet` copied directly, and not a field-specific
  mapping — `format.boolean` is shared by any boolean value `convertData` renders as a string), and `need.relatedTo`/
  `need.evidencedBy` copied onto `assessment.relatedTo`/`assessment.evidencedBy` verbatim (`undefined` stays `undefined`
  — no empty-string default, unlike `Statement`'s handling of the same source fields).
- `statements` SHALL contain one entry per `Need` in `plan.needs` whose `isMet` is `false`, in the same relative order,
  with `statement.need` derived from the given `Config`'s `mapping.need` section via `config.mapping.need[need.type]`
  (the same canonical display label used for `assessment.need`), `need.relatedTo` mapped to `statement.relatedTo`, and
  `need.evidencedBy` mapped to `statement.evidencedBy`. `Need`s where `isMet` is `true` SHALL be excluded from
  `statements`.
- Each statement's `goals` SHALL contain one entry per `Goal` in the source `Need`'s `goals`, in the same order, with
  `task` mapped 1:1 and `doneBy` derived from the source `Goal`'s `doneBy.date` and `doneBy.relative` as follows:
  - if neither is present (or the `Goal` has no `doneBy` at all), the resulting `doneBy` SHALL be `undefined`
  - if exactly one of `date`/`relative` is present, the resulting `doneBy` SHALL be that value alone — `date` formatted
    using the given `Config`'s `format.date` pattern, or `relative` used verbatim
  - if both are present, the resulting `doneBy` SHALL be the given `Config`'s `format.goal.doneBy` pattern with `{date}`
    substituted by `date` formatted per `format.date` and `{relative}` substituted by `relative` verbatim

  plus a generated `label` of the form `<n><letter>` where `n` is the 1-based position of the statement within the
  `statements` array and `letter` is the 0-based position of the goal within that statement's `goals`, rendered as `a`,
  `b`, `c`, ... (e.g. the 3rd goal of the 2nd statement is labelled `2c`), plus that goal's own `interventions` (copied
  from the source `Goal`'s `interventions`, defaulting to an empty array when the `Goal` has no `interventions`) and
  `outcome` (derived from the source `Goal`'s `outcome`: `outcome.note` copied 1:1, and `outcome.status` mapped to
  `outcome.label` via the given `Config`'s `mapping.outcome` section, i.e.
  `config.mapping.outcome[goal.outcome.status]`, not a hard-coded lookup).

- If an unmet `Need` is missing `relatedTo` or `evidencedBy`, `convertData` SHALL default the corresponding `Statement`
  field to an empty string rather than throwing, so an incomplete `Plan` can still be converted.

#### Scenario: Converting a valid plan to template data

- **WHEN** `convertData` is called with a validated `Plan` with a mix of met and unmet needs
- **THEN** the system SHALL return a `Template` whose `patient` carries the plan's values with every date formatted per
  `config.format.date`, whose `appointments` is a single string of the plan's appointment dates formatted per
  `config.format.date` and joined with `config.format.appointment`, whose `assessments` array lists every need (met and
  unmet) in original order with `need` derived from the config's `mapping.need` section (per `need.type`), `isUnmet`
  derived from the config's `format.boolean` pair (per `need.isMet`), and `relatedTo`/`evidencedBy` copied from each
  `Need` (`undefined` when absent), and whose `statements` array lists only the unmet needs in original relative order
  with `need` derived from that same config's `mapping.need` section, and `relatedTo` and `evidencedBy` copied from each
  `Need`

#### Scenario: Formatting patient date of birth

- **WHEN** `convertData` maps a `Plan` whose `patient.dob` is `"1990-05-03"` using a `Config` whose `format.date` is
  `"MM/DD/YYYY"`
- **THEN** the resulting `Template`'s `patient.dob` SHALL equal `"05/03/1990"`

#### Scenario: Joining appointment dates using the default separator

- **WHEN** `convertData` is called without an explicit `Config` argument, and maps a `Plan` whose `appointments` is
  `["2026-07-01", "2026-08-01"]`
- **THEN** the resulting `Template`'s `appointments` SHALL equal `"07/01/2026, 08/01/2026"` — each date formatted per
  `DEFAULT_CONFIG.format.date` and joined with `DEFAULT_CONFIG.format.appointment` (`", "`)

#### Scenario: Joining appointment dates using a custom separator

- **WHEN** `convertData` maps a `Plan`'s `appointments` list using a given `Config` whose `format.appointment` differs
  from the default (e.g. `" / "`)
- **THEN** the resulting `Template`'s `appointments` SHALL join the formatted dates using that given separator, not the
  default

#### Scenario: Joining an empty appointments list

- **WHEN** `convertData` maps a `Plan` whose `appointments` is an empty array
- **THEN** the resulting `Template`'s `appointments` SHALL equal `""`

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

#### Scenario: Mapping interventions onto a goal

- **WHEN** `convertData` maps a `Goal` that has `interventions`
- **THEN** the resulting `Statement` goal's `interventions` SHALL equal that `Goal`'s `interventions`, in the same order

#### Scenario: Defaulting interventions when absent

- **WHEN** `convertData` maps a `Goal` that has no `interventions`
- **THEN** the resulting `Statement` goal's `interventions` SHALL be an empty array

#### Scenario: Mapping outcome status to a display label using the default config

- **WHEN** `convertData` is called without an explicit `Config` argument, and maps a `Goal` whose `outcome.status` is
  `"met"`, `"partial"`, or `"unmet"`
- **THEN** the resulting `Statement` goal's `outcome.label` SHALL be `"Met"`, `"Partially met"`, or `"Not met"`
  respectively (from `DEFAULT_CONFIG.mapping`), and `outcome.note` SHALL equal that `Goal`'s `outcome.note`

#### Scenario: Mapping outcome status to a display label using a custom config

- **WHEN** `convertData` is called with an explicit `Config` whose `mapping.outcome` section differs from the defaults,
  and maps a `Goal`
- **THEN** the resulting `Statement` goal's `outcome.label` SHALL come from the given `Config`, not `DEFAULT_CONFIG`

#### Scenario: Deriving need labels from the config for both assessments and statements

- **WHEN** `convertData` maps a `Need` whose `type` has a canonical label in `config.mapping.need` that differs from any
  name that might otherwise be associated with that need
- **THEN** both the resulting `assessment.need` (for that need) and, if the need is unmet, `statement.need` SHALL equal
  `config.mapping.need[need.type]`

#### Scenario: Mapping isMet to the isUnmet display label using the default config

- **WHEN** `convertData` is called without an explicit `Config` argument, and maps a `Need` whose `isMet` is `true`
- **THEN** the resulting `assessment.isUnmet` SHALL equal `"No"` (from `DEFAULT_CONFIG.format.boolean.false`, since
  `!need.isMet` is `false`)

#### Scenario: Mapping an unmet need to the isUnmet display label using the default config

- **WHEN** `convertData` is called without an explicit `Config` argument, and maps a `Need` whose `isMet` is `false`
- **THEN** the resulting `assessment.isUnmet` SHALL equal `"Yes"` (from `DEFAULT_CONFIG.format.boolean.true`, since
  `!need.isMet` is `true`)

#### Scenario: Mapping isMet to the isUnmet display label using a custom config

- **WHEN** `convertData` is called with an explicit `Config` whose `format.boolean` pair differs from the defaults, and
  maps a `Need`
- **THEN** the resulting `assessment.isUnmet` SHALL come from the given `Config`'s `format.boolean`, not
  `DEFAULT_CONFIG`'s

#### Scenario: Copying relatedTo and evidencedBy onto an assessment

- **WHEN** `convertData` maps a `Need` that has `relatedTo` and/or `evidencedBy`
- **THEN** the resulting `assessment.relatedTo`/`assessment.evidencedBy` SHALL equal those values verbatim

#### Scenario: An assessment for a Need with no relatedTo/evidencedBy leaves them undefined

- **WHEN** `convertData` maps a `Need` that has neither `relatedTo` nor `evidencedBy` (typical for a met need)
- **THEN** the resulting `assessment.relatedTo` and `assessment.evidencedBy` SHALL both be `undefined`, NOT defaulted to
  an empty string

#### Scenario: Two goals on the same statement with independent interventions and outcomes

- **WHEN** `convertData` maps an unmet `Need` with two goals, each having different `interventions` and different
  `outcome.status`
- **THEN** the resulting `Statement`'s `goals` array SHALL contain each goal's own `interventions` and `outcome`
  independently, with neither goal's values affecting the other's
