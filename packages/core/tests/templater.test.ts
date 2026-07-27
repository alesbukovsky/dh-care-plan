import { describe, expect, test } from "bun:test";
import type PizZip from "pizzip";
import { createTemplater, describeTemplaterError } from "../src/templater";
import { buildDocx } from "./helpers/docx-fixture";

function renderedText(doc: ReturnType<typeof createTemplater>): string {
	const document = (doc.getZip() as PizZip).files["word/document.xml"];
	if (!document) throw new Error("rendered docx is missing word/document.xml");
	return document.asText();
}

describe("createTemplater", () => {
	test("the lower filter lowercases a string tag value", () => {
		const docx = buildDocx("<w:p><w:r><w:t>{name | lower}</w:t></w:r></w:p>");

		const doc = createTemplater(docx);
		doc.render({ name: "JOHN DOE" });

		expect(renderedText(doc)).toContain("john doe");
	});

	test("the lower filter passes non-string values through unchanged", () => {
		const docx = buildDocx("<w:p><w:r><w:t>{count | lower}</w:t></w:r></w:p>");

		const doc = createTemplater(docx);
		doc.render({ count: 42 });

		expect(renderedText(doc)).toContain("42");
	});

	test("defaults a missing tag to an empty string instead of throwing", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello {missing}</w:t></w:r></w:p>");

		const doc = createTemplater(docx);
		expect(() => doc.render({})).not.toThrow();
		expect(renderedText(doc)).toContain("Hello ");
	});
});

describe("describeTemplaterError", () => {
	test("joins explanations from multiple nested errors", () => {
		const error = {
			message: "top-level message",
			properties: {
				errors: [
					{ message: "err1", properties: { explanation: "explanation one" } },
					{ message: "err2", properties: { explanation: "explanation two" } },
				],
			},
		};

		expect(describeTemplaterError(error)).toBe("explanation one\nexplanation two");
	});

	test("falls back to a nested error's message when it has no explanation", () => {
		const error = {
			message: "top-level message",
			properties: { errors: [{ message: "err1" }] },
		};

		expect(describeTemplaterError(error)).toBe("err1");
	});

	test("falls back to the top-level message when there are no nested errors", () => {
		const error = { message: "top-level message" };

		expect(describeTemplaterError(error)).toBe("top-level message");
	});
});
