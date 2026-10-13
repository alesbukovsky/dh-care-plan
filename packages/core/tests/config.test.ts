import { describe, expect, test } from "vitest";
import { CONFIG_VERSION, Config, DEFAULT_CONFIG, migrateConfig } from "../src";
import { Goal, Need } from "../src/schema/plan";

describe("DEFAULT_CONFIG", () => {
	test("includes a format.goal.doneBy pattern", () => {
		expect(DEFAULT_CONFIG.format.goal.doneBy).toBe("{date} / {relative}");
	});

	test("includes a format.bmi pattern", () => {
		expect(DEFAULT_CONFIG.format.bmi).toBe("{value} - {class}");
	});

	test("sorts statements by priority", () => {
		expect(DEFAULT_CONFIG.sort.statements).toBe(true);
	});

	test("parses via the Config schema", () => {
		expect(Config.parse(DEFAULT_CONFIG)).toEqual(DEFAULT_CONFIG);
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
		const outcomeStatusValues = Goal.shape.outcome.unwrap().shape.status.unwrap().options;
		const mappingOutcomeKeys = Object.keys(Config.shape.mapping.shape.outcome.shape);

		expect(mappingOutcomeKeys.sort()).toEqual([...outcomeStatusValues, "undefined"].sort());
	});
});

describe("migrateConfig", () => {
	const { sort, ...v1Config } = { ...DEFAULT_CONFIG, version: 1 };

	test("a v1 config gains sort.statements enabled and the current version", () => {
		expect(migrateConfig(v1Config)).toEqual({
			version: CONFIG_VERSION,
			data: { ...DEFAULT_CONFIG, version: CONFIG_VERSION },
		});
	});

	test("a config at the current version passes through unchanged", () => {
		expect(migrateConfig(DEFAULT_CONFIG)).toEqual({
			version: CONFIG_VERSION,
			data: DEFAULT_CONFIG,
		});
	});

	test("a version newer than this build understands returns null", () => {
		expect(migrateConfig({ ...DEFAULT_CONFIG, version: CONFIG_VERSION + 1 })).toBeNull();
	});
});
