## MODIFIED Requirements

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

## ADDED Requirements

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
