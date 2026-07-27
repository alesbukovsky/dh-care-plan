import { describe, expect, test } from "bun:test";
import { Config, DEFAULT_CONFIG, resolveConfig } from "../src";
import { Goal, Need } from "../src/schema/plan";

describe("resolveConfig", () => {
	test("returns the defaults when called with no config", () => {
		expect(resolveConfig()).toEqual(DEFAULT_CONFIG);
		expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG);
	});

	test("returns the given config unchanged when one is provided", () => {
		expect(resolveConfig(DEFAULT_CONFIG)).toEqual(DEFAULT_CONFIG);
	});

	test("DEFAULT_CONFIG includes a format.goal.doneBy pattern", () => {
		expect(DEFAULT_CONFIG.format.goal.doneBy).toBe("{date}, {relative}");
	});
});

describe("Config's mapping shape aligns with Plan enums", () => {
	test("Config's mapping.need keys match Need.type's enum values", () => {
		const needTypeValues = Need.shape.type.options;
		const mappingNeedKeys = Object.keys(Config.shape.mapping.shape.need.shape);

		expect(mappingNeedKeys.sort()).toEqual([...needTypeValues].sort());
	});

	test("Config's mapping.outcome keys match Outcome.status's enum values", () => {
		const outcomeStatusValues = Goal.shape.outcome.shape.status.options;
		const mappingOutcomeKeys = Object.keys(Config.shape.mapping.shape.outcome.shape);

		expect(mappingOutcomeKeys.sort()).toEqual([...outcomeStatusValues].sort());
	});
});
