import { describe, expect, test } from "bun:test";
import { convertData, dateStr } from "../src/converter";
import { DEFAULT_CONFIG } from "../src/schema/config";

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

describe("dateStr", () => {
	test("formats using MM/DD/YYYY", () => {
		expect(dateStr("1990-05-03", "MM/DD/YYYY")).toBe("05/03/1990");
	});

	test("formats using DD.MM.YYYY", () => {
		expect(dateStr("1990-05-03", "DD.MM.YYYY")).toBe("03.05.1990");
	});

	test("formats using YYYY-MM-DD (identity)", () => {
		expect(dateStr("1990-05-03", "YYYY-MM-DD")).toBe("1990-05-03");
	});

	test("passes through literal separators unmodified", () => {
		expect(dateStr("1990-05-03", "MM/DD/YYYY (literal)")).toBe("05/03/1990 (literal)");
	});
});

describe("convertData", () => {
	test("maps every need to an assessment, preserving order", () => {
		const data = convertData(validPlan);

		expect(data.assessments).toEqual([
			{ need: "flossing", isMet: true },
			{ need: "brushing", isMet: false },
		]);
	});

	test("lists only unmet needs as statements", () => {
		const data = convertData(validPlan);

		expect(data.statements).toHaveLength(1);
		expect(data.statements[0]).toMatchObject({
			need: DEFAULT_CONFIG.mapping.need.integrity,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
		});
	});

	test("maps a statement's need from the config's mapping.need labels, not the plan's free-text name", () => {
		const data = convertData({
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
		const data = convertData({
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
		const data = convertData({
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
					goals: [{ task: "reduce sugar", doneBy: { date: "2026-08-01" } }],
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
		const data = convertData({
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

		const data2 = convertData({
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
		const data = convertData(validPlan);

		expect(data.patient).toEqual({ ...PATIENT, dob: "01/01/1990" });
		expect(data.appointments).toEqual(["07/01/2026", "08/01/2026"]);
	});

	test("formats dates using a custom config.format.date pattern", () => {
		const data = convertData(validPlan, {
			...DEFAULT_CONFIG,
			format: { ...DEFAULT_CONFIG.format, date: "DD.MM.YYYY" },
		});

		expect(data.patient.dob).toBe("01.01.1990");
		expect(data.appointments).toEqual(["01.07.2026", "01.08.2026"]);
	});

	function goalWithDoneBy(doneBy: { date?: string; relative?: string } | undefined) {
		return convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			needs: [
				{
					type: "integrity",
					name: "brushing",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [
						doneBy === undefined
							? { task: "brush twice a day" }
							: { task: "brush twice a day", doneBy },
					],
					outcome: { status: "unmet" },
				},
			],
		});
	}

	test("leaves a goal's doneBy undefined when neither date nor relative is given", () => {
		expect(goalWithDoneBy(undefined).statements[0]?.goals[0]?.doneBy).toBeUndefined();
		expect(goalWithDoneBy({}).statements[0]?.goals[0]?.doneBy).toBeUndefined();
	});

	test("uses the formatted date alone when only date is given", () => {
		const data = goalWithDoneBy({ date: "2026-08-01" });
		expect(data.statements[0]?.goals[0]?.doneBy).toBe("08/01/2026");
	});

	test("uses the relative term verbatim when only relative is given", () => {
		const data = goalWithDoneBy({ relative: "by next visit" });
		expect(data.statements[0]?.goals[0]?.doneBy).toBe("by next visit");
	});

	test("combines date and relative using config.format.goal.doneBy when both are given", () => {
		const data = goalWithDoneBy({ date: "2026-08-01", relative: "by next visit" });
		expect(data.statements[0]?.goals[0]?.doneBy).toBe("08/01/2026, by next visit");
	});

	test("uses a custom config.format.goal.doneBy pattern when both are given", () => {
		const data = convertData(
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
						goals: [
							{
								task: "brush twice a day",
								doneBy: { date: "2026-08-01", relative: "by next visit" },
							},
						],
						outcome: { status: "unmet" },
					},
				],
			},
			{
				...DEFAULT_CONFIG,
				format: { ...DEFAULT_CONFIG.format, goal: { doneBy: "{relative} ({date})" } },
			},
		);

		expect(data.statements[0]?.goals[0]?.doneBy).toBe("by next visit (08/01/2026)");
	});

	test("copies interventions onto a statement, defaulting to an empty array", () => {
		const data = convertData(validPlan);

		expect(data.statements[0]?.interventions).toEqual(["oral hygiene education"]);

		const dataWithoutInterventions = convertData({
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
		const met = convertData({
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

		const partial = convertData({
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

		const unmet = convertData({
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

		const data = convertData(
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
