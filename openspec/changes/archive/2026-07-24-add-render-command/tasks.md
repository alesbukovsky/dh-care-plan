## 1. `renderer.ts`: core render pipeline

- [x] 1.1 Add `packages/core/src/renderer.ts` exporting a `RenderResult` type:
      `{ success: true; output: Uint8Array } | { success: false; issues: ValidationIssue[] }` (reusing `ValidationIssue`
      from `./validator`).
- [x] 1.2 Add `export function buildTemplateData(plan: Plan): Template` that returns `{}` unconditionally (scaffold for
      future plan→template computation).
- [x] 1.3 Add `export function render(planInput: ArrayBuffer, templateInput: ArrayBuffer): RenderResult` that: - Calls
      `validateData(planInput)`; if invalid, returns `{ success: false, issues }` immediately without touching
      `templateInput`. - Calls `validateTemplate(templateInput)`; if invalid, returns `{ success: false, issues }`. -
      Parses the plan buffer into a typed `Plan` (`Plan.parse(JSON.parse(new TextDecoder().decode(planInput)))`). -
      Calls `buildTemplateData(plan)` to get the template data. - Builds a docxtemplater instance via
      `createTemplater(templateInput)` and calls `doc.render(templateData)`, catching errors with
      `describeTemplaterError` and returning `{ success: false, issues: [{ path: "", message }] }` on failure. - On
      success, returns `{ success: true, output: doc.getZip().generate({ type: "uint8array" }) }`.

## 2. Remove `renderCarePlan.ts`

- [x] 2.1 Delete `packages/core/src/renderCarePlan.ts` (superseded by `renderer.ts`; no current callers reference it).

## 3. Update package exports

- [x] 3.1 In `packages/core/src/index.ts`, remove the `export { renderCarePlan } from "./renderCarePlan";` line and add
      `export { render } from "./renderer";` and `export type { RenderResult } from "./renderer";`.

## 4. Wire up the CLI `render` command

- [x] 4.1 In `packages/core/cli/dhplan.ts`, import `render` from `../src` alongside the existing imports.
- [x] 4.2 Add a `render` subcommand: `dhplan render <plan> <template> <output>` with a description, three positional
      `<plan>`/`<template>`/`<output>` arguments (no `Argument`/`choices` needed — these are file paths, not enum
      values).
- [x] 4.3 In the command's action: read `plan` and `template` via `Bun.file(...).arrayBuffer()`, printing a read-failure
      error and exiting non-zero (mirroring the existing `validate` command's read-error handling) if either read fails,
      without attempting to read the other or write `output`.
- [x] 4.4 Call `render(planBuffer, templateBuffer)`; on `{ success: false }`, print every issue to stderr (same
      `issue.path ? ... : ...` formatting as `validate`) and exit non-zero without writing `output`; on
      `{ success: true }`, `Bun.write(output,     result.output)`, print a success message to stdout, and exit `0`.
- [x] 4.5 Remove the commented-out placeholder `render` command block (and its commented-out `renderCarePlan` import)
      now that a real implementation replaces it.

## 5. Tests

- [x] 5.1 Add `packages/core/tests/renderer.test.ts` covering: plan validation failure short-circuits before touching
      the template; template validation failure after a valid plan; a successful render returns bytes for a template
      with no tags (since `buildTemplateData` currently returns `{}`); a docxtemplater render failure is reported as an
      issue rather than thrown.
- [x] 5.2 Add `packages/core/tests/cli/dhplan-render.test.ts` covering: successful render writes the output file and
      prints success; invalid plan file reports issues and doesn't write output; invalid template file reports issues
      and doesn't write output; a nonexistent input file path reports a read error and doesn't write output.
- [x] 5.3 Run the full test suite (`bun test`) and confirm it passes.

## 6. Verification

- [x] 6.1 Manually run `dhplan render <plan.json> <template.docx>     <out.docx>` against a valid plan/template pair
      (e.g. reusing or adapting an existing test fixture `.docx`) and confirm `out.docx` is written and opens as a valid
      `.docx`.
- [x] 6.2 `grep -rn "renderCarePlan"` across `packages/` and confirm no remaining references.

## 7. Unplanned: fix `packages/pwa` broken by the `renderCarePlan.ts` removal

- [x] 7.1 Discovered during 6.2: `packages/pwa/src/App.tsx` imported and called `renderCarePlan` directly (a stale
      prototype file-upload demo, predating the `Plan`/`Template` split — its `staticData` didn't match either schema).
      Removing `renderCarePlan.ts` broke `pwa`'s typecheck. Resolved by removing the dead demo feature: `App.tsx` now
      renders only the `Care Plan` heading, and the now-unused `packages/pwa/src/data.ts` (`staticData`) was deleted.
- [x] 7.2 Confirmed `bunx tsc --noEmit` is clean in `packages/pwa` and `bun run test:pwa` still passes (the existing
      heading-render test is unaffected).
