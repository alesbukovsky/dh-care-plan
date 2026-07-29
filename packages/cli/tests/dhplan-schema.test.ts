import {
	getConfigSample,
	getConfigSchema,
	getPlanSample,
	getPlanSchema,
	getTemplateSample,
	getTemplateSchema,
} from "@dh-care-plan/core";
import { describe, expect, test } from "vitest";
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

	test("schema config prints the Config JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "config"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getConfigSchema());
	});

	test("schema with an invalid type errors without printing a schema", async () => {
		const { stdout, stderr, exitCode } = await runCli(["schema", "nonsense"]);

		expect(exitCode).not.toBe(0);
		expect(stdout.trim()).toBe("");
		expect(stderr).toContain("plan");
		expect(stderr).toContain("template");
		expect(stderr).toContain("config");
	});

	test("no arguments prints help and exits non-zero", async () => {
		const { stdout, exitCode } = await runCli([]);

		expect(exitCode).not.toBe(0);
		expect(stdout).toContain("Usage:");
	});

	test("schema plan --sample prints the plan sample instead of the JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "plan", "--sample"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getPlanSample());
	});

	test("schema template --sample prints the template sample instead of the JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "template", "--sample"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getTemplateSample());
	});

	test("schema config --sample prints the config sample instead of the JSON Schema", async () => {
		const { stdout, exitCode } = await runCli(["schema", "config", "--sample"]);

		expect(exitCode).toBe(0);
		expect(JSON.parse(stdout)).toEqual(getConfigSample());
	});
});
