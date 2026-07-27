# template-schema Specification

## Purpose

TBD - defines the flat `TemplateSchema` representing the shape that docxtemplater tag resolution expects.

## Requirements

### Requirement: Flat template schema placeholder

The system SHALL define a zod schema (`TemplateSchema`, `packages/core/src/schema/template.ts`) representing the flat
shape that docxtemplater tag resolution expects. Until the data→template conversion process is designed, this schema
SHALL exist as an explicit placeholder rather than a guessed flattening of the data schema. Date-bearing fields
(`patient.dob`, `appointments` entries, and each goal's `doneBy`) SHALL be typed as `z.string()` rather than
`z.iso.date()`, since these fields hold an already-formatted display string (per `config.format.date`) produced by
`buildTemplateData`, not a strict ISO date.

#### Scenario: Template author inspects available tags

- **WHEN** a template author needs to know what tags are available to place in a `.docx` template
- **THEN** the system SHALL expose `TemplateSchema` as the single source of truth for those tags (currently empty, to be
  populated once the conversion process is designed), with its date-bearing fields typed as plain strings rather than
  ISO dates

#### Scenario: Validating a formatted date string in template data

- **WHEN** template data produced by `buildTemplateData` carries a formatted date string (e.g. `"05/03/1990"`) in
  `patient.dob`, an `appointments` entry, or a goal's `doneBy`
- **THEN** validation against `Template` SHALL accept it, since these fields are `z.string()` and no longer require ISO
  `YYYY-MM-DD` format

### Requirement: Template schema exportable as JSON Schema

The system SHALL expose a `getTemplateSchema()` function (`packages/core/src/schema/template.ts`) that produces a JSON
Schema document for `Template` on demand, using a `template.ts`-local zod registry independent of `plan.ts`'s registry,
mirroring the pattern used by `getPlanSchema()`. Any object registered on that local registry SHALL be extracted to
`$defs` rather than inlined, and the returned document SHALL carry its own `$id` of
`${SCHEMA_BASE_URI}/template.schema.json`, where `SCHEMA_BASE_URI` (`packages/core/src/schema/common.ts`) is the base
URI shared with the plan schema's `$id`. `SCHEMA_BASE_URI` itself SHALL NOT have a trailing slash (for readability when
referenced on its own); the `/` separator SHALL be added at the `$id` join site instead.

#### Scenario: Generating JSON Schema for the template schema

- **WHEN** `getTemplateSchema()` is called
- **THEN** the system SHALL return a valid JSON Schema document whose top-level `$id` is
  `${SCHEMA_BASE_URI}/template.schema.json` (currently an empty object schema's `$defs`/properties until template fields
  are defined in a future change)

### Requirement: `Statement.goals[]` (template `Goal`) owns `interventions` and `outcome`, not `Statement`

The system SHALL define each template `Goal` (`packages/core/src/schema/template.ts`, within `Statement.goals`) with an
`interventions` field (`z.array(z.string()).optional()`) and a required `outcome` field
(`{ label: string, note?: string }`, the existing template `Outcome` shape). `Statement` SHALL NOT define
`interventions` or `outcome` fields of its own — only `need`, `relatedTo`, `evidencedBy`, and `goals` remain on
`Statement`.

#### Scenario: Parsing a Statement with per-goal interventions and outcome

- **WHEN** a `Template`'s `Statement` is parsed whose `goals` array contains goals each with their own `interventions`
  and `outcome` fields
- **THEN** validation SHALL succeed, with each goal's `interventions` and `outcome` accessible independently of any
  other goal on the same statement

#### Scenario: A Statement with no interventions/outcome fields of its own

- **WHEN** a `Statement` object is parsed that has no top-level `interventions` or `outcome` keys
- **THEN** validation SHALL succeed — `Statement` no longer requires or accepts `interventions`/`outcome` at the
  statement level

#### Scenario: A template Goal missing outcome fails validation

- **WHEN** a template `Goal` (within `Statement.goals`) is parsed with no `outcome` field
- **THEN** validation SHALL fail, since that `Goal`'s `outcome` is required
