## 1. Extract converter.ts

- [x] 1.1 Create `packages/core/src/converter.ts` containing
      `convertData` and its private helpers (`goalLabel`,
      `orEmpty`, `goalDoneBy`), moved verbatim from
      `packages/core/src/renderer.ts` (no behavior change)
- [x] 1.2 Fold `dateStr` from `packages/core/src/format.ts` into
      `converter.ts` as a named export (not re-exported from
      `index.ts`); delete `format.ts`
- [x] 1.3 Remove `convertData` and its private helpers from
      `packages/core/src/renderer.ts`; import `convertData` from
      `./converter` instead

## 2. Update dependent imports

- [x] 2.1 Update `packages/core/src/sampler.ts` to import
      `convertData` from `./converter` instead of `./renderer`
- [x] 2.2 Update `packages/core/src/index.ts` to re-export
      `convertData` from `./converter` instead of `./renderer`

## 3. Split tests

- [x] 3.1 Create `packages/core/tests/converter.test.ts` containing the
      existing `convertData` describe block moved from
      `packages/core/tests/renderer.test.ts`, importing from
      `../src/converter`
- [x] 3.2 Fold `packages/core/tests/format.test.ts`'s `dateStr` tests
      into `converter.test.ts` (importing `dateStr` from
      `../src/converter`); delete `format.test.ts`
- [x] 3.3 Trim `packages/core/tests/renderer.test.ts` down to only the
      `render()` describe block

## 4. Verification

- [x] 4.1 Run `bun test:core` and confirm all tests still pass with no
      behavior change
- [x] 4.2 Run `bun test:all` to confirm PWA still passes
- [x] 4.3 Type-check the core package (`tsc --noEmit`)
- [x] 4.4 Run the formatter/linter (`biome check`) over the touched files
