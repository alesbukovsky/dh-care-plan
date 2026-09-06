import type PizZip from "pizzip";
import { describe, expect, test } from "vitest";
import { parsePlan } from "../src/parser";
import { createTemplater, describeTemplaterError, render } from "../src/renderer";
import { DEFAULT_CONFIG } from "../src/schema/config";
import type { Plan } from "../src/schema/plan";
import { buildDocx } from "./helpers/docx-fixture";

function renderedText(doc: ReturnType<typeof createTemplater>): string {
	const document = (doc.getZip() as PizZip).files["word/document.xml"];
	if (!document) throw new Error("rendered docx is missing word/document.xml");
	return document.asText();
}

const validPlan: Plan = {
	patient: { initials: "J.D.", dob: "1990-01-01", chartId: "12345" },
	subjective: { complaint: "sensitive teeth" },
	objective: {
		medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
		exams: { findings: ["no visible caries"], referrals: "none" },
	},
	conditions: [],
	needs: [
		{
			type: "maintenance",
			isMet: true,
		},
		{
			type: "integrity",
			isMet: false,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
			goals: [
				{
					task: "floss daily",
					interventions: ["oral hygiene education"],
					outcome: { status: "partial", note: "improving" },
				},
			],
		},
	],
};

describe("render", () => {
	test("renders a valid plan into a valid template", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		const result = render(validPlan, docx);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.output).toBeInstanceOf(Uint8Array);
			expect(result.output.length).toBeGreaterThan(0);
		}
	});

	test("renders an empty plan into a blank but valid docx", () => {
		const parsed = parsePlan("{}");
		if (!parsed.ok) throw new Error("expected an empty plan to parse");
		const docx = buildDocx(
			"<w:p><w:r><w:t>{patient.initials} {subjective.complaint}</w:t></w:r></w:p>",
		);

		const result = render(parsed.data, docx);

		expect(result.ok).toBe(true);
		if (result.ok) {
			const doc = createTemplater(result.output);
			expect(renderedText(doc)).not.toContain("undefined");
		}
	});

	test("reports a docxtemplater processing failure instead of throwing", () => {
		const docx = buildDocx("<w:p><w:r><w:t>{#loop1}unclosed</w:t></w:r></w:p>");

		const result = render(validPlan, docx);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("unclosed");
		}
	});

	test("reports a read failure for a non-.docx template rather than throwing", () => {
		const notADocx = new TextEncoder().encode("not a zip file");

		const result = render(validPlan, notADocx);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toBeTruthy();
		}
	});

	test("renders using the default config when none is given", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		expect(render(validPlan, docx).ok).toBe(true);
	});

	test("renders using a config override", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");
		const config = {
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending", undefined: "TBD" },
			},
		};

		expect(render(validPlan, docx, config).ok).toBe(true);
	});

	test("renders a template whose tags are undefined in Template, leaving them blank", () => {
		// `render` no longer lints the template — that is `checkTemplate`'s job — so an
		// unknown tag is filled by `nullGetter` rather than reported.
		const docx = buildDocx("<w:p><w:r><w:t>Hello {undefinedTag}</w:t></w:r></w:p>");

		expect(render(validPlan, docx).ok).toBe(true);
	});
});

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
