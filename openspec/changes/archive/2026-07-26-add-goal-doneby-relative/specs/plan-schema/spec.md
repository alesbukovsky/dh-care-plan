## ADDED Requirements

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
