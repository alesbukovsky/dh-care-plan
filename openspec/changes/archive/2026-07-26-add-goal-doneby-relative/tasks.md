## 1. Plan schema fix

- [x] 1.1 Fix `Goal.doneBy` in `packages/core/src/schema/plan.ts` to
      `z.object({ date: z.iso.date().optional(), relative:     z.string().optional() }).optional()` (currently an
      invalid raw object literal, not wrapped in `z.object`, and not itself marked optional)
- [x] 1.2 Add/update `Goal.doneBy` unit tests (or a plan-schema test) for: no `doneBy`, `date` only, `relative` only,
      both given

## 2. Config schema

- [x] 2.1 Add a nested `goal: { doneBy: z.string() }` object to the `Format` object in
      `packages/core/src/schema/config.ts`
- [x] 2.2 Add `format.goal.doneBy: "{date}, {relative}"` to `DEFAULT_CONFIG`
- [x] 2.3 Update/add config unit tests covering `format.goal.doneBy` presence in `DEFAULT_CONFIG`, `getConfigSample()`,
      and `validateConfig` (rejecting a config missing `format.goal.doneBy`)

## 3. Renderer: goal doneBy assembly

- [x] 3.1 Add a helper in `packages/core/src/renderer.ts` (or `packages/core/src/format.ts`) that takes a `Goal`'s
      `doneBy` ( `{ date?, relative? } | undefined`) and a `Config`, and returns: `undefined` when neither is present,
      the single formatted/verbatim value when only one is present, or `config.format.goal.doneBy` with
      `{date}`/`{relative}` substituted when both are present
- [x] 3.2 Update `convertData` to use this helper for each goal's `doneBy` instead of the current single-ISO-date
      formatting call
- [x] 3.3 Update/add renderer unit tests for all four cases: no doneBy, date-only, relative-only, and both (verifying
      the exact combined string using `config.format.goal.doneBy`)

## 4. Samples and fixtures

- [x] 4.1 Update `getPlanSample()`/`getConfigSample()`-backing sample data (`packages/core/src/sampler.ts`) and any
      CLI/test fixture JSON that use the old single-ISO-string `Goal.doneBy` shape to the new `{ date }` (or
      `{ date, relative }`) object shape
- [x] 4.2 Update any CLI test fixtures (`packages/core/tests/cli/*`) that construct plans with `goals[].doneBy` as a
      bare string

## 5. Verification

- [x] 5.1 Run `bun test:core` and fix any failures surfaced by the `Goal.doneBy` shape fix or the new doneBy assembly
      logic
- [x] 5.2 Run `bun test:all` to confirm PWA still passes
- [x] 5.3 Type-check the core package (`tsc --noEmit`) to confirm the `Goal.doneBy` fix removes any type errors from the
      invalid raw object literal
