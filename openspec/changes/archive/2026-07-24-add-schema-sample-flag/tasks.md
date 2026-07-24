## 1. Sample data

- [x] 1.1 Add `getPlanSample(): Plan` to a new `packages/core/src/sampler.ts`
      module, covering every field: one met need with no optional fields,
      one unmet need with `relatedTo`, `evidencedBy`, and two goals (one
      with `doneBy`, one without)
- [x] 1.2 Add `getTemplateSample(): Template` to the same
      `packages/core/src/sampler.ts` module (kept together with
      `getPlanSample` rather than split across `plan.ts`/`template.ts`,
      for discoverability), deriving it via
      `buildTemplateData(getPlanSample())` imported from `renderer.ts` —
      no circular import, since `renderer.ts` never imports from
      `sampler.ts`
- [x] 1.3 Export `getPlanSample` and `getTemplateSample` from
      `packages/core/src/index.ts`

## 2. CLI flag

- [x] 2.1 Add a `--sample` boolean flag to the `schema` command in
      `packages/core/cli/dhplan.ts`
- [x] 2.2 When `--sample` is set, print `getPlanSample()` /
      `getTemplateSample()` (per `<type>`) as formatted JSON instead of
      the JSON Schema document

## 3. Tests

- [x] 3.1 Add unit tests validating `Plan.parse(getPlanSample())` and
      `Template.parse(getTemplateSample())` succeed
- [x] 3.2 Add CLI tests covering: `schema plan --sample`, `schema
      template --sample`, and confirming `schema <type>` without the flag
      still prints the JSON Schema document
- [x] 3.3 Run `bun test:core` and confirm it passes
