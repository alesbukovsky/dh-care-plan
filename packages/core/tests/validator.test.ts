import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "../src/schema/config";
import { validateConfig, validateData, validateTemplate } from "../src/validator";
import { buildDocx } from "./helpers/docx-fixture";

function jsonBuffer(value: unknown): ArrayBuffer {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

describe("validateData", () => {
	test("accepts an object matching Plan's shape", () => {
		const plan = {
			patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
			appointments: ["2026-07-01"],
			needs: [
				{ type: "maintenance", name: "flossing", isMet: true, outcome: { status: "met" } },
				{
					type: "integrity",
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }],
					outcome: { status: "unmet" },
				},
			],
		};

		expect(validateData(jsonBuffer(plan))).toEqual({ valid: true });
	});

	test("rejects a non-object value", () => {
		const result = validateData(jsonBuffer("not an object"));

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects malformed JSON", () => {
		const malformed = new TextEncoder().encode("{ not json").buffer as ArrayBuffer;

		const result = validateData(malformed);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual([expect.objectContaining({ path: "" })]);
		}
	});
});

describe("validateTemplate", () => {
	test("accepts a template with no tags", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		expect(validateTemplate(docx)).toEqual({ valid: true });
	});

	test("rejects a tag not defined in Template", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello {name}</w:t></w:r></w:p>");

		const result = validateTemplate(docx);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual([{ path: "name", message: "not defined in Template" }]);
		}
	});

	test("rejects tags nested inside a loop", () => {
		const docx = buildDocx("<w:p><w:r><w:t>{#items}{qty}{/items}</w:t></w:r></w:p>");

		const result = validateTemplate(docx);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual(
				expect.arrayContaining([
					{ path: "items", message: "not defined in Template" },
					{ path: "items.qty", message: "not defined in Template" },
				]),
			);
		}
	});

	test("reports a read failure for a non-.docx file", () => {
		const notADocx = new TextEncoder().encode("not a zip file").buffer;

		const result = validateTemplate(notADocx);
		expect(result.valid).toBe(false);
	});

	test("joins explanations from multiple template errors", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#loop1}unclosed and {#loop2}another unclosed</w:t></w:r></w:p>",
		);

		const result = validateTemplate(docx);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual([
				{
					path: "",
					message: 'The loop with tag "loop1" is unclosed\nThe loop with tag "loop2" is unclosed',
				},
			]);
		}
	});
});

describe("validateConfig", () => {
	test("accepts a full config", () => {
		expect(validateConfig(jsonBuffer(DEFAULT_CONFIG))).toEqual({ valid: true });
	});

	test("rejects an empty object", () => {
		const result = validateConfig(jsonBuffer({}));
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects a partial mapping.outcome section", () => {
		const partial = {
			...DEFAULT_CONFIG,
			mapping: { ...DEFAULT_CONFIG.mapping, outcome: { met: "Achieved" } },
		};

		const result = validateConfig(jsonBuffer(partial));
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects a non-string label value", () => {
		const config = {
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: 123, partial: "B", unmet: "C" },
			},
		};

		const result = validateConfig(jsonBuffer(config));
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects a config missing the format section", () => {
		const { format, ...withoutFormat } = DEFAULT_CONFIG;

		const result = validateConfig(jsonBuffer(withoutFormat));
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects a config missing format.goal.doneBy", () => {
		const { goal, ...formatWithoutGoal } = DEFAULT_CONFIG.format;
		const config = { ...DEFAULT_CONFIG, format: formatWithoutGoal };

		const result = validateConfig(jsonBuffer(config));
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects malformed JSON", () => {
		const malformed = new TextEncoder().encode("{ not json").buffer as ArrayBuffer;

		const result = validateConfig(malformed);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual([expect.objectContaining({ path: "" })]);
		}
	});
});
