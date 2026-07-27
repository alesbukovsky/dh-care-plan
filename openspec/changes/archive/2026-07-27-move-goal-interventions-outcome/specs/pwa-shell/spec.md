## MODIFIED Requirements

### Requirement: Plan editor renders needs as collapsible, editable sections

The plan editor pane SHALL render the set of needs from a `Plan` (per the `packages/core` `Plan`/`Need` schema) as a
list of collapsible sections, one per need. Each section SHALL be independently expandable/collapsible. Each section's
body SHALL show two outcome toggle buttons first, matching the `_demo` prototype: "Need is met" and "Need is unmet".
When the status is "met", the body SHALL show only a short confirmation note — the detail fields SHALL be hidden.
Otherwise (status is "partial" or "unmet"), the body SHALL show the full editable detail fields: a prefilled sentence
with blanks for `relatedTo`/`evidencedBy`, and an editable list of goals (addable/removable). Each goal in that list
SHALL show its own editable task text, target date/relative term, own outcome toggle ("Goal is met"/"Goal is unmet"),
own editable list of interventions (addable/removable), and own editable evaluation note — interventions and outcome are
no longer edited once per need, but once per goal, repeated for each goal. The need-level status pill in the section
header MAY still show "Partial" for data carrying that value, but "Partial" is not a separate toggle button.

#### Scenario: Initial plan editor state

- **WHEN** the PWA loads with a sample `Plan`
- **THEN** the plan editor shows one collapsible section per need in the plan, using the need's `type`/`name` as its
  heading

#### Scenario: Toggle a need section

- **WHEN** the user clicks a need section's header
- **THEN** that section's body (details) toggles between expanded and collapsed independently of other sections

#### Scenario: Mark a need as met

- **WHEN** the user selects "Need is met" for a need
- **THEN** the detail fields (sentence blanks, goals list) are hidden
- **AND** a short confirmation note is shown instead

#### Scenario: Mark a need as unmet

- **WHEN** the user selects "Need is unmet" for a need
- **THEN** the detail fields (sentence blanks, goals list) are shown, with each goal showing its own outcome toggle,
  interventions list, and evaluation note

#### Scenario: Fill in the prefilled sentence

- **WHEN** the user types into the "related to" or "as evidenced by" blank of a need's sentence
- **THEN** that need's `relatedTo`/`evidencedBy` value updates in the in-memory plan state

#### Scenario: Add, edit, and remove a goal

- **WHEN** the user adds a goal, edits its task text or target date/relative term, or removes a goal
- **THEN** the need's `goals` list in the in-memory plan state reflects the change immediately
- **AND** a newly-added goal SHALL default to an `outcome.status` of `"unmet"` rather than being created without an
  `outcome`

#### Scenario: Add, edit, and remove an intervention on a goal

- **WHEN** the user adds an intervention to a specific goal, edits its text, or removes it
- **THEN** that goal's `interventions` list in the in-memory plan state reflects the change immediately, independent of
  any other goal's `interventions`

#### Scenario: Change a goal's outcome status and note

- **WHEN** the user selects a different outcome status (met/partial/unmet) or edits the evaluation note for a specific
  goal
- **THEN** that goal's `outcome` value in the in-memory plan state reflects the change immediately, independent of any
  other goal's `outcome`
