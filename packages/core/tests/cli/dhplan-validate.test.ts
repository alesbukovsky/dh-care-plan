import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../../src/schema/config";
import { buildDocx } from "../helpers/docx-fixture";
import { runCli } from "./run-cli";

let dir: string;

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), "dhplan-validate-"));

	await Bun.write(
		join(dir, "valid-data.json"),
		JSON.stringify({
			patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
			appointments: ["2026-07-01"],
			needs: [
				{ type: "maintenance", name: "flossing", isMet: true, outcome: { status: "met" } },
				{
					type: "integrity",
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
	await Bun.write(join(dir, "malformed-data.json"), "{ not json");
	await Bun.write(join(dir, "not-an-object.json"), JSON.stringify("just a string"));

	await Bun.write(
		join(dir, "valid-config.json"),
		JSON.stringify({
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending" },
			},
		}),
	);
	await Bun.write(
		join(dir, "invalid-config.json"),
		JSON.stringify({ mapping: { outcome: { met: "Achieved" } } }),
	);

	await Bun.write(
		join(dir, "no-tags.docx"),
		buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>"),
	);
	await Bun.write(
		join(dir, "with-tag.docx"),
		buildDocx("<w:p><w:r><w:t>Hello {name}</w:t></w:r></w:p>"),
	);
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe("dhplan validate plan", () => {
	test("a JSON object matching Plan's shape is valid", async () => {
		const { stdout, exitCode } = await runCli(["validate", "plan", join(dir, "valid-data.json")]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("is valid");
	});

	test("malformed JSON is invalid", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"validate",
			"plan",
			join(dir, "malformed-data.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});

	test("a non-object value is invalid", async () => {
		const { exitCode } = await runCli(["validate", "plan", join(dir, "not-an-object.json")]);

		expect(exitCode).not.toBe(0);
	});
});

describe("dhplan validate template", () => {
	test("a template with no tags is valid", async () => {
		const { stdout, exitCode } = await runCli(["validate", "template", join(dir, "no-tags.docx")]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("is valid");
	});

	test("a template referencing an undefined tag is invalid", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"validate",
			"template",
			join(dir, "with-tag.docx"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("name");
		expect(stderr).toContain("not defined in Template");
	});
});

describe("dhplan validate config", () => {
	test("a JSON object matching Config is valid", async () => {
		const { stdout, exitCode } = await runCli([
			"validate",
			"config",
			join(dir, "valid-config.json"),
		]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("is valid");
	});

	test("a config file with a non-string label is invalid", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"validate",
			"config",
			join(dir, "invalid-config.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});
});

describe("dhplan validate", () => {
	test("an invalid type errors before reading the file", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"validate",
			"nonsense",
			join(dir, "does-not-exist.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("plan");
		expect(stderr).toContain("template");
		expect(stderr).toContain("config");
	});
});
