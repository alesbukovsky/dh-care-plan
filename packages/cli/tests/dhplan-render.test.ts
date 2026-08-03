import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "@dh-care-plan/core";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildDocx } from "./helpers/docx-fixture";
import { fileExists, writeFixture } from "./helpers/fs";
import { runCli } from "./run-cli";

let dir: string;

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), "dhplan-render-"));

	await writeFixture(
		join(dir, "valid-plan.json"),
		JSON.stringify({
			patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [{ type: "maintenance", isMet: true }],
		}),
	);
	await writeFixture(join(dir, "malformed-plan.json"), "{ not json");

	await writeFixture(
		join(dir, "valid-config.json"),
		JSON.stringify({
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending", undefined: "TBD" },
			},
		}),
	);
	await writeFixture(
		join(dir, "invalid-config.json"),
		JSON.stringify({ mapping: { outcome: { met: "Achieved" } } }),
	);

	await writeFixture(
		join(dir, "no-tags.docx"),
		buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>"),
	);
	await writeFixture(
		join(dir, "with-tag.docx"),
		buildDocx("<w:p><w:r><w:t>Hello {name}</w:t></w:r></w:p>"),
	);
});

afterAll(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe("dhplan render", () => {
	test("renders a valid plan and template to the output path", async () => {
		const outputPath = join(dir, "out-success.docx");

		const { stdout, exitCode } = await runCli([
			"render",
			join(dir, "valid-plan.json"),
			join(dir, "no-tags.docx"),
			outputPath,
		]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain(outputPath);
		expect(await fileExists(outputPath)).toBe(true);
	});

	test("an invalid plan reports issues and does not write the output", async () => {
		const outputPath = join(dir, "out-invalid-plan.docx");

		const { stdout, stderr, exitCode } = await runCli([
			"render",
			join(dir, "malformed-plan.json"),
			join(dir, "no-tags.docx"),
			outputPath,
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
		expect(await fileExists(outputPath)).toBe(false);
	});

	test("an invalid template reports issues and does not write the output", async () => {
		const outputPath = join(dir, "out-invalid-template.docx");

		const { stdout, stderr, exitCode } = await runCli([
			"render",
			join(dir, "valid-plan.json"),
			join(dir, "with-tag.docx"),
			outputPath,
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("not defined in Template");
		expect(await fileExists(outputPath)).toBe(false);
	});

	test("a nonexistent input file reports a read error and does not write the output", async () => {
		const outputPath = join(dir, "out-missing-input.docx");

		const { stdout, stderr, exitCode } = await runCli([
			"render",
			join(dir, "does-not-exist.json"),
			join(dir, "no-tags.docx"),
			outputPath,
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
		expect(await fileExists(outputPath)).toBe(false);
	});

	test("renders with a valid --config override file", async () => {
		const outputPath = join(dir, "out-with-config.docx");

		const { stdout, exitCode } = await runCli([
			"render",
			join(dir, "valid-plan.json"),
			join(dir, "no-tags.docx"),
			outputPath,
			"--config",
			join(dir, "valid-config.json"),
		]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain(outputPath);
		expect(await fileExists(outputPath)).toBe(true);
	});

	test("an invalid --config override file reports issues and does not write the output", async () => {
		const outputPath = join(dir, "out-invalid-config.docx");

		const { stdout, stderr, exitCode } = await runCli([
			"render",
			join(dir, "valid-plan.json"),
			join(dir, "no-tags.docx"),
			outputPath,
			"--config",
			join(dir, "invalid-config.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
		expect(await fileExists(outputPath)).toBe(false);
	});

	test("a failure the CLI has no message for is rethrown, not turned into an exit code", async () => {
		// Writing to a directory fails in a way no command branch anticipates, so it
		// has to surface as a crash rather than a misleading validation message.
		await expect(
			runCli(["render", join(dir, "valid-plan.json"), join(dir, "no-tags.docx"), dir]),
		).rejects.toThrow();
	});
});
