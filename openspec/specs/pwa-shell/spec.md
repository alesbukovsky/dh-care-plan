# pwa-shell

## Purpose

Defines the PWA's application shell: a three-pane layout (command bar, patient case pane, plan editor pane) for viewing
and editing a care plan's needs. TBD: expand as the shell gains persistence, real actions, and richer editing
capabilities.

## Requirements

### Requirement: Three-pane application shell

The PWA SHALL render a three-pane layout: a command bar pane (left), a patient case pane (middle), and a plan editor
pane (right).

#### Scenario: Initial load

- **WHEN** the PWA loads
- **THEN** all three panes are visible: command bar, patient case, plan editor

### Requirement: Collapsible command bar

The command bar SHALL be collapsible to an icon-only rail and expandable back to full width. Each icon in the collapsed
state SHALL show a tooltip with its label on hover.

#### Scenario: Collapse the command bar

- **WHEN** the user clicks the collapse toggle
- **THEN** the command bar shrinks to show only icons, with full-width labels and controls hidden

#### Scenario: Hover an icon while collapsed

- **WHEN** the command bar is collapsed and the user hovers an icon
- **THEN** a tooltip displays that icon's label

#### Scenario: Expand the command bar

- **WHEN** the user clicks the expand toggle on a collapsed command bar
- **THEN** the command bar returns to full width showing icons with labels

### Requirement: Command bar actions

The command bar SHALL present placeholder actions for: import data, export data, generate plan, and configure — as four
distinct entries. It SHALL also display the current application version. The command bar SHALL NOT show a per-need
completion indicator (e.g. no circular progress wheel).

#### Scenario: View command bar actions

- **WHEN** the command bar is expanded
- **THEN** it shows entries for "Import data", "Export data", "Generate plan", and "Configure" as separate items, plus
  the current app version
- **AND** it does not show a circular or wheel-style needs-completion indicator

#### Scenario: Placeholder actions are inert

- **WHEN** the user activates the import data, export data, generate plan, or configure action
- **THEN** no persistence, file I/O, document generation, or configuration change occurs (actions are visual
  placeholders only for this change)

### Requirement: Patient case pane is paste-only text

The patient case pane SHALL provide a plain text input surface for pasting patient case text from an external source. It
SHALL NOT provide a separate edit/preview mode toggle.

#### Scenario: Paste patient case text

- **WHEN** the user pastes text into the patient case pane
- **THEN** the pasted text appears in the pane as plain text
- **AND** no edit/preview mode switch is present

### Requirement: Plan editor renders needs as collapsible, editable sections

The plan editor pane SHALL render the set of needs from a `Plan` (per the `packages/core` `Plan`/`Need` schema) as a
list of collapsible sections, one per need. Each section SHALL be independently expandable/collapsible. Each section's
body SHALL show two outcome toggle buttons first, matching the `_demo` prototype: "Need is met" and "Need is unmet".
When the status is "met", the body SHALL show only a short confirmation note — the detail fields SHALL be hidden.
Otherwise (status is "partial" or "unmet"), the body SHALL show the full editable detail fields: a prefilled sentence
with blanks for `relatedTo`/`evidencedBy`, an editable list of goals (task text plus target date/relative term,
addable/removable), an editable list of interventions (addable/removable), and an editable evaluation note. The status
pill in the section header MAY still show "Partial" for data carrying that value, but "Partial" is not a separate toggle
button.

#### Scenario: Initial plan editor state

- **WHEN** the PWA loads with a sample `Plan`
- **THEN** the plan editor shows one collapsible section per need in the plan, using the need's `type`/`name` as its
  heading

#### Scenario: Toggle a need section

- **WHEN** the user clicks a need section's header
- **THEN** that section's body (details) toggles between expanded and collapsed independently of other sections

#### Scenario: Mark a need as met

- **WHEN** the user selects "Need is met" for a need
- **THEN** the detail fields (sentence blanks, goals, interventions, evaluation note) are hidden
- **AND** a short confirmation note is shown instead

#### Scenario: Mark a need as unmet

- **WHEN** the user selects "Need is unmet" for a need
- **THEN** the detail fields (sentence blanks, goals, interventions, evaluation note) are shown

#### Scenario: Fill in the prefilled sentence

- **WHEN** the user types into the "related to" or "as evidenced by" blank of a need's sentence
- **THEN** that need's `relatedTo`/`evidencedBy` value updates in the in-memory plan state

#### Scenario: Add, edit, and remove a goal

- **WHEN** the user adds a goal, edits its task text or target date/relative term, or removes a goal
- **THEN** the need's `goals` list in the in-memory plan state reflects the change immediately

#### Scenario: Add, edit, and remove an intervention

- **WHEN** the user adds an intervention, edits its text, or removes it
- **THEN** the need's `interventions` list in the in-memory plan state reflects the change immediately

#### Scenario: Change outcome status and note

- **WHEN** the user selects a different outcome status (met/partial/unmet) or edits the evaluation note
- **THEN** the need's `outcome` value in the in-memory plan state reflects the change immediately

### Requirement: No persistence in this change

The PWA SHALL NOT read from or write to `localStorage`, files, or any backend in this change. All plan and case data
SHALL be held in in-memory/mock state only.

#### Scenario: Reload the page

- **WHEN** the user reloads the PWA after pasting case text, editing plan fields, or toggling need sections
- **THEN** the app returns to its initial mock state (no data is retained)
