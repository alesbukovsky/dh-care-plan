#!/usr/bin/env bun
import { runCli } from "./program";

// Set rather than exited on, so piped output is flushed before the process ends.
process.exitCode = await runCli(process.argv.slice(2), {
	write: (text) => process.stdout.write(text),
	writeError: (text) => process.stderr.write(text),
});
