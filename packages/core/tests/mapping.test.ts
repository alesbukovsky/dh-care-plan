import { describe, expect, test } from "bun:test";
import { DEFAULT_MAPPING, Mapping, resolveMapping } from "../src";
import { Need } from "../src/schema/plan";

describe("resolveMapping", () => {
	test("returns the defaults when called with no mapping", () => {
		expect(resolveMapping()).toEqual(DEFAULT_MAPPING);
		expect(resolveMapping(undefined)).toEqual(DEFAULT_MAPPING);
	});

	test("returns the given mapping unchanged when one is provided", () => {
		expect(resolveMapping(DEFAULT_MAPPING)).toEqual(DEFAULT_MAPPING);
	});
});

describe("Mapping shape aligns with Plan enums", () => {
	test("Mapping's need keys match Need.type's enum values", () => {
		const needTypeValues = Need.shape.type.options;
		const mappingNeedKeys = Object.keys(Mapping.shape.need.shape);

		expect(mappingNeedKeys.sort()).toEqual([...needTypeValues].sort());
	});

	test("Mapping's outcome keys match Outcome.status's enum values", () => {
		const outcomeStatusValues = Need.shape.outcome.shape.status.options;
		const mappingOutcomeKeys = Object.keys(Mapping.shape.outcome.shape);

		expect(mappingOutcomeKeys.sort()).toEqual([...outcomeStatusValues].sort());
	});
});
