## 1. Config schema (`packages/core/src/schema/config.ts`)

- [x] 1.1 Add `appointments: z.string()` to `Format` — a plain separator string, not a substitution pattern, so no
      wrapping object
- [x] 1.2 Add `format.appointment: ", "` to `DEFAULT_CONFIG`

## 2. Template schema (`packages/core/src/schema/template.ts`)

- [x] 2.1 Change `appointments` from `z.array(z.string())` to `z.string()`

## 3. Converter (`packages/core/src/converter.ts`)

- [x] 3.1 Change the `appointments` mapping from `plan.appointments.map((date) => dateStr(date, config.format.date))` to
      formatting each date the same way, then joining the results with `config.format.appointment`
      (`Array.prototype.join`)

## 4. Tests

- [x] 4.1 Update `packages/core/tests/converter.test.ts` assertions on `data.appointments` (currently
      `["07/01/2026", "08/01/2026"]`-style arrays) to the joined-string form (e.g. `"07/01/2026, 08/01/2026"`)
- [x] 4.2 Add a converter test for a custom `format.appointment` separator (e.g. `" / "`) producing a differently joined
      string
- [x] 4.3 Add a converter test for an empty `plan.appointments` array producing `""`
- [x] 4.4 Update `packages/core/tests/renderer.test.ts` and any other fixtures/tests that construct
      `Template.appointments` as an array to the new joined-string shape — no change needed; `renderer.test.ts`'s
      `appointments` fixture is `Plan.appointments` (still an array), and no test constructs a `Template` object
      directly
- [x] 4.5 Update `packages/core/tests/cli/dhplan-inspect.test.ts` fixture expecting `appointments: ["07/01/2026"]` (or
      similar) to the joined-string shape

## 5. Verification

- [x] 5.1 Run `bun test:all` and fix any failures
- [x] 5.2 Run `bun lint:fix`
- [ ] 5.3 Run `/opsx:archive` to sync specs and archive the change once implementation is complete
