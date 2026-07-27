# plan-schema Specification

## Purpose

TBD - defines the structured, nested `Plan` schema representing care plan data, independent of any template tag
resolution format.

## Requirements

### Requirement: Structured plan schema

The system SHALL define a zod schema (`Plan`, `packages/core/src/schema/plan.ts`) representing a care plan as nested,
natural-organization data, independent of any template tag resolution format.

#### Scenario: Inspecting the plan schema

- **WHEN** a data author or tool inspects `Plan`
- **THEN** the system SHALL expose it as the single source of truth for care-plan data shape

### Requirement: Plan schema exportable as JSON Schema

The system SHALL expose a `getPlanSchema()` function (`packages/core/src/schema/plan.ts`) that produces a JSON Schema
document for `Plan` on demand, so tooling and humans can inspect the required data shape without reading the zod source.
Objects registered on a `plan.ts`-local zod registry (not the shared `z.globalRegistry`) SHALL be extracted to a `$defs`
section with in-document `$ref`s rather than inlined, and the returned document SHALL carry its own `$id` of
`${SCHEMA_BASE_URI}/plan.schema.json`, where `SCHEMA_BASE_URI` (`packages/core/src/schema/common.ts`) is the base URI
shared with the template schema's `$id`. `SCHEMA_BASE_URI` itself SHALL NOT have a trailing slash (for readability when
referenced on its own); the `/` separator SHALL be added at the `$id` join site instead.

#### Scenario: Generating JSON Schema for the plan schema

- **WHEN** `getPlanSchema()` is called
- **THEN** the system SHALL return a valid JSON Schema document whose top-level `$id` is
  `${SCHEMA_BASE_URI}/plan.schema.json`, and any registered nested object (e.g. `Goal`, `Need`, `MetNeed`, `UnmetNeed`)
  SHALL appear once under `$defs` and be referenced via `$ref` everywhere else it is used, rather than being inlined at
  each usage site

#### Scenario: Plan schema ids are independent of the template schema's ids

- **WHEN** `plan.ts` and `template.ts` each register an object under the same id string (e.g. both defining an object
  registered as `"Need"`)
- **THEN** the system SHALL NOT raise a duplicate-id error and each schema's `get*Schema()` output SHALL resolve its own
  `$ref`s against its own `$defs`, independent of the other schema's registry

### Requirement: `Goal.doneBy` supports an optional split date and relative term

The system SHALL define `Goal.doneBy` (`packages/core/src/schema/plan.ts`) as an optional zod object with two
independently optional fields: `date` (an ISO `YYYY-MM-DD` string, `z.iso.date().optional()`) and `relative` (a
free-text string, e.g. `"by next visit"`, `z.string().optional()`). The `doneBy` object itself SHALL remain optional, so
a `Goal` may specify neither, either, or both fields, or omit `doneBy` entirely.

#### Scenario: Goal with no doneBy information

- **WHEN** a `Goal` is parsed with no `doneBy` field at all
- **THEN** `Plan` parsing SHALL succeed, with the `Goal`'s `doneBy` `undefined`

#### Scenario: Goal with only a specific date

- **WHEN** a `Goal` is parsed with `doneBy: { date: "2026-08-01" }`
- **THEN** `Plan` parsing SHALL succeed, with `doneBy.date` equal to `"2026-08-01"` and `doneBy.relative` `undefined`

#### Scenario: Goal with only a relative term

- **WHEN** a `Goal` is parsed with `doneBy: { relative: "by next visit" }`
- **THEN** `Plan` parsing SHALL succeed, with `doneBy.relative` equal to `"by next visit"` and `doneBy.date` `undefined`

#### Scenario: Goal with both a date and a relative term

- **WHEN** a `Goal` is parsed with `doneBy: { date: "2026-08-01", relative: "by next visit" }`
- **THEN** `Plan` parsing SHALL succeed, with both `doneBy.date` and `doneBy.relative` populated as given
