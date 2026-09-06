import { describe, expect, test } from "vitest";
import {
	Config,
	getConfigSample,
	getConfigSchema,
	getPlanSample,
	getPlanSchema,
	getTemplateSample,
	getTemplateSchema,
	Plan,
	Template,
} from "../src";
import { SCHEMA_BASE_URI } from "../src/schema/common";

describe("getPlanSchema", () => {
	test("has $defs entries for registered nested objects, referenced via $ref", () => {
		const schema = getPlanSchema() as {
			$id: string;
			$defs?: Record<string, unknown>;
		};

		expect(schema.$id).toBe(`${SCHEMA_BASE_URI}/plan.schema.json`);
		expect(schema.$defs?.Need).toBeDefined();
		expect(JSON.stringify(schema)).toContain("#/$defs/Need");
	});
});

describe("getPlanSample", () => {
	test("is valid against Plan", () => {
		expect(() => Plan.parse(getPlanSample())).not.toThrow();
	});
});

describe("getTemplateSchema", () => {
	test("carries the public $id for the template schema", () => {
		expect((getTemplateSchema() as { $id: string }).$id).toBe(
			`${SCHEMA_BASE_URI}/template.schema.json`,
		);
	});
});

describe("Template", () => {
	test("assembles a basic structure from an empty object", () => {
		expect(Template.parse({})).toEqual({
			patient: {},
			subjective: {},
			objective: {},
			conditions: [],
			assessments: [],
			statements: [],
			appointments: {},
		});
	});
});

describe("getConfigSchema", () => {
	test("carries the public $id for the config schema", () => {
		expect((getConfigSchema() as { $id: string }).$id).toBe(
			`${SCHEMA_BASE_URI}/config.schema.json`,
		);
	});
});

describe("getTemplateSample", () => {
	test("is valid against Template", () => {
		expect(() => Template.parse(getTemplateSample())).not.toThrow();
	});
});

describe("getConfigSample", () => {
	test("is valid against Config", () => {
		expect(() => Config.parse(getConfigSample())).not.toThrow();
	});
});
