## 1. Template schema (`packages/core/src/schema/template.ts`)

- [x] 1.1 Confirm/finalize `Assessment` as
      `{ need: z.string(), unmet: z.string(), relatedTo: z.string().optional(),     evidencedBy: z.string().optional() }`
      (already partially staged — verify no stray `isMet` field remains) — verified: already matches target shape
      exactly, no changes needed

## 2. Config schema (`packages/core/src/schema/config.ts`)

- [x] 2.1 Add an `Unmet` object (`z.object({ met: z.string(), unmet: z.string() })`) and add it to `Mapping` as
      `unmet: Unmet`
- [x] 2.2 Add `mapping.unmet: { met: "No", unmet: "Yes" }` to `DEFAULT_CONFIG`

## 3. Converter (`packages/core/src/converter.ts`)

- [x] 3.1 Change the `assessments` mapping to derive `unmet` from
      `config.mapping.unmet[need.isMet ? "met" :     "unmet"]` instead of copying `need.isMet`
- [x] 3.2 Add `relatedTo: need.relatedTo` and `evidencedBy: need.evidencedBy` to each assessment (copied verbatim, NOT
      defaulted to `""` — unlike the `Statement` handling of the same source fields)

## 4. Tests

- [x] 4.1 Update `packages/core/tests/converter.test.ts`'s "maps every need to an assessment, preserving order"
      assertion: replace `isMet` with `unmet` (`DEFAULT_CONFIG.mapping.unmet.met`/`.unmet` per need), and add
      `relatedTo`/`evidencedBy` expectations (`undefined` for the met need, real values for the unmet need)
- [x] 4.2 Add a converter test asserting `assessment.unmet` uses a custom `config.mapping.unmet` when one is supplied,
      not the default
- [x] 4.3 Add a converter test asserting a `Need` with no `relatedTo`/`evidencedBy` produces an assessment with both
      `undefined` (not empty string)
- [x] 4.4 Update `packages/core/tests/cli/dhplan-inspect.test.ts`'s expected JSON output: replace `isMet` with `unmet`
      (`DEFAULT_CONFIG.mapping.unmet.met`/`.unmet`), and add `relatedTo`/`evidencedBy` to the assessment for the unmet
      fixture need (which already has `relatedTo`/`evidencedBy` on its `Need`)

## 5. Follow-up adjustments (post-implementation feedback)

- [x] 5.1 Rename `Assessment.unmet` to `Assessment.isUnmet` (`template.ts`), `Config.mapping.unmet` to
      `Config.mapping.isUnmet` (`config.ts`, including the internal `Unmet` → `IsUnmet` type name), and `convertData`'s
      corresponding lookup (`converter.ts`) — updated all affected tests (`converter.test.ts`, `dhplan-inspect.test.ts`)
- [x] 5.2 Add a default `nullGetter: () => ""` to `createTemplater` (`templater.ts`), so any real render (not just
      `validateTemplate`'s inspection pass) treats `undefined`/`null` tag values as empty strings; removed the
      now-redundant explicit `nullGetter` from `validateTemplate` (`validator.ts`)

## 6. Follow-up adjustments round 2 (generic boolean formatter)

- [x] 6.1 Replace `Config.mapping.isUnmet: { met, unmet }` with a generic
      `Config.format.boolean: { true: z.string(),     false: z.string() }` (`config.ts`) — a formatter for any boolean
      value, not specific to `isUnmet`; removed the `IsUnmet` type and its `Mapping.isUnmet` field entirely
- [x] 6.2 Update `DEFAULT_CONFIG.format.boolean` to `{ true: "Yes", false: "No" }`
- [x] 6.3 Add a `boolStr(value: boolean, config: Config): string` helper in `converter.ts` and derive
      `assessment.isUnmet` from `boolStr(!need.isMet, config)` instead of the old `mapping.isUnmet` lookup
- [x] 6.4 Update `converter.test.ts` and `dhplan-inspect.test.ts` assertions to reference
      `DEFAULT_CONFIG.format.     boolean.true`/`.false` (mapped through `!isMet`) instead of
      `DEFAULT_CONFIG.mapping.isUnmet.met`/`.unmet`, and update the custom-config test to override `format.boolean`
      instead of `mapping.isUnmet`

## 7. Verification

- [x] 7.1 Run `bun test:all` and fix any failures
- [x] 7.2 Run `bun lint:fix`
- [ ] 7.3 Run `/opsx:archive` to sync specs and archive the change once implementation is complete
