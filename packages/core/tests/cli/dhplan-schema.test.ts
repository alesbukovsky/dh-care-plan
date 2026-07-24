import { describe, expect, test } from "bun:test";
import { getPlanSchema, getTemplateSchema } from "../../src";
import { SCHEMA_BASE_URI } from "../../src/schema/common";
import { runCli } from "./run-cli";

describe("dhplan schema", () => {
	test("schema plan prints the Plan JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "plan"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getPlanSchema());
	});

	test("schema template prints the Template JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "template"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getTemplateSchema());
	});

	test("plan schema has $defs entries for registered nested objects, referenced via $ref", () => {
		const schema = getPlanSchema() as {
			$id: string;
			$defs?: Record<string, unknown>;
		};

		expect(schema.$id).toBe(`${SCHEMA_BASE_URI}/plan.schema.json`);
		expect(schema.$defs?.Need).toBeDefined();
		expect(JSON.stringify(schema)).toContain("#/$defs/Need");
	});

	test("schema with an invalid type errors without printing a schema", async () => {
		const { stdout, stderr, exitCode } = await runCli(["schema", "nonsense"]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("plan");
		expect(stderr).toContain("template");
	});

	test("no arguments prints help and exits non-zero", async () => {
		const { stdout, exitCode } = await runCli([]);

		expect(exitCode).not.toBe(0);
		expect(stdout).toContain("Usage:");
	});
});
