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

### Requirement: `Goal` owns `interventions` and `outcome`, not `Need`

The system SHALL define each `Goal` (`packages/core/src/schema/plan.ts`) with an `interventions` field
(`z.array(z.string()).optional()`) and a required `outcome` field
(`{ status: "met" | "partial" | "unmet", note?: string }`, the same `Outcome` shape used previously on `Need`). `Need`
SHALL NOT define `interventions` or `outcome` fields of its own — only `type`, `isMet`, `relatedTo`, `evidencedBy`, and
`goals` remain on `Need`.

#### Scenario: Parsing a Need with per-goal interventions and outcome

- **WHEN** a `Need` is parsed whose `goals` array contains goals each with their own `interventions` and `outcome`
  fields
- **THEN** `Plan` parsing SHALL succeed, with each goal's `interventions` and `outcome` accessible independently of any
  other goal on the same need

#### Scenario: A Need with no interventions/outcome fields of its own

- **WHEN** a `Need` object is parsed that has no top-level `interventions` or `outcome` keys
- **THEN** `Plan` parsing SHALL succeed — `Need` no longer requires or accepts `interventions`/`outcome` at the need
  level

#### Scenario: A Goal missing outcome fails validation

- **WHEN** a `Goal` is parsed with no `outcome` field
- **THEN** `Plan` parsing SHALL fail, since `Goal.outcome` is required

#### Scenario: A Goal with no interventions

- **WHEN** a `Goal` is parsed with no `interventions` field
- **THEN** `Plan` parsing SHALL succeed, with that goal's `interventions` `undefined`

#### Scenario: Two goals on the same need with different outcome statuses

- **WHEN** a `Need` has two goals, one with `outcome.status: "met"` and the other with `outcome.status: "unmet"`
- **THEN** `Plan` parsing SHALL succeed, and each goal's `outcome.status` SHALL be independently readable, unrelated to
  the other goal's status or to the need's own `isMet` flag

### Requirement: `Need` carries only its category `type`, not a free-text `name`

The system SHALL define `Need` (`packages/core/src/schema/plan.ts`) without a `name` field. A need's display label SHALL
be derived from `Need.type` via `Config.mapping.need[type]` wherever one is needed (e.g. `convertData`'s
`assessment.need` and `statement.need`), not stored redundantly on `Need` itself.

#### Scenario: Parsing a Need with no name field

- **WHEN** a `Need` is parsed with only `type`, `isMet`, and (for unmet needs) `relatedTo`/`evidencedBy`/`goals` — no
  `name` key at all
- **THEN** `Plan` parsing SHALL succeed

#### Scenario: A stray name field is ignored, not rejected

- **WHEN** a `Need` is parsed that still includes a `name` key (e.g. from a document authored before this change)
- **THEN** `Plan` parsing SHALL succeed, and the resulting `Need` value SHALL NOT expose that `name` as part of the
  `Need` type
