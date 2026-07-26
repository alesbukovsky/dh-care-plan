import { describe, expect, test } from "bun:test";
import { buildTemplateData, render } from "../src/renderer";
import { DEFAULT_CONFIG } from "../src/schema/config";
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
		{
			type: "maintenance" as const,
			name: "flossing",
			isMet: true,
			outcome: { status: "met" as const },
		},
		{
			type: "integrity" as const,
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

	test("renders using the default config when no config is given", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");

		const result = render(jsonBuffer(validPlan), docx);

		expect(result.success).toBe(true);
	});

	test("renders using a valid config override", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");
		const config = jsonBuffer({
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending" },
			},
		});

		const result = render(jsonBuffer(validPlan), docx, config);

		expect(result.success).toBe(true);
	});

	test("returns config issues without rendering when the config override is invalid", () => {
		const docx = buildDocx("<w:p><w:r><w:t>Hello world</w:t></w:r></w:p>");
		const invalidConfig = jsonBuffer({ mapping: { outcome: { met: "Achieved" } } });

		const result = render(jsonBuffer(validPlan), docx, invalidConfig);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues.length).toBeGreaterThan(0);
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
			need: DEFAULT_CONFIG.mapping.need.integrity,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
		});
	});

	test("maps a statement's need from the config's mapping.need labels, not the plan's free-text name", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "comfort",
					name: "some free-text name unrelated to the mapping label",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					outcome: { status: "unmet" },
				},
			],
		});

		expect(data.statements[0]?.need).toBe(DEFAULT_CONFIG.mapping.need.comfort);
	});

	test("gives an unmet need without goals an empty goals array", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "integrity",
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
				{ type: "maintenance", name: "flossing", isMet: true, outcome: { status: "met" } },
				{
					type: "integrity",
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }, { task: "brush twice a day" }],
					outcome: { status: "partial" },
				},
				{
					type: "health",
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
			{ label: "2a", task: "reduce sugar", doneBy: "08/01/2026" },
		]);
	});

	test("defaults a missing relatedTo or evidencedBy to an empty string", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "integrity",
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
					type: "integrity",
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

	test("formats patient.dob and appointments using config.format.date, otherwise copying patient fields unchanged", () => {
		const data = buildTemplateData(validPlan);

		expect(data.patient).toEqual({ ...PATIENT, dob: "01/01/1990" });
		expect(data.appointments).toEqual(["07/01/2026", "08/01/2026"]);
	});

	test("formats dates using a custom config.format.date pattern", () => {
		const data = buildTemplateData(validPlan, {
			...DEFAULT_CONFIG,
			format: { date: "DD.MM.YYYY" },
		});

		expect(data.patient.dob).toBe("01.01.1990");
		expect(data.appointments).toEqual(["01.07.2026", "01.08.2026"]);
	});

	test("leaves a goal's doneBy undefined rather than formatting when absent", () => {
		const data = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "integrity",
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "brush twice a day" }],
					outcome: { status: "unmet" },
				},
			],
		});

		expect(data.statements[0]?.goals[0]?.doneBy).toBeUndefined();
	});

	test("copies interventions onto a statement, defaulting to an empty array", () => {
		const data = buildTemplateData(validPlan);

		expect(data.statements[0]?.interventions).toEqual(["oral hygiene education"]);

		const dataWithoutInterventions = buildTemplateData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "integrity",
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
					type: "integrity",
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
					type: "integrity",
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
					type: "integrity",
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

	test("uses a custom config's mapping.outcome labels instead of the defaults", () => {
		const customConfig = {
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending" },
			},
		};

		const data = buildTemplateData(
			{
				patient: PATIENT,
				appointments: APPOINTMENTS,
				needs: [
					{
						type: "integrity",
						name: "brushing",
						isMet: false,
						relatedTo: "gum disease",
						evidencedBy: "x-ray",
						outcome: { status: "partial" },
					},
				],
			},
			customConfig,
		);

		expect(data.statements[0]?.outcome).toEqual({
			label: "In progress",
			note: undefined,
		});
	});
});
