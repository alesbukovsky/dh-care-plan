## Context

`packages/core/cli/dhplan.ts` has two commands, `schema` and `validate`,
each accepting a `data`/`template` positional argument. They were added in
separate changes and never reconciled: `schema` calls it `<target>`
(parameter `target`), `validate` calls it `<schema_type>` (parameter
`schemaType`), and each command inlines its own `["data", "template"]`
choices array and its own `condition === "data" ? A : B` ternary to resolve
the matching schema (`DataSchema`/`TemplateSchema`) or validator
(`validateData`/`validateTemplate`).

## Goals / Non-Goals

**Goals:**

- One name for this argument, used identically by both commands, in both
  the CLI-facing text (`--help`, error messages) and the TS parameter name.
- One place that lists the valid schema types, reused by both commands'
  `Argument.choices(...)`.

**Non-Goals:**

- Adding a third schema type, or changing what `data`/`template` mean.
  Purely a naming/structure cleanup of the existing two commands. There
  are, and per direct user confirmation will only ever be, exactly two
  schema types — so the two `condition === "data" ? A : B` ternaries stay
  as ternaries; see Decision 3 (previously proposed lookup tables, now
  dropped).
- Moving this concept into `packages/core/src`. Only the CLI currently
  needs to enumerate "which schema type," so it stays CLI-local (see
  Decision 1).
- Changing either command's observable behavior beyond the argument's
  displayed name (`schema`'s help/error text) — accepted values, exit
  codes, and success/error output are unchanged.

## Decisions

**1. `SCHEMA_TYPES`/`SchemaType` live in `packages/core/cli/dhplan.ts`, not
in `packages/core/src`.**

`packages/core/src` already exposes the real building blocks
(`DataSchema`, `TemplateSchema`, `validateData`, `validateTemplate`); "which
of these two things does this CLI argument mean" is purely a concern of
the CLI's argument parsing, and today only `dhplan.ts` has that concern.
Alternative considered: define it in `src` (e.g. a new `schemaType.ts`) so
it could be reused elsewhere — rejected as premature; if a second consumer
of this notion shows up (e.g. a future `render` command needing the same
choices), promoting it to `src` at that point is a small, localized move,
not a redesign.

**2. The CLI-facing name is `type` (parameter `type`), not `schema_type`.**

Originally decided as `schema_type`, keeping `validate`'s existing name so
only `schema` would need to change. Reversed on direct user feedback:
`schema_type` was judged too verbose for what's a two-value choice on a
tiny CLI, and `type` reads clearly enough in context (`dhplan schema
<type>`, `dhplan validate <type> <file>`) without the extra word. Since
both commands' argument now needs to change anyway (`validate`'s
already-shipped `schema_type` included), the earlier "only one command
changes" argument for keeping `schema_type` no longer applies.

**3. Keep both `condition === "data" ? A : B` ternaries as-is; do not
introduce `SCHEMAS`/`VALIDATORS` lookup tables.**

An earlier version of this design replaced both ternaries with
`Record<SchemaType, ZodType>`/`Record<SchemaType, Validator>` lookup
tables, reasoning that a future third schema type would then be a compile
error at exactly the two places needing a new entry. Dropped on direct
user feedback: there are, and will only ever be, exactly two schema types
in this project, so that extensibility never pays for itself — it's an
abstraction for a case that won't occur. The two-line ternary in each
command is simpler to read at the call site than a lookup table declared
elsewhere, for exactly two branches. `Validator` (defined in
`validator.ts`) is accordingly not exported from
`packages/core/src/index.ts` either, since nothing outside `validator.ts`
needs to reference it.

## Risks / Trade-offs

- [Renaming both commands' argument (`schema`'s `<target>` and, after the
  `type` revision, `validate`'s already-shipped `<schema_type>`) changes
  their `--help` text and invalid-argument error wording] → Called out as
  breaking (loosely) in the proposal; pre-1.0, no external consumers of
  the CLI's `--help` output or error text.

## Migration Plan

Not applicable — internal refactor of one existing CLI file, no data or
deployment migration involved.
