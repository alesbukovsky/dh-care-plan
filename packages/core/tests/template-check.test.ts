import { describe, expect, test } from "bun:test";
import { checkTemplate } from "../src/renderer";
import { buildDocx } from "./helpers/docx-fixture";

describe("checkTemplate", () => {
	test("accepts a template with no tags", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		expect(checkTemplate(docx)).toEqual({ ok: true });
	});

	test("rejects a tag not defined in Template", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello {name}</w:t></w:r></w:p>");

		const result = checkTemplate(docx);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.issues).toEqual([{ path: "name", message: "not defined in Template" }]);
		}
	});

	test("rejects tags nested inside a loop", () => {
		const docx = buildDocx("<w:p><w:r><w:t>{#items}{qty}{/items}</w:t></w:r></w:p>");

		const result = checkTemplate(docx);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.issues).toEqual(
				expect.arrayContaining([
					{ path: "items", message: "not defined in Template" },
					{ path: "items.qty", message: "not defined in Template" },
				]),
			);
		}
	});

	test("accepts a loop over an array of objects, resolving nested field tags", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#statements}{#goals}{task}{/goals}{/statements}</w:t></w:r></w:p>",
		);

		expect(checkTemplate(docx)).toEqual({ ok: true });
	});

	test("accepts an if-section over an optional scalar field, referencing the same field inside", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#statements}{#goals}{#doneBy} by {doneBy}{/doneBy}{/goals}{/statements}</w:t></w:r></w:p>",
		);

		expect(checkTemplate(docx)).toEqual({ ok: true });
	});

	test("accepts an if-section over a dotted, optional nested object field", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#statements}{#goals}{#outcome.note}. {outcome.note}{/outcome.note}{/goals}{/statements}</w:t></w:r></w:p>",
		);

		expect(checkTemplate(docx)).toEqual({ ok: true });
	});

	test("accepts a loop over an array of primitives, referencing only the current item", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#statements}{#goals}{#interventions}{.}{/interventions}{/goals}{/statements}</w:t></w:r></w:p>",
		);

		expect(checkTemplate(docx)).toEqual({ ok: true });
	});

	test("reports a read failure for a non-.docx file", () => {
		const notADocx = new TextEncoder().encode("not a zip file").buffer as ArrayBuffer;

		expect(checkTemplate(notADocx).ok).toBe(false);
	});

	test("joins explanations from multiple template errors", () => {
		const docx = buildDocx(
			"<w:p><w:r><w:t>{#loop1}unclosed and {#loop2}another unclosed</w:t></w:r></w:p>",
		);

		const result = checkTemplate(docx);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.issues).toEqual([
				{
					path: "",
					message: 'The loop with tag "loop1" is unclosed\nThe loop with tag "loop2" is unclosed',
				},
			]);
		}
	});
});
