## Context

`packages/core/src/schema/plan.ts` and `packages/core/src/schema/template.ts`
each define zod object schemas and currently register the plan-schema ones
on `z.globalRegistry` with an `id` (`Goal`, `Need`, `MetNeed`, `UnmetNeed`).
`packages/core/cli/dhplan.ts`'s `schema` command calls
`z.toJSONSchema(Plan)` / `z.toJSONSchema(Template)` directly. Any
object with an `id` in the registry consulted by `toJSONSchema` gets
extracted to `$defs` instead of inlined — this already happens today via
`z.globalRegistry`, but a single shared, global id namespace means
`plan.ts` and `template.ts` must coordinate on unique ids forever, and nothing
stops a same-named-but-different object in `template.ts` from colliding with
one in `plan.ts` if both ever get converted in the same `toJSONSchema` call
(e.g. a future combined-docs command). We also currently have no per-schema
JSON Schema `$id`.

Before writing the tasks, this design was validated directly against the
installed `zod@4.4.3` source
(`node_modules/.bun/zod@4.4.3/.../core/to-json-schema.js` and
`json-schema-processors.js`), because zod's `external` option behaves
differently than its name suggests and than the proposal originally assumed.

### What `external` actually does (verified against source + runtime output)

zod v4 offers two distinct, non-combinable mechanisms:

1. **`toJSONSchema(schema, { metadata: registry })`** — swaps which registry
   is consulted for `id` metadata (defaults to `z.globalRegistry`). Any
   registered object still gets extracted to a local `$defs` entry with an
   in-document `$ref` (`#/$defs/Name`), exactly like today's global-registry
   behavior, just scoped to whatever registry instance you pass in. Verified
   output:

   ```json
   { "type": "object", "properties": { "needs": { "items": { "$ref": "#/$defs/MetNeed" } } },
     "$defs": { "MetNeed": { ... } } }
   ```

2. **`toJSONSchema(schema, { external: { registry, uri } })`** — intended
   for splitting a registry's schemas across *multiple linked documents*.
   Confirmed by direct source read (`to-json-schema.js` `finalize()`,
   `if (ctx.external) { }` — an intentionally empty branch) that **when
   `external` is set at all, `$defs`/`definitions` is never written to the
   single-schema result, unconditionally.** Objects found in the external
   registry instead become bare `$ref`s to an external URI
   (`plan.json#/$defs/MetNeed`) with no matching `$defs` entry in the
   document — they're meant to be resolved against a separately generated
   document, not inlined. Setting the root's `$id` is *only* possible via
   `external.uri` (`finalize()` line ~314), and doing so forces this
   non-`$defs` behavior. Verified output when `Schema` and `MetNeed` are
   both registered on the external registry:

   ```json
   { "$id": "plan.json#/$defs/Plan",
     "properties": { "needs": { "items": { "$ref": "plan.json#/$defs/MetNeed" } } } }
   ```

   — no `$defs` block at all, `MetNeed`'s shape is unresolvable from this
   document alone.

So the proposal's original idea of using `external` to get *both* `$defs`
extraction *and* a document `$id` in one call is not achievable in
`zod@4.4.3` — the two are mutually exclusive in a single-document
`toJSONSchema` call. (The registry-as-input form,
`toJSONSchema(registry, params)`, produces one fully-separate document per
registered id with cross-document refs — a different shape than
`getPlanSchema()`/`getTemplateSchema()` returning one document each — and
was not pursued further since it changes the CLI's output shape.)

## Goals / Non-Goals

**Goals:**

- Each of `plan.ts` / `template.ts` owns its own zod registry instance, so
  object ids never need to be coordinated between the two files.
- `dhplan schema plan` / `dhplan schema template` output keeps using
  `$defs` + in-document `$ref`s for readability (already true today via
  `z.globalRegistry`; must not regress).
- Each schema's JSON Schema document carries its own `$id`.
- `getPlanSchema()` / `getTemplateSchema()` become the single place that
  builds the JSON Schema document for each schema, so the CLI (and any
  future consumer) doesn't need to know about registries at all.

**Non-Goals:**

- Splitting `plan-schema` / `template-schema` output across multiple linked
  JSON Schema documents (the `external`-as-multi-document-generator use
  case). Not needed while each CLI command prints one self-contained
  document.
- Changing `validateData` / `validateTemplate`, which parse/validate with
  the zod schemas directly and never touch JSON Schema generation.
- Populating `template.ts` with real fields — it stays the existing
  placeholder; this change only gives it the same registry/`getTemplateSchema`
  scaffolding `plan.ts` gets, so template fields added later automatically
  follow the same pattern.

## Decisions

- **Use `{ metadata: localRegistry }`, not `{ external: { registry, uri } }`,
  to build each document.** This is the load-bearing deviation from the
  literal `external`-based ask in the proposal — see "What `external`
  actually does" above. `metadata` gets us local `$defs` extraction scoped
  to a private registry (satisfying the "separate ids" and "no inlining"
  goals) without the `external` mechanism's document-splitting behavior.
- **Set the document `$id` by assigning it directly on the object
  `toJSONSchema` returns**, built from a shared base URI plus a
  `<schema-name>.schema.json` filename, e.g.

  ```ts
  // schema/common.ts — no trailing slash, for readability when the
  // constant is referenced/logged on its own
  export const SCHEMA_BASE_URI = "https://github.com/alesbukovsky/dh-care-plan/schema";

  // schema/plan.ts — the "/" separator is added at the join site instead
  const json = z.toJSONSchema(Plan, { metadata: registry });
  return { $id: `${SCHEMA_BASE_URI}/plan.schema.json`, ...json };
  ```

  placing `$id` first so it appears before `$schema`/`type` in the printed
  output, matching conventional JSON Schema document ordering. This is a
  plain object literal, not a zod API call — `$id` is just a JSON Schema
  keyword and doesn't require zod's involvement once we've decided not to
  use `external`. `SCHEMA_BASE_URI` lives in a new `schema/common.ts` so
  `plan.ts` and `template.ts` share one base URI instead of duplicating the
  literal.
- **One local registry per schema file, module-scoped (not exported), named
  simply `registry`.** `plan.ts` keeps a `const registry = z.registry()` at
  module scope, registers `Goal`, `Need`, `MetNeed`, `UnmetNeed` on it
  (replacing the `z.globalRegistry.add(...)` calls), and exposes only
  `getPlanSchema(): object` (returning the finalized JSON Schema document).
  `template.ts` mirrors this with its own module-scoped `registry` /
  `getTemplateSchema()`. Since each file's `registry` is local and
  unexported, the plain name doesn't collide across files and avoids
  redundant `plan`/`template` prefixing. Keeping it unexported also avoids
  any temptation for `validator.ts` or the CLI to reach into it directly —
  `getPlanSchema`/`getTemplateSchema` are the only public surface for JSON
  Schema generation.
- **`Plan` / `Template` (the zod types) stay exported as-is.**
  `validateData` / `validateTemplate` keep calling `.safeParse` on them
  directly; only JSON Schema generation moves behind the new functions.
- **CLI `schema` command calls `getPlanSchema()` / `getTemplateSchema()`
  instead of `z.toJSONSchema(...)` inline.** `dhplan.ts` no longer imports
  `z` for this path or needs to know registries exist.

## Risks / Trade-offs

- [Existing test `dhplan-schema.test.ts` may assert on exact JSON Schema
  output shape (e.g. absence of `$id`, or exact key ordering)] → Update the
  test alongside the implementation to expect the new `$id` field; this is
  called out explicitly in tasks so it isn't missed.
- [Manually splicing `$id` onto the result via object-spread is a slightly
  unusual pattern compared to letting a library set it] → It's one line per
  `get*Schema()` function and is documented inline with a short comment
  pointing at why (`external` can't do both); acceptable given zod doesn't
  offer a combined API in this version.
- [Choosing a concrete `$id` URI value is somewhat arbitrary since this
  project has no dedicated published schema host yet] → Use the repo's own
  GitHub URL as the base (`https://github.com/alesbukovsky/dh-care-plan/schema`,
  no trailing slash, centralized in `schema/common.ts` as
  `SCHEMA_BASE_URI`), combined with a `/<name>.schema.json` filename per
  schema (`/plan.schema.json`, `/template.schema.json`) joined at the call
  site; this can be revisited if schemas are ever published under a
  different, dedicated host.
- [Future zod upgrades could change `external`/`metadata` semantics] → The
  reasoning above is pinned to `zod@4.4.3` (the version currently
  installed); re-verify against source if the zod dependency is bumped and
  registry/JSON-Schema behavior seems to shift.

## Migration Plan

No data migration; this is an internal refactor of schema-file internals
and the CLI's `schema` command. Steps: add registries + `get*Schema()` to
both schema files, switch the CLI to call them, update the existing CLI
schema test's expectations, run the full test suite.

## Open Questions

(none — resolved: `$id` is `SCHEMA_BASE_URI` + `<name>.schema.json`, see
Decisions above)
