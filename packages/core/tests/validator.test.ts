import { describe, expect, test } from "bun:test";
import { validateData, validateTemplate } from "../src/validator";
import { buildDocx } from "./helpers/docx-fixture";

function jsonBuffer(value: unknown): ArrayBuffer {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

describe("validateData", () => {
	test("accepts an object, since DataSchema is currently an empty placeholder", () => {
		expect(validateData(jsonBuffer({ anything: "goes" }))).toEqual({
			valid: true,
		});
	});

	test("rejects a non-object value", () => {
		const result = validateData(jsonBuffer("not an object"));

		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues.length).toBeGreaterThan(0);
		}
	});

	test("rejects malformed JSON", () => {
		const malformed = new TextEncoder().encode("{ not json")
			.buffer as ArrayBuffer;

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

	test("rejects a tag not defined in TemplateSchema", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello {name}</w:t></w:r></w:p>");

		const result = validateTemplate(docx);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual([
				{ path: "name", message: "not defined in TemplateSchema" },
			]);
		}
	});

	test("rejects tags nested inside a loop", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#items}{qty}{/items}</w:t></w:r></w:p>",
		);

		const result = validateTemplate(docx);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.issues).toEqual(
				expect.arrayContaining([
					{ path: "items", message: "not defined in TemplateSchema" },
					{ path: "items.qty", message: "not defined in TemplateSchema" },
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
					message:
						'The loop with tag "loop1" is unclosed\nThe loop with tag "loop2" is unclosed',
				},
			]);
		}
	});
});
