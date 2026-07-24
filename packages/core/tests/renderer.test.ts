import { describe, expect, test } from "bun:test";
import { render } from "../src/renderer";
import { buildDocx } from "./helpers/docx-fixture";

function jsonBuffer(value: unknown): ArrayBuffer {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

const validPlan = {
	needs: [
		{ name: "flossing", isMet: true },
		{
			name: "brushing",
			isMet: false,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
			goals: [{ task: "floss daily" }],
		},
	],
};

describe("render", () => {
	test("returns plan issues without touching the template when the plan is invalid", () => {
		const invalidPlan = jsonBuffer("not an object");
		const docx = buildDocx("<w:p><w:r><w:t>Hello {undefinedTag}</w:t></w:r></w:p>");

		const result = render(invalidPlan, docx);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("returns template issues when the plan is valid but the template is not", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello {undefinedTag}</w:t></w:r></w:p>");

		const result = render(jsonBuffer(validPlan), docx);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues).toEqual([
				{ path: "undefinedTag", message: "not defined in Template" },
			]);
		}
	});

	test("renders successfully when both plan and template are valid", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		const result = render(jsonBuffer(validPlan), docx);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output).toBeInstanceOf(Uint8Array);
			expect(result.output.length).toBeGreaterThan(0);
		}
	});

	test("reports a docxtemplater processing failure as an issue rather than throwing", () => {
		// This template fails docxtemplater processing (an unclosed loop tag).
		// Since `buildTemplateData` currently always returns `{}`, the same
		// data is used both by `validateTemplate`'s internal render check and
		// by `render()`'s own render step, so this is caught at the
		// validation step today — but the important behavior under test is
		// that `render()` never throws and always returns an issue instead.
		const docx = buildDocx("<w:p><w:r><w:t>{#loop1}unclosed</w:t></w:r></w:p>");

		const result = render(jsonBuffer(validPlan), docx);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues[0]?.message).toContain("unclosed");
		}
	});
});
