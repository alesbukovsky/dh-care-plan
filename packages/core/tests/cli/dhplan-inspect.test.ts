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
			patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
			appointments: ["2026-07-01"],
			needs: [
				{ name: "flossing", isMet: true, outcome: { status: "met" } },
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }],
					outcome: { status: "unmet" },
				},
			],
		}),
	);
	await Bun.write(join(dir, "malformed-plan.json"), "{ not json");

	await Bun.write(
		join(dir, "valid-mapping.json"),
		JSON.stringify({
			outcomeStatus: { met: "Achieved", partial: "In progress", unmet: "Pending" },
		}),
	);
	await Bun.write(
		join(dir, "invalid-mapping.json"),
		JSON.stringify({ outcomeStatus: { unmet: "Pending" } }),
	);
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe("dhplan inspect", () => {
	test("prints the template data for a valid plan", async () => {
		const { stdout, exitCode } = await runCli(["inspect", join(dir, "valid-plan.json")]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual({
			patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
			appointments: ["2026-07-01"],
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
					interventions: [],
					outcome: { label: "Not met" },
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

	test("prints template data using a valid --mapping override file", async () => {
		const { stdout, exitCode } = await runCli([
			"inspect",
			join(dir, "valid-plan.json"),
			"--mapping",
			join(dir, "valid-mapping.json"),
		]);

		expect(exitCode).toBe(0);
		const data = JSON.parse(stdout);
		expect(data.statements[0]?.outcome).toEqual({ label: "Pending" });
	});

	test("an invalid --mapping override file reports issues without printing template data", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"inspect",
			join(dir, "valid-plan.json"),
			"--mapping",
			join(dir, "invalid-mapping.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});
});
