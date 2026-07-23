import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { z } from "zod";
import { DataSchema } from "../../src/schema/data";
import { TemplateSchema } from "../../src/schema/template";

const CLI_PATH = join(import.meta.dir, "../../cli/dhplan.ts");

async function runCli(args: string[]) {
	const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { stdout, stderr, exitCode };
}

describe("dhplan schema", () => {
	test("schema data prints the DataSchema JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "data"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(z.toJSONSchema(DataSchema));
	});

	test("schema template prints the TemplateSchema JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "template"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(z.toJSONSchema(TemplateSchema));
	});

	test("schema with an invalid target errors without printing a schema", async () => {
		const { stdout, stderr, exitCode } = await runCli(["schema", "nonsense"]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("data");
		expect(stderr).toContain("template");
	});

	test("no arguments prints help and exits non-zero", async () => {
		const { stdout, exitCode } = await runCli([]);

		expect(exitCode).not.toBe(0);
		expect(stdout).toContain("Usage:");
	});
});
