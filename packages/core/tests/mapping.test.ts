import { describe, expect, test } from "bun:test";
import { DEFAULT_MAPPING, resolveMapping } from "../src";

describe("resolveMapping", () => {
	test("returns the defaults when called with no mapping", () => {
		expect(resolveMapping()).toEqual(DEFAULT_MAPPING);
		expect(resolveMapping(undefined)).toEqual(DEFAULT_MAPPING);
	});

	test("returns the given mapping unchanged when one is provided", () => {
		const mapping = { outcomeStatus: { met: "A", partial: "B", unmet: "C" } };

		expect(resolveMapping(mapping)).toEqual(mapping);
	});
});
