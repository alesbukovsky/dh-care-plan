## ADDED Requirements

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
