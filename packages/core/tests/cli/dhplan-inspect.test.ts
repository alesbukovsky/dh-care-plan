import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "./run-cli";

let dir: string;

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), "dhplan-inspect-"));

	await Bun.write(
		join(dir, "valid-plan.json"),
		JSON.stringify({
			needs: [
				{ name: "flossing", isMet: true },
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }],
				},
			],
		}),
	);
	await Bun.write(join(dir, "malformed-plan.json"), "{ not json");
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe("dhplan inspect", () => {
	test("prints the template data for a valid plan", async () => {
		const { stdout, exitCode } = await runCli(["inspect", join(dir, "valid-plan.json")]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual({
			assessments: [
				{ need: "flossing", isMet: true },
				{ need: "brushing", isMet: false },
			],
			statements: [
				{
					need: "brushing",
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ label: "1a", task: "floss daily" }],
				},
			],
		});
	});

	test("reports plan issues without printing template data", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"inspect",
			join(dir, "malformed-plan.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});

	test("reports a read failure for a missing file", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"inspect",
			join(dir, "does-not-exist.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});
});
