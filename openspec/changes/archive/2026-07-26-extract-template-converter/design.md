## Context

`renderer.ts` grew organically: it started as just `render()`, then `convertData` was added alongside it since both
dealt with turning a `Plan` into rendered output. Since then, `convertData` has picked up date formatting
(`format.date`) and goal `doneBy` date/relative assembly (`format.goal.doneBy`), each adding private helpers to the same
file. `render()` itself hasn't changed shape — it's still validate → parse → `convertData` → docxtemplater. The file now
has two independent reasons to change (a new formatting rule vs. a render/IO concern), which is the signal to split it.
Separately, `packages/core/src/format.ts` (`dateStr`) is a single-purpose helper with exactly one caller — `convertData`
— and no public export; it doesn't warrant its own top-level module once the mapping logic it serves has its own file.

## Goals / Non-Goals

**Goals:**

- Move `convertData` and its private helpers into their own module, named `converter.ts` (per discussion: it converts
  the natural, nested `Plan` model into the flattened `Template` model templates need).
- Fold `format.ts`'s `dateStr` into `converter.ts` as well, since it exists only to support `convertData`.
- Keep `renderer.ts` focused on orchestration: validating inputs, parsing the plan, delegating to `convertData`, and
  running docxtemplater.
- Zero behavior change — this is purely a module-boundary move.

**Non-Goals:**

- Renaming `convertData` itself, or changing its signature/return type.
- Splitting `render()` further, or touching `templater.ts` (`createTemplater`/`describeTemplaterError`), which is
  already correctly scoped to just wrapping docxtemplater.
- Any change to `Config`, `Plan`, or `Template` schemas.

## Decisions

- **New file name: `converter.ts`.** Considered `builder.ts` (too generic — doesn't say what it builds or from what),
  `template-builder.ts` (clearer but names the output, not the operation), `flatten.ts`/`flattener.ts` (precise —
  captures that the operation flattens `Plan`'s nested shape into `Template`'s flat shape — but "converter" was
  preferred as the more familiar/conventional term for a module that maps one model to another). Went with
  `converter.ts` per explicit preference.
- **New `converter` capability, not just an implementation-detail move under `renderer`.** The existing `renderer` spec
  names `packages/core/src/renderer.ts` directly in `convertData`'s requirement text, so relocating the function is a
  spec-level change, not just an internal refactor invisible to the spec. Splitting the capability also mirrors the file
  split: one capability's requirements per file/concern.
- **`goalLabel`, `orEmpty`, and `goalDoneBy` move with `convertData`, unexported.** They're private implementation
  details of the mapping logic, not part of `render()`'s orchestration, so they belong with the function that uses them.
- **`sampler.ts` and `index.ts` import `convertData` from `./converter` directly, not re-exported through
  `renderer.ts`.** Avoids an unnecessary indirection/re-export hop now that the function no longer lives in
  `renderer.ts`.
- **`dateStr` folds into `converter.ts` but stays exported from that module (just not from `index.ts`).** It has no
  other caller today, but it's a small, independently-testable pure function; keeping it as a named (non-default) export
  of `converter.ts` lets `converter.test.ts` unit-test it directly by name, the same way `format.test.ts` did, without
  forcing every test through `convertData`. `format.ts` itself is deleted since it would otherwise be a one-function
  file re-exporting from `converter.ts`, which adds an indirection with no benefit.

## Risks / Trade-offs

- **Import churn** (`sampler.ts`, `index.ts`, and both test files) → Mitigation: mechanical, low-risk changes;
  `bun test:core` and `tsc --noEmit` catch any missed import.
- **Spec capability split adds one more file under `openspec/specs/`** → Mitigation: consistent with how `mapping` →
  `config` was split earlier in this project; the capability boundary now matches the module boundary, which should make
  future spec deltas easier to scope correctly (a converter-only change shouldn't touch the renderer spec, and vice
  versa).

## Migration Plan

- No runtime migration — pure internal refactor, no persisted state, no public API change. `convertData` and `render`
  keep identical signatures and are both still exported from `packages/core/src/index.ts`.
