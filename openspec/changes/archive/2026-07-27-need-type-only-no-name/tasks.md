## 1. Plan schema (`packages/core/src/schema/plan.ts`)

- [x] 1.1 Remove `name: z.string()` from `Need` — `Need` keeps only `type`, `isMet`, `relatedTo`, `evidencedBy`, `goals`

## 2. Converter (`packages/core/src/converter.ts`)

- [x] 2.1 Change the `assessments` mapping's `need` field from `need.name` to `config.mapping.need[need.type]`, matching
      how `statement.need` is already derived

## 3. Sample data (`packages/core/src/sampler.ts`)

- [x] 3.1 Remove `name` from both sample needs in `getPlanSample()`

## 4. PWA plan editor (`packages/pwa/src/components/NeedCard.tsx`)

- [x] 4.1 Remove `name: definition.name` from the `Need` object constructed in `setStatus()`

## 5. Tests

- [x] 5.1 Remove `name` from every `Need` fixture in `packages/core/tests/converter.test.ts`,
      `packages/core/tests/plan.test.ts`, `packages/core/tests/validator.test.ts`,
      `packages/core/tests/renderer.test.ts`, `packages/core/tests/cli/dhplan-inspect.test.ts`,
      `packages/core/tests/cli/dhplan-render.test.ts`, and `packages/core/tests/cli/dhplan-validate.test.ts` (note:
      unrelated `"name"` references in `validator.test.ts`/`dhplan-validate.test.ts` that test an undefined `{name}`
      docx template tag are NOT part of this — left those alone)
- [x] 5.2 Update `converter.test.ts`'s "maps every need to an assessment, preserving order" assertion so each
      `assessment.need` expects `DEFAULT_CONFIG.mapping.need[type]` instead of the old free-text `name`
- [x] 5.3 Replace `converter.test.ts`'s "maps a statement's need from the config's mapping.need labels, not the plan's
      free-text name" test (which relies on constructing a `Need` with a `name` that disagrees with the mapping — no
      longer possible) with a test asserting both `assessment.need` and `statement.need` come from
      `config.mapping.need[need.type]` for the same need
- [x] 5.4 Update any CLI fixture test (`dhplan-inspect.test.ts`, `dhplan-render.test.ts`) whose expected JSON output
      asserts `assessments[].need` as a free-text `name` value, to expect the corresponding
      `DEFAULT_CONFIG.mapping.need` label instead

## 6. Verification

- [x] 6.1 Run `bun test:all` and fix any failures
- [x] 6.2 Run `bun lint:fix` (also fixed 8 pre-existing `noNonNullAssertion` warnings in
      `packages/pwa/src/components/NeedCard.test.tsx`, unrelated to this change but now blocking `lint:ts`'s
      `--error-on-warnings`, via a small `required()` helper)
- [ ] 6.3 Run `/opsx:archive` to sync specs and archive the change once implementation is complete
