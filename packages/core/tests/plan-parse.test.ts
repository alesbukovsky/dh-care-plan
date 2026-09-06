import { describe, expect, test } from "vitest";
import { parseConfig, parseJson, parsePlan } from "../src/parser";
import { DEFAULT_CONFIG } from "../src/schema/config";
import { NEED_TYPES, type Plan } from "../src/schema/plan";

const PLAN: Plan = {
	patient: { initials: "J.D.", dob: "2001-04-17", chartId: "A1234" },
	subjective: { complaint: "Sensitivity" },
	objective: {},
	conditions: [],
	needs: [{ type: "health", isMet: false }],
};

function encode(value: unknown): Uint8Array {
	return new TextEncoder().encode(JSON.stringify(value));
}

describe("parseJson", () => {
	test("decodes both text and buffers", () => {
		expect(parseJson('{"a":1}')).toEqual({ ok: true, data: { a: 1 } });
		expect(parseJson(encode([1, 2]))).toEqual({ ok: true, data: [1, 2] });
	});

	test("reports the parser message instead of throwing", () => {
		const result = parseJson("not json");
		expect(result.ok).toBe(false);
		expect(result.ok ? "" : result.message).toBeTruthy();
	});
});

describe("parsePlan", () => {
	test("returns the parsed plan for valid data", () => {
		const result = parsePlan(JSON.stringify(PLAN));

		expect(result).toEqual({ ok: true, data: PLAN });
	});

	test("accepts a buffer as well as text", () => {
		expect(parsePlan(encode(PLAN)).ok).toBe(true);
	});

	test("distinguishes unparseable JSON from a schema mismatch", () => {
		expect(parsePlan("{")).toMatchObject({ ok: false, reason: "json" });
		expect(parsePlan(JSON.stringify("not an object"))).toMatchObject({
			ok: false,
			reason: "schema",
		});
	});

	test("fills in an empty plan so an unfilled DOCX can still render", () => {
		const result = parsePlan("{}");

		expect(result).toEqual({
			ok: true,
			data: {
				patient: {},
				subjective: {},
				objective: {},
				conditions: [],
				needs: NEED_TYPES.map((type) => ({ type })),
			},
		});
	});

	test("rejects a non-object value", () => {
		expect(parsePlan(JSON.stringify("not an object"))).toMatchObject({
			ok: false,
			reason: "schema",
		});
	});

	test("hands back the whole zod issue and the data it came from", () => {
		const data = { ...PLAN, needs: [{ type: "health", isMet: "yes" }] };
		const result = parsePlan(JSON.stringify(data));

		if (result.ok || result.reason !== "schema") throw new Error("expected a schema mismatch");
		expect(result.raw).toEqual(data);
		expect(result.issues).toHaveLength(1);
		expect(result.issues[0]).toMatchObject({
			code: "invalid_type",
			expected: "boolean",
			path: ["needs", 0, "isMet"],
		});
	});

	test("keeps the path structured, so callers can label each segment themselves", () => {
		const result = parsePlan(JSON.stringify({ ...PLAN, needs: [{ isMet: false }] }));

		if (result.ok || result.reason !== "schema") throw new Error("expected a schema mismatch");
		expect(result.issues[0]?.path).toEqual(["needs", 0, "type"]);
	});
});

describe("parseConfig", () => {
	test("accepts a full config", () => {
		const result = parseConfig(JSON.stringify(DEFAULT_CONFIG));

		expect(result).toEqual({ ok: true, data: DEFAULT_CONFIG });
	});

	test("rejects an empty object", () => {
		expect(parseConfig("{}")).toMatchObject({ ok: false, reason: "schema" });
	});

	test("rejects a partial mapping.outcome section", () => {
		const partial = {
			...DEFAULT_CONFIG,
			mapping: { ...DEFAULT_CONFIG.mapping, outcome: { met: "Achieved" } },
		};

		expect(parseConfig(JSON.stringify(partial))).toMatchObject({ ok: false, reason: "schema" });
	});

	test("rejects a non-string label value", () => {
		const config = {
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: 123, partial: "B", unmet: "C" },
			},
		};

		const result = parseConfig(JSON.stringify(config));
		if (result.ok || result.reason !== "schema") throw new Error("expected a schema mismatch");
		expect(result.issues.length).toBeGreaterThan(0);
	});

	test("rejects a config missing the format section", () => {
		const { format, ...withoutFormat } = DEFAULT_CONFIG;

		expect(parseConfig(JSON.stringify(withoutFormat))).toMatchObject({
			ok: false,
			reason: "schema",
		});
	});

	test("rejects a config missing format.goal.doneBy", () => {
		const { goal, ...formatWithoutGoal } = DEFAULT_CONFIG.format;
		const config = { ...DEFAULT_CONFIG, format: formatWithoutGoal };

		expect(parseConfig(JSON.stringify(config))).toMatchObject({ ok: false, reason: "schema" });
	});

	test("reports a nested mapping mismatch at its full path", () => {
		const broken = parseConfig(JSON.stringify({ ...DEFAULT_CONFIG, mapping: { outcome: 1 } }));

		if (broken.ok || broken.reason !== "schema") throw new Error("expected a schema mismatch");
		expect(broken.issues).toContainEqual(
			expect.objectContaining({ path: ["mapping", "outcome"] }),
		);
	});

	test("rejects malformed JSON", () => {
		expect(parseConfig("{ not json")).toMatchObject({ ok: false, reason: "json" });
		expect(parseConfig(new TextEncoder().encode("{ not json"))).toMatchObject({
			ok: false,
			reason: "json",
		});
	});
});
