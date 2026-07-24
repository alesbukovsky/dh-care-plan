## Context

The CLI (`packages/core/cli/dhplan.ts`) already follows a consistent
pattern: read file(s) from disk, call a pure `core` function, print/write
the result. `schema` prints a schema, `validate` prints validation issues,
`render` writes a `.docx`. `inspect` adds a fourth: print the intermediate
`Template` data a plan maps to, without needing a `.docx` template at all.

## Goals / Non-Goals

**Goals:**
- Let a user see the exact `Template` JSON a given plan produces, for
  visual sanity-checking during authoring/debugging.
- Reuse the CLI's existing validate-then-act pattern (see `validate`,
  `render`).

**Non-Goals:**
- Validating or printing anything about a `.docx` template — `inspect`
  only takes a plan file.
- Changing `buildTemplateData` behavior.

## Decisions

- **Command signature: `dhplan inspect <plan>`.** One positional
  argument, mirroring `validate plan <file>` minus the `type` argument
  (there's only one thing to inspect: a plan file).

- **Validate the plan first, using the same `validateData` the other
  commands use**, and report issues to stderr + exit non-zero on failure,
  consistent with `validate`/`render`. Only call `buildTemplateData` once
  the plan is known-valid.

- **Print with `JSON.stringify(data, null, 2)`,** matching the existing
  `schema` command's output style, so the result is easy to read and to
  pipe into other tools (`| jq`, redirect to a file, diff between plan
  revisions).

- **Export `buildTemplateData` from `packages/core/src/index.ts`.** The
  CLI already only imports from `../src` (the package root), never from
  `../src/renderer` directly; `inspect` needs the same access pattern as
  `render`, `validateData`, etc.

## Risks / Trade-offs

- [Widening `buildTemplateData`'s exposure as public API] → acceptable;
  it's a pure function with no side effects, and exporting it is no
  riskier than the existing `render`/`validateData` exports.
