import { describe, expect, test } from "bun:test";
import { Config, DEFAULT_CONFIG } from "../src";
import { Goal, Need } from "../src/schema/plan";

describe("DEFAULT_CONFIG", () => {
	test("includes a format.goal.doneBy pattern", () => {
		expect(DEFAULT_CONFIG.format.goal.doneBy).toBe("{date} / {relative}");
	});
});

describe("Config's mapping shape aligns with Plan enums", () => {
	test("Config's mapping.need keys match Need.type's enum values", () => {
		const needTypeValues = Need.shape.type.options;
		const mappingNeedKeys = Object.keys(Config.shape.mapping.shape.need.shape);

		expect(mappingNeedKeys.sort()).toEqual([...needTypeValues].sort());
	});

	test("Config's mapping.outcome keys match Outcome.status's enum values plus undefined", () => {
		const outcomeStatusValues = Goal.shape.outcome.unwrap().shape.status.options;
		const mappingOutcomeKeys = Object.keys(Config.shape.mapping.shape.outcome.shape);

		expect(mappingOutcomeKeys.sort()).toEqual([...outcomeStatusValues, "undefined"].sort());
	});
});
