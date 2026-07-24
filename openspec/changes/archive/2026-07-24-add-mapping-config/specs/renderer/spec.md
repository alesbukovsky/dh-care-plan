## MODIFIED Requirements

### Requirement: `render()` converts Plan to template data by mapping needs to assessments and statements

Once both the plan and template are valid, `render()` SHALL convert the
parsed `Plan` into `Template`-shaped data by calling a function
(`buildTemplateData`, `packages/core/src/renderer.ts`) that maps `Plan`'s
top-level fields and `plan.needs` into `Template`'s `patient`,
`appointments`, `assessments`, and `statements`. `buildTemplateData`
SHALL accept an optional resolved `Mapping` as its second parameter,
defaulting to `DEFAULT_MAPPING` when omitted:

- `patient` SHALL be copied from `plan.patient` unchanged.
- `appointments` SHALL be copied from `plan.appointments` unchanged,
  preserving order.
- `assessments` SHALL contain one entry per `Need` in `plan.needs`, in the
  same order, with `need.name` mapped to `assessment.need` and
  `need.isMet` mapped to `assessment.isMet`.
- `statements` SHALL contain one entry per `Need` in `plan.needs` whose
  `isMet` is `false`, in the same relative order, with `need.name` mapped
  to `statement.need`, `need.relatedTo` mapped to `statement.relatedTo`,
  and `need.evidencedBy` mapped to `statement.evidencedBy`. `Need`s where
  `isMet` is `true` SHALL be excluded from `statements`.
- Each statement's `goals` SHALL contain one entry per `Goal` in the
  source `Need`'s `goals`, in the same order, with `task` and `doneBy`
  mapped 1:1, plus a generated `label` of the form `<n><letter>` where
  `n` is the 1-based position of the statement within the `statements`
  array and `letter` is the 0-based position of the goal within that
  statement's `goals`, rendered as `a`, `b`, `c`, ... (e.g. the 3rd goal
  of the 2nd statement is labelled `2c`).
- Each statement's `interventions` SHALL be copied from the source
  `Need`'s `interventions`, defaulting to an empty array when the `Need`
  has no `interventions`.
- Each statement's `outcome` SHALL be derived from the source `Need`'s
  `outcome`: `outcome.note` SHALL be copied 1:1, and `outcome.status`
  SHALL be mapped to `outcome.label` via the given `Mapping`'s
  `outcomeStatus` (i.e. `mapping.outcomeStatus[need.outcome.status]`),
  not a hard-coded lookup.
- If an unmet `Need` is missing `relatedTo` or `evidencedBy`, `render()`
  SHALL default the corresponding `Statement` field to an empty string
  rather than throwing, so an incomplete `Plan` can still be rendered.

#### Scenario: Converting a valid plan to template data

- **WHEN** `render()` has a validated `Plan` with a mix of met and unmet
  needs and calls `buildTemplateData` with it
- **THEN** the system SHALL receive a `Template` whose `patient` and
  `appointments` match the plan's unchanged, whose `assessments` array
  lists every need (met and unmet) in original order with `need` and
  `isMet` copied from each `Need`, and whose `statements` array lists
  only the unmet needs in original relative order with `need`,
  `relatedTo`, and `evidencedBy` copied from each `Need`

#### Scenario: Generating goal labels for statements

- **WHEN** `buildTemplateData` maps an unmet `Need` with goals into a
  `Statement`
- **THEN** each resulting goal SHALL carry a `label` combining the
  statement's 1-based position in `statements` with the goal's position
  in that statement's `goals` list rendered as a letter (`a`, `b`, `c`,
  ...), independent of the need's position in `plan.needs`

#### Scenario: Unmet need missing relatedTo or evidencedBy

- **WHEN** `buildTemplateData` encounters an unmet `Need` whose
  `relatedTo` or `evidencedBy` is `undefined`
- **THEN** the system SHALL set the corresponding `Statement` field to an
  empty string instead of throwing

#### Scenario: Copying patient and appointments unchanged

- **WHEN** `buildTemplateData` maps a `Plan` with a `patient` and a list
  of `appointments`
- **THEN** the resulting `Template`'s `patient` SHALL equal the plan's
  `patient` and `appointments` SHALL equal the plan's `appointments`, in
  the same order

#### Scenario: Mapping interventions onto a statement

- **WHEN** `buildTemplateData` maps an unmet `Need` that has
  `interventions`
- **THEN** the resulting `Statement`'s `interventions` SHALL equal the
  `Need`'s `interventions`, in the same order

#### Scenario: Defaulting interventions when absent

- **WHEN** `buildTemplateData` maps an unmet `Need` that has no
  `interventions`
- **THEN** the resulting `Statement`'s `interventions` SHALL be an empty
  array

#### Scenario: Mapping outcome status to a display label using the default mapping

- **WHEN** `buildTemplateData` is called without an explicit `Mapping`
  argument, and maps an unmet `Need` whose `outcome.status` is `"met"`,
  `"partial"`, or `"unmet"`
- **THEN** the resulting `Statement`'s `outcome.label` SHALL be `"Met"`,
  `"Partially met"`, or `"Not met"` respectively (from
  `DEFAULT_MAPPING`), and `outcome.note` SHALL equal the `Need`'s
  `outcome.note`

#### Scenario: Mapping outcome status to a display label using a custom mapping

- **WHEN** `buildTemplateData` is called with an explicit `Mapping` whose
  `outcomeStatus` differ from the defaults, and maps an unmet
  `Need`
- **THEN** the resulting `Statement`'s `outcome.label` SHALL come from the
  given `Mapping`, not `DEFAULT_MAPPING`

### Requirement: `render()` renders the template with the generated template data

Once template data has been generated, `render()` SHALL construct a
docxtemplater instance from the template buffer (via the existing
`createTemplater` helper), render it using the generated template data, and
return the resulting document bytes. `render()` SHALL accept an optional
third `ArrayBuffer` parameter carrying a mapping file's raw contents; if
provided, `render()` SHALL validate it against `Mapping` (every key
required) before passing it to `buildTemplateData`. If omitted, `render()`
SHALL use `DEFAULT_MAPPING`.

#### Scenario: Successful render

- **WHEN** `render()` is called with a valid plan buffer and a valid
  template buffer whose tags are all satisfied by the generated template
  data
- **THEN** the system SHALL return a success result carrying the rendered
  document as bytes

#### Scenario: Docxtemplater render failure

- **WHEN** the docxtemplater render step throws (e.g. an unresolved
  expression or a malformed template body that validation didn't catch)
- **THEN** the system SHALL return a failure result carrying an issue
  describing the render failure, rather than throwing out of `render()`

#### Scenario: Rendering with a valid mapping file

- **WHEN** `render()` is called with a plan buffer and template buffer
  that are both valid, and a third buffer containing JSON that satisfies
  `Mapping`
- **THEN** the system SHALL use that mapping when building template data,
  without reporting any mapping-related issue

#### Scenario: Rendering with an invalid mapping file

- **WHEN** `render()` is called with a third buffer containing JSON that
  violates `Mapping` (including an incomplete mapping missing a key), or
  content that is not valid JSON
- **THEN** the system SHALL return a failure result carrying every
  discovered mapping validation issue, without attempting to render

#### Scenario: Rendering without a mapping file

- **WHEN** `render()` is called with only the plan and template buffers
  (no third argument)
- **THEN** the system SHALL use `DEFAULT_MAPPING` when building template
  data
