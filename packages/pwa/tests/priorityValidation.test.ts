import type { Need } from "@dh-care-plan/core";
import { describe, expect, test } from "vitest";
import { computePriorityErrors } from "../src/priorityValidation";

function need(type: Need["type"], priority?: string, exists = true): Need {
	return { type, exists, priority };
}

describe("computePriorityErrors", () => {
	test("flags no needs when priorities form a contiguous 1..N sequence", () => {
		const errors = computePriorityErrors([
			need("health", "1"),
			need("peace", "2"),
			need("comfort", "3"),
		]);
		expect(errors.size).toBe(0);
	});

	test("flags a duplicated priority number", () => {
		const errors = computePriorityErrors([
			need("health", "1"),
			need("peace", "1"),
			need("comfort", "2"),
		]);
		expect(errors.get("health")).toMatch(/used more than once/);
		expect(errors.get("peace")).toMatch(/used more than once/);
		expect(errors.has("comfort")).toBe(false);
	});

	test("flags a gap in the sequence", () => {
		const errors = computePriorityErrors([
			need("health", "1"),
			need("peace", "2"),
			need("comfort", "4"),
		]);
		expect(errors.get("health")).toMatch(/without gaps/);
		expect(errors.get("peace")).toMatch(/without gaps/);
		expect(errors.get("comfort")).toMatch(/without gaps/);
	});

	test("ignores needs without a priority or that do not exist", () => {
		const errors = computePriorityErrors([
			need("health", "1"),
			need("peace", undefined),
			need("comfort", "1", false),
		]);
		expect(errors.size).toBe(0);
	});

	test("ignores a non-numeric priority", () => {
		const errors = computePriorityErrors([need("health", "1"), need("peace", "abc")]);
		expect(errors.size).toBe(0);
	});
});
