## Context

`Need.type` is a closed enum of 9 categories. `Config.mapping.need` already maps every `type` to a canonical display
label, and `convertData` already uses that mapping for `statement.need` (the label shown for unmet needs). `Need.name`
is a second, independent free-text field that's redundant with that mapping for the one thing it's currently used for:
`assessment.need` (the label shown for every need, met or unmet, in the assessments list).

## Goals / Non-Goals

**Goals:**

- Remove `Need.name` from the `Plan` schema.
- `assessment.need` (currently `need.name`) is derived from `config.mapping.need[need.type]`, matching
  `statement.need`'s existing derivation.

**Non-Goals:**

- No change to `Need.type`, the enum of categories, or `Config.mapping.need`'s shape.
- No change to how the PWA's need-section headings are labeled — those already come from a PWA-local `NeedDefinition`
  list (`packages/pwa/src/needs.ts`), itself derived from `DEFAULT_CONFIG.mapping.need`, not from `Plan`'s `Need.name`.

## Decisions

- **Derive `assessment.need` from config mapping, not a schema field**: mirrors `statement.need`'s existing derivation
  (`config.mapping.need[need.type]`). Having two different sources of the same category label (`Need.name` for
  assessments, `config.mapping.need` for statements) was the inconsistency being removed — not a gap being filled with a
  new field.
  - Alternative considered: keep `Need.name` but make it optional, falling back to `config.mapping.need[need.type]` when
    absent. Rejected — this keeps the redundant field around and reopens the question of what happens when a caller
    supplies a `name` that disagrees with the config mapping (which `Statement` already resolved by not having the field
    at all).
- **No schema-level rejection of a stray `name` key**: zod objects aren't strict by default, so a `Plan` document that
  still includes `name` on a need parses without error (the key is simply unused). No `.strict()` is being added as part
  of this change — that would be a separate, broader decision affecting every schema in this codebase, not specific to
  this field removal.

## Risks / Trade-offs

- **Breaking change for hand-authored `Plan` JSON**: any existing `Plan` document is still valid (extra `name` keys are
  ignored), but any tooling or documentation instructing authors to fill in `name` per need is now describing a no-op
  field. Mitigation: proposal calls this out as **BREAKING** in intent (removes a previously-required field), even
  though old documents don't fail validation.
- **Assessment/statement label divergence disappears**: previously, a `Need.name` that disagreed with
  `config.mapping.need[need.type]` would surface as a difference between the assessments list (using `name`) and the
  statements list (using the config mapping) for the same need. After this change, both lists always agree, which is the
  intended behavior, not a regression.
