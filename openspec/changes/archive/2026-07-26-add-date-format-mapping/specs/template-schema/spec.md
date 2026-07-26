## MODIFIED Requirements

### Requirement: Flat template schema placeholder

The system SHALL define a zod schema (`TemplateSchema`,
`packages/core/src/schema/template.ts`) representing the flat shape that
docxtemplater tag resolution expects. Until the data→template conversion
process is designed, this schema SHALL exist as an explicit placeholder
rather than a guessed flattening of the data schema. Date-bearing fields
(`patient.dob`, `appointments` entries, and each goal's `doneBy`) SHALL be
typed as `z.string()` rather than `z.iso.date()`, since these fields hold
an already-formatted display string (per `config.format.date`) produced
by `buildTemplateData`, not a strict ISO date.

#### Scenario: Template author inspects available tags

- **WHEN** a template author needs to know what tags are available to place
  in a `.docx` template
- **THEN** the system SHALL expose `TemplateSchema` as the single source of
  truth for those tags (currently empty, to be populated once the
  conversion process is designed), with its date-bearing fields typed as
  plain strings rather than ISO dates

#### Scenario: Validating a formatted date string in template data

- **WHEN** template data produced by `buildTemplateData` carries a
  formatted date string (e.g. `"05/03/1990"`) in `patient.dob`, an
  `appointments` entry, or a goal's `doneBy`
- **THEN** validation against `Template` SHALL accept it, since these
  fields are `z.string()` and no longer require ISO `YYYY-MM-DD` format
