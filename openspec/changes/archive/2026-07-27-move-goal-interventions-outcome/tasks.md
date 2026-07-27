## 1. Plan schema (`packages/core/src/schema/plan.ts`)

- [x] 1.1 Add `interventions` (`z.array(z.string()).optional()`) and `outcome` (`Outcome`, required) to `Goal`
- [x] 1.2 Remove `interventions` and `outcome` from `Need`
- [x] 1.3 Update `packages/core` tests/fixtures that construct a `Need`/`Goal` to the new shape

## 2. Template schema (`packages/core/src/schema/template.ts`)

- [x] 2.1 Add `interventions` (`z.array(z.string()).optional()`) and `outcome` (`Outcome`, required) to the template
      `Goal` (within `Statement.goals`)
- [x] 2.2 Remove `interventions` and `outcome` from `Statement`

## 3. Converter (`packages/core/src/converter.ts`)

- [x] 3.1 Move the `interventions ?? []` mapping from the statement level into the per-goal map, reading from
      `goal.interventions` instead of `need.interventions`
- [x] 3.2 Move the `outcome` mapping (`config.mapping.outcome[status]` + `note`) from the statement level into the
      per-goal map, reading from `goal.outcome` instead of `need.outcome`
- [x] 3.3 Update `packages/core` converter tests to cover: interventions/outcome now living on each rendered goal, and
      two goals on one statement carrying independent interventions/outcome

## 4. Sample data (`packages/core/src/sampler.ts`)

- [x] 4.1 Move the sample `interventions`/`outcome` values from need level onto the relevant goal(s)

## 5. PWA plan editor (`packages/pwa/src/components/NeedCard.tsx`)

- [x] 5.1 Move the outcome toggle buttons ("Goal is met"/"Goal is unmet") into each goal's block, reading/writing
      `goal.outcome.status` instead of `need.outcome.status`
- [x] 5.2 Move the interventions list (add/edit/remove) into each goal's block, reading/writing `goal.interventions`
      instead of `need.interventions`
- [x] 5.3 Move the evaluation note field into each goal's block, reading/writing `goal.outcome.note`
- [x] 5.4 Update `addGoal()` to initialize new goals with `outcome: { status: "unmet" }`
- [x] 5.5 Update `packages/pwa` tests (`App.test.tsx` and any `NeedCard` tests) for the new per-goal editing UI — no
      changes needed; the existing `App.test.tsx` doesn't construct need/goal fixtures directly

## 6. Verification and archive

- [x] 6.1 Run `bun test:all` and fix any failures
- [x] 6.2 Run `bun lint:fix`
- [x] 6.3 Exercise the PWA plan editor (add a need with two goals, set different outcomes/interventions/notes per
      goal, confirm each goal's state is independent) — verified two ways: (1) live in a real browser via the
      `agent-browser` CLI against the running Vite dev server (added two goals, set goal 1 met with an intervention
      and note, goal 2 unmet with a different task and note, screenshot confirmed no cross-goal bleed), and (2) an
      automated interaction test (`packages/pwa/src/components/NeedCard.test.tsx`) using `@testing-library/react` +
      `fireEvent` covering the same flow for regression coverage
- [ ] 6.4 Run `/opsx:archive` to sync specs and archive the change once implementation is complete
