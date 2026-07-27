## ADDED Requirements

### Requirement: `Assessment` carries `relatedTo`/`evidencedBy` and a display-string `isUnmet` label, not a raw boolean

The system SHALL define each `Template.Assessment` (`packages/core/src/schema/template.ts`) with `need` (`z.string()`,
unchanged), `isUnmet` (`z.string()`, a display label — NOT a boolean), and optional `relatedTo`/`evidencedBy`
(`z.string().optional()` each, mirroring `Statement`'s fields of the same name but optional rather than required, since
`Assessment` lists every need, met or unmet, and a met need typically has neither). `Assessment` SHALL NOT define an
`isMet` field.

#### Scenario: Parsing an Assessment with relatedTo and evidencedBy

- **WHEN** a `Template`'s `assessments` array contains an entry with `need`, `isUnmet`, `relatedTo`, and `evidencedBy`
  all present
- **THEN** validation SHALL succeed, with all four fields accessible on that assessment

#### Scenario: Parsing an Assessment with no relatedTo/evidencedBy

- **WHEN** an `Assessment` object is parsed with only `need` and `isUnmet` — no `relatedTo`/`evidencedBy` keys at all
- **THEN** validation SHALL succeed, with that assessment's `relatedTo` and `evidencedBy` `undefined`

#### Scenario: An Assessment's isUnmet field must be a string, not a boolean

- **WHEN** an `Assessment` is parsed with `isUnmet` given as a boolean (e.g. `true`) rather than a string
- **THEN** validation SHALL fail

#### Scenario: An Assessment missing isUnmet fails validation

- **WHEN** an `Assessment` is parsed with no `isUnmet` field
- **THEN** validation SHALL fail, since `Assessment.isUnmet` is required
