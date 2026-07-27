## Context

`Goal.doneBy` was a single optional ISO date string. An in-progress, uncommitted edit to
`packages/core/src/schema/plan.ts` changed it to:

```ts
doneBy: {
 date: z.iso.date().optional(),
 relative: z.string().optional(),
},
```

This isn't valid zod — `z.object`'s shape values must be `ZodType` instances, and this is a plain JS object literal, not
`z.object({...})`, and it isn't itself marked `.optional()`. It compiles today only because TypeScript infers a
plausible-looking object type for the shape entry, but it is not the same as an actual object schema and would misbehave
at parse time. This change fixes that schema and defines the missing piece: how `convertData` turns
`{ date?, relative? }` into the single `doneBy` display string `Template` expects.

## Goals / Non-Goals

**Goals:**

- Make `Goal.doneBy` a valid, properly optional zod object schema with `date` and `relative` both optional.
- Define exactly how `date`/`relative` combine into one display string, per the three cases: neither, one, or both
  given.
- Let the "both given" combination format be configurable (a `{date}`/`{relative}` template string in `Config`),
  consistent with how `format.date` is already configurable.

**Non-Goals:**

- Changing how `patient.dob` or `appointments` dates are formatted — only `Goal.doneBy` assembly is affected.
- Validating that `relative` is one of a fixed set of terms (e.g. "next visit") — it stays a free-text string, matching
  the project's general preference for simple, non-technical-author-friendly config over rigid enums where not otherwise
  required.
- Supporting more than two components (date + relative) in the combined string.

## Decisions

- **Fix the shape as `z.object({ date: z.iso.date().optional(), relative: z.string().optional() }).optional()`.** The
  object itself stays optional (a `Goal` can have no `doneBy` at all, matching prior behavior), and each field inside is
  independently optional so any of the three cases (neither/one/both) is representable.
- **New `Config.format.goal.doneBy` pattern, used only for the "both given" case.** Alternatives considered:
  - _Always run both values through one template string, defaulting unset placeholders to empty_ — would need a defined
    behavior for a dangling separator (e.g. `"{date}, {relative}"` with empty `{relative}` leaves a trailing `", "`).
    Rejected: simpler and less surprising to bypass the template string entirely for the one-given cases, returning that
    value as-is.
  - _Fold this into `format.date` somehow_ — `format.date` formats a single date value; conflating it with the two-field
    combination logic would overload one config key with two concerns. Rejected in favor of a separate
    `format.goal.doneBy` key, mirroring the `date`/`mapping` separation established in the prior `Config` rename.
  - _Hard-code the join format (e.g. always `"{date}, {relative}"`, not configurable)_ — inconsistent with the project's
    existing pattern of making display formatting configurable via `Config` rather than hard-coded, since templates are
    authored by non-technical staff who may want a different join order/punctuation. Rejected.
- **Nest the pattern under a `goal` object (`format.goal.doneBy`) rather than a flat `format.goalDoneBy` key.** Grouping
  keeps `format` scalable to future per-entity formatting rules (e.g. a hypothetical `format.appointment.*`) without
  every new rule flattening into an ever-longer compound key name at the same level as `date`.
- **`{date}` in `format.goal.doneBy` is substituted with the already-`config.format.date`-formatted date, not the raw
  ISO string.** Consistent with `patient.dob`/`appointments`/single-date `doneBy` all going through the same date
  formatter.
- **Placeholder substitution is a simple literal `"{date}"`/`"{relative}"` string replace, not a templating engine.**
  Consistent with `dateStr` being a small hand-rolled token substitution rather than pulling in a templating library —
  same "no new dependency for a simple substitution" reasoning as the prior date-formatting change.
- **This change also fixes the invalid raw-object shape**, since the broken schema currently sits uncommitted and this
  change is the first one that depends on `Goal.doneBy`'s actual shape being correct.

## Risks / Trade-offs

- **The in-progress schema edit was uncommitted and had no tests or spec yet** → not a regression risk since nothing
  downstream depended on the broken shape; this change is what makes it real.
- **Ambiguous configuration if `format.goal.doneBy` doesn't contain both placeholders** → Mitigation: no new validation
  beyond `z.string()` (matching the minimal-validation style of `format.date` and the label strings); a config author
  who omits a placeholder simply won't see that component in the combined output — considered acceptable since `Config`
  fields are already unvalidated free-form strings/patterns throughout.
- **BREAKING for any plan JSON already written against the (broken, uncommitted) object-shaped `doneBy`** → no
  real-world breakage since the shape was never valid/committed; this change is additive from the perspective of anyone
  building against the last _committed_ schema (single ISO string), except that committed shape's plans need updating to
  `{ date }` form to keep the same single-date behavior.

## Migration Plan

- No runtime migration required (no persisted state). Plan JSON files using the last committed `doneBy: <ISO string>`
  shape must move to `doneBy: { date: <ISO string> }` to preserve identical rendered output. Config JSON files must add
  a `format.goal.doneBy` pattern.
