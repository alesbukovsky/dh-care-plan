## 0. `common.ts`: shared schema base URI

- [x] 0.1 Add `packages/core/src/schema/common.ts` exporting
      `SCHEMA_BASE_URI = "https://github.com/alesbukovsky/dh-care-plan/schema"` (no trailing slash — the `/` separator
      is added at each `$id` join site instead, for readability of the constant itself).

## 1. `plan.ts`: local registry + `getPlanSchema()`

- [x] 1.1 Replace the `z.globalRegistry.add(...)` calls for `Goal`, `Need`, `MetNeed`, `UnmetNeed` with a module-scoped
      `const registry =     z.registry()` (named `registry`, not `planRegistry` — it's local to the file) and
      `registry.add(...)` calls with the same ids.
- [x] 1.2 Add `export function getPlanSchema()` that calls `z.toJSONSchema(Plan, { metadata: registry })` and returns
      the result with a top-level `$id` of `` `${SCHEMA_BASE_URI}/plan.schema.json` `` (from `./common`) spliced in
      before the rest of the keys, per design.md's decision (do NOT use `external` — verified in design.md that it
      disables `$defs` extraction).
- [x] 1.3 Keep `Plan` exported as before; do not export `registry`.

## 2. `template.ts`: local registry + `getTemplateSchema()`

- [x] 2.1 Add a module-scoped `const registry = z.registry()` (empty registrations for now, since `Template` is still a
      placeholder).
- [x] 2.2 Add `export function getTemplateSchema()` mirroring `getPlanSchema()`:
      `z.toJSONSchema(Template, { metadata:     registry })` plus a top-level `$id` of
      `` `${SCHEMA_BASE_URI}/template.schema.json` ``.
- [x] 2.3 Keep `Template` exported as before; do not export `registry`.

## 3. Wire up CLI and package exports

- [x] 3.1 In `packages/core/src/index.ts`, export `getPlanSchema` from `./schema/plan` and `getTemplateSchema` from
      `./schema/template`.
- [x] 3.2 In `packages/core/cli/dhplan.ts`, change the `schema` command's action to call `getPlanSchema()` /
      `getTemplateSchema()` instead of `z.toJSONSchema(schema)`, and drop the now-unused `z` import if nothing else in
      the file needs it.

## 4. Tests

- [x] 4.1 Update `packages/core/tests/cli/dhplan-schema.test.ts`'s two passing-case assertions to compare against
      `getPlanSchema()` / `getTemplateSchema()` (imported from `../../src`) instead of calling `z.toJSONSchema(Plan)` /
      `z.toJSONSchema(Template)` inline, so the test doesn't hardcode the old inline-conversion behavior.
- [x] 4.2 Add a test asserting `getPlanSchema()`'s output has a `$defs` entry for at least one registered nested object
      (e.g. `MetNeed`) and that it's referenced via `$ref` rather than inlined, and that the document has a top-level
      `$id`.
- [x] 4.3 Run the full test suite (`bun test`) and confirm it passes.

## 5. Verification

- [x] 5.1 Run `bun run packages/core/cli/dhplan.ts schema plan` and `... schema template` manually; confirm both print a
      document with `$id` set and nested objects (for `plan`) under `$defs`.
- [x] 5.2 Confirm `plan.ts`'s and `template.ts`'s local `registry` instances both being able to register an object under
      the same id (e.g. `"Need"`) does not throw, by temporarily registering a same-named placeholder in `template.ts`'s
      registry during manual testing (revert before committing if `template.ts` shouldn't otherwise change).
