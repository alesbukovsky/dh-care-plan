import { describe, expect, test } from "vitest";
import { Config, DEFAULT_CONFIG } from "../src";
import { Goal, Need } from "../src/schema/plan";

describe("DEFAULT_CONFIG", () => {
	test("includes a format.goal.doneBy pattern", () => {
		expect(DEFAULT_CONFIG.format.goal.doneBy).toBe("{date} / {relative}");
	});
});

describe("Config's mapping shape aligns with Plan enums", () => {
	// Checked against the enum itself, not NEED_TYPES, so this holds independently
	// of the constant the code derives from it.
	test("Config's mapping.need defines exactly one key per Need.type enum value", () => {
		const needTypeValues = Need.shape.type.options;
		const mappingNeedKeys = Object.keys(Config.shape.mapping.shape.need.shape);

		expect(mappingNeedKeys.sort()).toEqual([...needTypeValues].sort());
		expect(mappingNeedKeys).toHaveLength(needTypeValues.length);
	});

	test("Config's mapping.outcome keys match Outcome.status's enum values plus undefined", () => {
		const outcomeStatusValues = Goal.shape.outcome.unwrap().shape.status.options;
		const mappingOutcomeKeys = Object.keys(Config.shape.mapping.shape.outcome.shape);

		expect(mappingOutcomeKeys.sort()).toEqual([...outcomeStatusValues, "undefined"].sort());
	});
});
