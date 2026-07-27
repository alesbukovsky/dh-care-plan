## Why

`packages/core/src/renderer.ts` currently mixes two unrelated concerns: the pure `Plan` → `Template` data-mapping logic
(`convertData` and its private helpers `goalLabel`, `orEmpty`, `goalDoneBy`) and the I/O-adjacent orchestration of
turning a plan and a `.docx` template into rendered bytes (`render()`: validate, parse, invoke docxtemplater, produce
output). As the mapping logic keeps growing (date formatting, then the goal `doneBy` date/relative assembly), it
increasingly crowds out the orchestration code it shares a file with. Separately, `packages/core/src/format.ts` (the
`dateStr` token formatter) exists solely to support this same mapping logic and has no other caller — it belongs with
`convertData`, not as its own top-level module. Separating the mapping/formatting code from `renderer.ts` (and folding
`format.ts` into it) keeps each file focused and keeps future formatting-only changes from touching render-orchestration
code (and vice versa).

## What Changes

- Extract `convertData` and its private helpers (`goalLabel`, `orEmpty`, `goalDoneBy`) out of
  `packages/core/src/renderer.ts` into a new `packages/core/src/converter.ts` module.
- Fold `packages/core/src/format.ts` (`dateStr`) into `packages/core/src/converter.ts` as a private helper; `format.ts`
  is removed. `dateStr` is not part of the package's public API (not exported from `packages/core/src/index.ts`), so
  this has no external impact.
- `packages/core/src/renderer.ts` keeps only `render()` (validation, parsing, invoking `convertData`, and running
  docxtemplater), importing `convertData` from `./converter`.
- Update `packages/core/src/sampler.ts` and `packages/core/src/index.ts` to import/re-export `convertData` from
  `./converter` instead of `./renderer`.
- No behavior change: `convertData`'s signature, defaults, and output are unchanged — this is a pure module-boundary
  refactor.

## Capabilities

### New Capabilities

- `converter`: owns `convertData` — the pure `Plan` → `Template` data-mapping/formatting logic, moved out of the
  `renderer` capability.

### Modified Capabilities

- `renderer`: the "`render()` converts Plan to template data..." requirement (covering `convertData`'s
  mapping/formatting behavior) is removed from this capability and now lives under `converter`; `renderer`'s remaining
  requirements are updated to reference `convertData` as an imported dependency rather than defining its behavior
  inline.

## Impact

- `packages/core/src/converter.ts`: new file — `convertData`, `goalLabel`, `orEmpty`, `goalDoneBy` moved here unchanged,
  plus `dateStr` folded in from `format.ts` as a private (unexported) helper.
- `packages/core/src/format.ts`: removed; its sole export (`dateStr`) moves into `converter.ts`.
- `packages/core/src/renderer.ts`: loses `convertData` and its helpers; gains an import of `convertData` from
  `./converter`.
- `packages/core/src/sampler.ts`: import path for `convertData` changes from `./renderer` to `./converter`.
- `packages/core/src/index.ts`: re-export of `convertData` changes from `./renderer` to `./converter`.
- Tests: `convertData` tests move from `packages/core/tests/renderer.test.ts` to a new
  `packages/core/tests/converter.test.ts`; `renderer.test.ts` keeps only `render()` tests.
  `packages/core/tests/format.test.ts`'s `dateStr` tests fold into `converter.test.ts` (testing it via the `converter`
  module's internal behavior, or as an inline test of the folded-in helper — see design.md).
- No public API change — `convertData` and `render` are both still exported from `packages/core/src/index.ts` with
  identical signatures; `dateStr` was never part of the public API.
