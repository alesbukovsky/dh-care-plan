## 1. Assessments mapping

- [x] 1.1 Map every `plan.needs` entry to an `Assessment` (`need.name` -> `need`, `need.isMet` -> `isMet`), preserving
      order

## 2. Statements mapping

- [x] 2.1 Filter `plan.needs` to unmet needs (`isMet === false`), preserving relative order
- [x] 2.2 Throw a descriptive error if an unmet need's `relatedTo` or `evidencedBy` is `undefined`
- [x] 2.3 Map each unmet need to a `Statement` (`need.name` -> `need`, `relatedTo` -> `relatedTo`, `evidencedBy` ->
      `evidencedBy`)
- [x] 2.4 Map each unmet need's `goals` to `Statement.goals` (`task`, `doneBy` 1:1) with a generated `label` of
      `<statement position><goal     letter>` (1-based statement position within `statements`, 0-based goal position
      within the statement rendered as `a`, `b`, `c`, ...)

## 3. Wire up and test

- [x] 3.1 Replace the `buildTemplateData` scaffold body in `packages/core/src/renderer.ts` with the assessments +
      statements mapping
- [x] 3.2 Add unit tests covering: mixed met/unmet needs, needs without goals, multi-goal label generation across
      multiple statements, and the missing-`relatedTo`/`evidencedBy` throw
- [x] 3.3 Run `bun test:core` and confirm it passes
