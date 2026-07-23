import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDocx } from "../helpers/docx-fixture";
import { runCli } from "./run-cli";

let dir: string;

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), "dhplan-validate-"));

	await Bun.write(
		join(dir, "valid-data.json"),
		JSON.stringify({ any: "thing" }),
	);
	await Bun.write(join(dir, "malformed-data.json"), "{ not json");
	await Bun.write(
		join(dir, "not-an-object.json"),
		JSON.stringify("just a string"),
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

describe("dhplan validate data", () => {
	test("a JSON object is valid, since DataSchema is currently an empty placeholder", async () => {
		const { stdout, exitCode } = await runCli([
			"validate",
			"data",
			join(dir, "valid-data.json"),
		]);

		expect(exitCode).toBe(0);
		expect(stdout).toContain("is valid");
	});

	test("malformed JSON is invalid", async () => {
		const { stdout, stderr, exitCode } = await runCli([
			"validate",
			"data",
			join(dir, "malformed-data.json"),
		]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr.length).toBeGreaterThan(0);
	});

	test("a non-object value is invalid", async () => {
		const { exitCode } = await runCli([
			"validate",
			"data",
			join(dir, "not-an-object.json"),
		]);

		expect(exitCode).not.toBe(0);
	});
});

describe("dhplan validate template", () => {
	test("a template with no tags is valid", async () => {
		const { stdout, exitCode } = await runCli([
			"validate",
			"template",
			join(dir, "no-tags.docx"),
		]);

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
		expect(stderr).toContain("not defined in TemplateSchema");
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
		expect(stderr).toContain("data");
		expect(stderr).toContain("template");
	});
});
