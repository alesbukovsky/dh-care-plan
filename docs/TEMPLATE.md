# Template Reference

A template is a normal Word (`.docx`) document. You write it however you like, with headings,tables, styling, your
preferred letterhead, and drop in **tags** where you want data from the tool to appear. When you use **Generate plan**
and select a template, the app finds those tags and replaces them with the actual data.

Everything in the template that _isn't_ a tag is left exactly as you typed it. The tool never touches your wording,
formatting, or layout, only the tags get replaced.

See a [sample template](./sample-template.docx) for a working example that uses every available tag.

## Plan data model

The plan's data is organized like a tree, built from three kinds of nodes:

- **Leaf**: a single piece of text to be written to the final document, e.g. a patient's date of birth.
- **Container**: a fixed set of nodes grouped together, each appearing once, e.g. patient info holding one initials
  field, one date of birth field, one chart ID field, and so on.
- **List**: an open-ended set of the same nodes, repeated as many times as needed, e.g. one entry for each medical
  condition the patient has.

## Writing a tag

A tag is a node's name wrapped in curly braces, e.g. `{node}`. Write it directly into the document. Whatever formatting
(e.g. font or style) you apply to the tag is the formatting the inserted text will have. A tag for a leaf inserts its
text directly.

To reach a leaf nested inside a _container_, chain the names with dots following the path from the root to the desired
node, e.g. `{objective.medical.bmi}`.

To print a _list_, wrap the part of the document that should _repeat_ between `{#node}` and `{/node}`:

```text
{#conditions}
- {description}
{/conditions}
```

This prints one bullet per condition. Inside the loop, access the nested data without referring to the parent, e.g. no
need to repeat `conditions.` to reach each condition's `description` in the above example.

Some lists hold leaves directly, with no container per entry, e.g. `objective.medical.vitals` (a list of vital sign
readings). Loop over it the same way, but use `{.}` inside the loop to refer to the leaf value itself:

```text
{#objective.medical.vitals}
- {.}
{/objective.medical.vitals}
```

### "If empty" text

To show something only when a list or leaf value is empty, use `{^node}` opening tag:

```text
{^conditions}
No recorded medical conditions
{/conditions}
```

### A note on typos

If you spell a tag wrong or reference a field that doesn't exist, the app catches it before generating anything and
shows you the list of unrecognized tags, nothing breaks silently. If a loop tag (`{#...}`) is left unclosed, you'll get
a document error instead. Either way, you'll know before you get a bad file.

## Advanced tags

Tags also support an optional, more [advanced syntax](https://docxtemplater.com/docs/angular-parse/) on top of the plain
field names shown above. Only use this if you're comfortable with it. For example, `{patient.initials | lower}` is
called a _filter_ and prints the node value into the document in all-lowercase letters.

## Tags reference

Every tag below is specified by its full dot path from the root. For lists, drop the parent prefix within the
`{#field}...{/field}` loop to access child nodes. Only nodes with `text` and `list(text)` (list of texts) type carry an
actual value you can print. The rest really only exists for data organization purposes.

<!-- markdownlint-disable MD013 -->

| Tag                                   | Type       | Description                                                 |
| ------------------------------------- | ---------- | ----------------------------------------------------------- |
| `patient`                             | container  | Patient's personal information                              |
| `patient.initials`                    | text       | Patient's initials                                          |
| `patient.dob`                         | text       | Date of birth and age (as one value)                        |
| `patient.chartId`                     | text       | Chart / record ID, e.g. in axiUm                            |
| `visits`                              | text       | Visit dates (as one value)                                  |
| `subjective`                          | container  | History reported by the patient                             |
| `subjective.complaint`                | text       | Patient's chief complaint                                   |
| `subjective.personal`                 | text       | Personal history summary                                    |
| `subjective.medical`                  | text       | Medical history summary                                     |
| `subjective.dental`                   | text       | Dental history summary                                      |
| `subjective.social`                   | text       | Social history summary                                      |
| `subjective.other`                    | text       | Other notes                                                 |
| `objective`                           | container  | Examination findings                                        |
| `objective.medical`                   | container  | Medical exam findings                                       |
| `objective.medical.vitals`            | list(text) | Vital sign readings                                         |
| `objective.medical.bmi`               | text       | BMI                                                         |
| `objective.medical.medications`       | text       | Current medications (as one value)                          |
| `objective.medical.allergies`         | text       | Allergies                                                   |
| `objective.medical.diseases`          | text       | Diseases and medical conditions (as one value)              |
| `objective.medical.asa`               | text       | ASA classification                                          |
| `objective.medical.referrals`         | list(text) | Needed medical referrals                                    |
| `objective.exams`                     | container  | Exam findings                                               |
| `objective.exams.findings`            | text       | Exam findings (as one value)                                |
| `objective.exams.referrals`           | list(text) | Referrals from exam                                         |
| `objective.restorative`               | container  | Restorative findings                                        |
| `objective.restorative.caries`        | text       | Caries findings                                             |
| `objective.restorative.restorations`  | text       | Existing restorations                                       |
| `objective.restorative.risk`          | text       | Restorative risk assessment                                 |
| `objective.restorative.occlusion`     | text       | Occlusion findings                                          |
| `objective.restorative.referrals`     | list(text) | Restorative referrals                                       |
| `objective.periodontal`               | container  | Periodontal findings                                        |
| `objective.periodontal.gingiva`       | text       | Gingival findings                                           |
| `objective.periodontal.aap`           | text       | AAP periodontal classification                              |
| `objective.periodontal.debridement`   | text       | Debridement notes                                           |
| `objective.periodontal.gi`            | text       | Gingival index                                              |
| `objective.periodontal.pi`            | text       | Plaque index                                                |
| `objective.periodontal.referrals`     | list(text) | Periodontal referrals                                       |
| `objective.radiographic`              | text       | Radiographic findings                                       |
| `objective.diagnostic`                | text       | Other diagnostic findings                                   |
| `conditions`                          | list       | Medical conditions and medications, one entry per condition |
| `conditions.name`                     | text       | Condition name                                              |
| `conditions.description`              | text       | Condition description                                       |
| `conditions.medications`              | text       | Related medications                                         |
| `conditions.adverse`                  | text       | Adverse reactions                                           |
| `conditions.interactions`             | text       | Drug/condition interactions                                 |
| `conditions.modifications`            | text       | Treatment modifications required                            |
| `conditions.recommendations`          | text       | Recommendations                                             |
| `justifications`                      | list       | Patient's need priority justifications                      |
| `justifications.need`                 | text       | Identified need                                             |
| `justifications.exists`               | text       | Whether the need exists                                     |
| `justifications.priority`             | text       | Priority level                                              |
| `justifications.rationale`            | text       | Rationale                                                   |
| `assessments`                         | list       | Patient's need assessments                                  |
| `assessments.need`                    | text       | Identified need                                             |
| `assessments.exists`                  | text       | Whether the need exists                                     |
| `assessments.relatedTo`               | text       | Related to                                                  |
| `assessments.evidencedBy`             | text       | Evidenced by                                                |
| `statements`                          | list       | Care plan statements, sorted by priority.                   |
| `statements.label`                    | text       | Statement label                                             |
| `statements.need`                     | text       | Identified need                                             |
| `statements.exists`                   | text       | Whether the need exists                                     |
| `statements.relatedTo`                | text       | Related to                                                  |
| `statements.evidencedBy`              | text       | Evidenced by                                                |
| `statements.goals`                    | list       | Goals for this statement, nested inside the statement       |
| `statements.goals.label`              | text       | Goal label                                                  |
| `statements.goals.task`               | text       | Task description                                            |
| `statements.goals.doneBy`             | text       | Target completion date/milestone                            |
| `statements.goals.interventions`      | list(text) | Interventions for this goal                                 |
| `statements.goals.outcome`            | container  | Outcome of this goal                                        |
| `statements.goals.outcome.label`      | text       | Outcome label                                               |
| `statements.goals.outcome.note`       | text       | Outcome note                                                |
| `appointments`                        | container  | Planned appointments                                        |
| `appointments.interval`               | text       | Recall / recare interval                                    |
| `appointments.planned`                | list       | Planned appointments, one entry per appointment             |
| `appointments.planned.label`          | text       | Appointment label                                           |
| `appointments.planned.length`         | text       | Appointment length                                          |
| `appointments.planned.prophylaxis`    | text       | Prophylaxis performed                                       |
| `appointments.planned.instruction`    | text       | Patient instructions                                        |
| `appointments.planned.recommendation` | text       | Recommendations                                             |
| `appointments.planned.referral`       | text       | Referral                                                    |

<!-- markdownlint-enable MD013 -->
