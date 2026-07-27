## ADDED Requirements

### Requirement: Missing tag values render as empty strings, not errors

The system SHALL configure `createTemplater` (`packages/core/src/templater.ts`) with a default `nullGetter: () => ""`,
so that when template data supplied to `render()` has an `undefined` or `null` value for a tag the `.docx` template
references (e.g. an assessment's `relatedTo`/`evidencedBy` for a met need), docxtemplater renders that tag as an empty
string instead of throwing or rendering a literal `"undefined"`. This default SHALL apply to every consumer of
`createTemplater`, including `render()`, and SHALL remain overridable by passing an explicit `nullGetter` in the options
given to `createTemplater`.

#### Scenario: Rendering a template with an undefined assessment field

- **WHEN** `render()` renders a `.docx` template that places `{assessments.relatedTo}` for an assessment whose
  `relatedTo` is `undefined` (e.g. a met need)
- **THEN** the resulting document SHALL show an empty string for that tag, and `render()` SHALL NOT return a failure
  result on account of the missing value

#### Scenario: A caller can still override nullGetter

- **WHEN** `createTemplater` is called with an explicit `nullGetter` option
- **THEN** that explicit `nullGetter` SHALL be used instead of the default empty-string behavior
