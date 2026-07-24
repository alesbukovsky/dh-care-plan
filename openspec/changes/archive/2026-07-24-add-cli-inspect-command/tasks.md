## 1. Core export

- [x] 1.1 Export `buildTemplateData` from `packages/core/src/index.ts`

## 2. CLI command

- [x] 2.1 Add an `inspect <plan>` command to `packages/core/cli/dhplan.ts`
      that reads the plan file, validates it with `validateData`, and on
      failure prints issues to stderr and exits non-zero (mirroring
      `validate`/`render`)
- [x] 2.2 On success, parse the plan, call `buildTemplateData`, and print
      the result via `JSON.stringify(data, null, 2)` to stdout

## 3. Tests

- [x] 3.1 Add CLI tests covering: valid plan (prints expected template
      JSON, exit 0), invalid plan (prints issues to stderr, exit non-zero,
      no template JSON printed), unreadable plan file
- [x] 3.2 Run `bun test:core` and confirm it passes
