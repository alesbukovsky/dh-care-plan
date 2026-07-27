## Context

`Plan` (`packages/core/src/schema/plan.ts`) models care needs naturally: a list of `Need`, each with `name`, `isMet`,
optional `relatedTo`/ `evidencedBy`, and an optional list of `Goal` (`task`, `doneBy`). `Template`
(`packages/core/src/schema/template.ts`) shapes the same information for docxtemplater, which only supports flat loops
over arrays: it needs a separate `assessments` array (all needs) and `statements` array (unmet needs only), with goals
carrying a display `label` docxtemplater can't compute itself. `buildTemplateData` in `packages/core/src/renderer.ts` is
the single seam where this translation happens, and today it just returns `{}`.

## Goals / Non-Goals

**Goals:**

- Implement `buildTemplateData(plan: Plan): Template` with the exact mapping described in the proposal.
- Keep the function pure and synchronous — no I/O, no schema changes.

**Non-Goals:**

- Changing the `Plan` or `Template` zod schemas.
- Handling malformed/invalid `Plan` input — `render()` already validates the plan against `Plan` before calling
  `buildTemplateData`, so the input can be trusted to match the schema.

## Decisions

- **Assessments preserve `plan.needs` order and include every need**, mapping `name` -> `need` and `isMet` -> `isMet`
  directly (`Assessment` has no other fields). Rationale: proposal states assessments list all needs 1:1; no filtering
  or reordering needed.

- **Statements filter to `isMet === false`, preserving relative order.** `relatedTo` and `evidencedBy` are optional on
  `Need` but required (non-optional `z.string()`) on `Statement`. Plans are allowed to be incomplete (a user may render
  a plan that's still in progress), so a missing `relatedTo`/`evidencedBy` on an unmet need defaults to `""` via a
  single shared `orEmpty` helper, rather than throwing. Rationale: the renderer must not block on incomplete domain data
  — this mapping only needs to produce a well-typed `Template`, not validate business completeness (a separate, future
  concern if ever needed).

- **Goal labels are computed positionally, not stored on the input.** Statement number = 1-based index of the need
  within the filtered `statements` array (not its index within `plan.needs`). Goal letter = the goal's 0-based index
  within that need's `goals` array, converted to a lowercase letter (`0` -> `a`, `1` -> `b`, ...) via
  `String.fromCharCode(97 + index)`. Rationale: proposal's `1a` example is explicit that `1` is the statement's position
  in the statements array and `a` is the goal's position within that statement — both are recomputed during mapping, not
  carried over from `Plan`.

- **No support for more than 26 goals per statement.** `goals.length` is expected to stay small (a handful of goals per
  need); if it ever exceeds 26, `String.fromCharCode` continues past `z` into non-letter characters rather than wrapping
  to `aa`. Accepted as a known limitation given realistic goal counts.

## Risks / Trade-offs

- [Blank `relatedTo`/`evidencedBy` in a rendered document goes unnoticed by the user] → accepted; the renderer's job is
  to render an incomplete plan as-is, not to flag incompleteness. A future change could surface a warning list of
  blanked fields if this becomes a problem.
- [Goal count > 26 breaks letter labelling] → accepted as unlikely; not mitigated in this change.
