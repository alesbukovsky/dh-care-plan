import { describe, expect, test } from "bun:test";
import { buildTemplateData, render } from "../src/renderer";
import { buildDocx } from "./helpers/docx-fixture";

function jsonBuffer(value: unknown): ArrayBuffer {
	return new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer;
}

const PATIENT = { initials: "J.D.", dob: "1990-01-01", chartId: "12345" };
const APPOINTMENTS = ["2026-07-01", "2026-08-01"];

const validPlan = {
	patient: PATIENT,
	appointments: APPOINTMENTS,
	needs: [
		{ name: "flossing", isMet: true, outcome: { status: "met" as const } },
		{
			name: "brushing",
			isMet: false,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
			goals: [{ task: "floss daily" }],
			interventions: ["oral hygiene education"],
			outcome: { status: "partial" as const, note: "improving" },
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

describe("buildTemplateData", () => {
	test("maps every need to an assessment, preserving order", () => {
		const data = buildTemplateData(validPlan);

		expect(data.assessments).toEqual([
			{ need: "flossing", isMet: true },
			{ need: "brushing", isMet: false },
		]);
	});

	test("lists only unmet needs as statements", () => {
		const data = buildTemplateData(validPlan);

		expect(data.statements).toHaveLength(1);
		expect(data.statements[0]).toMatchObject({
			need: "brushing",
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
		});
	});

	test("gives an unmet need without goals an empty goals array", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "unmet" },
				},
			],
		});

		expect(data.statements[0]?.goals).toEqual([]);
	});

	test("labels goals with <statement number><goal letter>, based on position among statements", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{ name: "flossing", isMet: true, outcome: { status: "met" } },
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }, { task: "brush twice a day" }],
					outcome: { status: "partial" },
				},
				{
					name: "diet",
					isMet: false,
					relatedTo: "sugar intake",
					evidencedBy: "diary",
					goals: [{ task: "reduce sugar", doneBy: "2026-08-01" }],
					outcome: { status: "unmet" },
				},
			],
		});

		expect(data.statements[0]?.goals).toEqual([
			{ label: "1a", task: "floss daily", doneBy: undefined },
			{ label: "1b", task: "brush twice a day", doneBy: undefined },
		]);
		expect(data.statements[1]?.goals).toEqual([
			{ label: "2a", task: "reduce sugar", doneBy: "2026-08-01" },
		]);
	});

	test("defaults a missing relatedTo or evidencedBy to an empty string", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					evidencedBy: "x-ray",
					outcome: { status: "unmet" },
				},
			],
		});
		expect(data.statements[0]).toMatchObject({ relatedTo: "", evidencedBy: "x-ray" });

		const data2 = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					outcome: { status: "unmet" },
				},
			],
		});
		expect(data2.statements[0]).toMatchObject({
			relatedTo: "gum disease",
			evidencedBy: "",
		});
	});

	test("copies patient and appointments unchanged", () => {
		const data = buildTemplateData(validPlan);

		expect(data.patient).toEqual(PATIENT);
		expect(data.appointments).toEqual(APPOINTMENTS);
	});

	test("copies interventions onto a statement, defaulting to an empty array", () => {
		const data = buildTemplateData(validPlan);

		expect(data.statements[0]?.interventions).toEqual(["oral hygiene education"]);

		const dataWithoutInterventions = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "unmet" },
				},
			],
		});
		expect(dataWithoutInterventions.statements[0]?.interventions).toEqual([]);
	});

	test("maps outcome status to a display label, one case per status", () => {
		const met = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "met", note: "resolved" },
				},
			],
		});
		expect(met.statements[0]?.outcome).toEqual({ label: "Met", note: "resolved" });

		const partial = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "partial" },
				},
			],
		});
		expect(partial.statements[0]?.outcome).toEqual({
			label: "Partially met",
			note: undefined,
		});

		const unmet = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "unmet" },
				},
			],
		});
		expect(unmet.statements[0]?.outcome).toEqual({ label: "Not met", note: undefined });
	});
});
