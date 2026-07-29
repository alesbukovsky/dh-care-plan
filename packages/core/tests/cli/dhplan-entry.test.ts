import { describe, expect, test } from "bun:test";
import { getPlanSchema } from "../../src";
import { runCliProcess } from "./run-cli";

// The rest of the CLI tests run the program in-process; these run the real
// entry point, which is the only place the exit code and the streams are wired.
describe("dhplan entry point", () => {
	test("a successful command prints to stdout and exits zero", async () => {
		const { stdout, stderr, exitCode } = await runCliProcess(["schema", "plan"]);

		expect(exitCode).toBe(0);
		expect(stderr).toBe("");
		expect(JSON.parse(stdout)).toEqual(getPlanSchema());
	});

	test("a failing command prints to stderr and exits non-zero", async () => {
		const { stdout, stderr, exitCode } = await runCliProcess(["validate", "plan", "no-such-file"]);

		expect(exitCode).not.toBe(0);
		expect(stdout).toBe("");
		expect(stderr).toContain("Failed to read no-such-file");
	});

	test("no arguments prints help and exits non-zero", async () => {
		const { stdout, exitCode } = await runCliProcess([]);

		expect(exitCode).not.toBe(0);
		expect(stdout).toContain("Usage:");
	});
});
