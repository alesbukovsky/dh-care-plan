import { describe, expect, mock, test } from "bun:test";
import type Docxtemplater from "docxtemplater";
import { getPlanSample } from "../src/sampler";
import type { TemplaterOptions } from "../src/templater";
import { buildDocx } from "./helpers/docx-fixture";

function jsonBuffer(value: unknown): ArrayBuffer {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

/** Shaped like a real docxtemplater multi-error, so `describeTemplaterError` has something to unwrap. */
const TEMPLATER_ERROR = {
	message: "Multi error",
	properties: {
		errors: [
			{ message: "raw scope error", properties: { explanation: "Scope parser failed" } },
			{ message: "raw render error", properties: { explanation: "Tag could not be rendered" } },
		],
	},
};

/**
 * Only throws while `armed` is set, and only for the option-less `createTemplater` call
 * that `render()` makes for the real render pass — `validateTemplate` passes `modules`,
 * so its internal dry-run keeps working and `render()` reaches the step under test.
 */
let armed = false;

// Destructured by value: `mock.module` rebinds the live namespace, so holding onto the
// namespace object here would make the mock call itself.
const { createTemplater: realCreateTemplater, describeTemplaterError } = await import(
	"../src/templater"
);

mock.module("../src/templater", () => ({
	describeTemplaterError,
	createTemplater(input: ArrayBuffer, options?: TemplaterOptions): Docxtemplater {
		const doc = realCreateTemplater(input, options);
		if (armed && options === undefined) {
			doc.render = () => {
				throw TEMPLATER_ERROR;
			};
		}
		return doc;
	},
}));

const { render } = await import("../src/renderer");

describe("render, when docxtemplater throws during the render pass", () => {
	test("reports the failure as issues instead of throwing, and produces no output", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		armed = true;
		try {
			const result = render(jsonBuffer(getPlanSample()), docx);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.issues).toEqual([
					{ path: "", message: "Scope parser failed\nTag could not be rendered" },
				]);
			}
		} finally {
			armed = false;
		}
	});

	test("renders normally once the templater stops throwing", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		const result = render(jsonBuffer(getPlanSample()), docx);

		expect(result.success).toBe(true);
	});
});
