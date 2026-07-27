## MODIFIED Requirements

### Requirement: Flat template schema placeholder

The system SHALL define a zod schema (`TemplateSchema`, `packages/core/src/schema/template.ts`) representing the flat
shape that docxtemplater tag resolution expects. Until the data→template conversion process is designed, this schema
SHALL exist as an explicit placeholder rather than a guessed flattening of the data schema. Date-bearing fields
(`patient.dob` and each goal's `doneBy`) SHALL be typed as `z.string()` rather than `z.iso.date()`, since these fields
hold an already-formatted display string (per `config.format.date`) produced by `buildTemplateData`, not a strict ISO
date. `appointments` SHALL be typed as `z.string()`, not `z.array(z.string())` — a single string holding every
appointment date already formatted and joined (per `config.format.date` and `config.format.appointment`), since a
`.docx` template places it as a single tag rather than looping over entries.

#### Scenario: Template author inspects available tags

- **WHEN** a template author needs to know what tags are available to place in a `.docx` template
- **THEN** the system SHALL expose `TemplateSchema` as the single source of truth for those tags, with its date-bearing
  fields typed as plain strings rather than ISO dates, and `appointments` typed as a single string rather than an array

#### Scenario: Validating a formatted date string in template data

- **WHEN** template data produced by `buildTemplateData` carries a formatted date string (e.g. `"05/03/1990"`) in
  `patient.dob` or a goal's `doneBy`
- **THEN** validation against `Template` SHALL accept it, since these fields are `z.string()` and no longer require ISO
  `YYYY-MM-DD` format

#### Scenario: Validating a joined appointments string in template data

- **WHEN** template data produced by `buildTemplateData` carries `appointments` as a single joined string (e.g.
  `"07/01/2026, 08/01/2026"`)
- **THEN** validation against `Template` SHALL accept it, since `appointments` is `z.string()`

#### Scenario: An appointments array is rejected

- **WHEN** template data is validated against `Template` with `appointments` given as an array rather than a string
- **THEN** validation SHALL fail
