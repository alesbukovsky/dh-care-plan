import { describe, expect, test } from "bun:test";
import { convertData, dateStr } from "../src/converter";
import { DEFAULT_CONFIG } from "../src/schema/config";

const PATIENT = { initials: "J.D.", dob: "1990-01-01", chartId: "12345" };
const APPOINTMENTS = ["2026-07-01", "2026-08-01"];

const validPlan = {
	patient: PATIENT,
	appointments: APPOINTMENTS,
	subjective: { complaint: "sensitive teeth" },
	objective: {
		medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
		exams: { findings: ["no visible caries"], referrals: "none" },
	},
	needs: [
		{
			type: "maintenance" as const,
			isMet: true,
		},
		{
			type: "integrity" as const,
			isMet: false,
			relatedTo: "gum disease",
			evidencedBy: "x-ray",
			goals: [
				{
					task: "floss daily",
					interventions: ["oral hygiene education"],
					outcome: { status: "partial" as const, note: "improving" },
				},
			],
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
			{
				need: DEFAULT_CONFIG.mapping.need.maintenance,
				isMet: true,
				relatedTo: undefined,
				evidencedBy: undefined,
			},
			{
				need: DEFAULT_CONFIG.mapping.need.integrity,
				isMet: false,
				relatedTo: "gum disease",
				evidencedBy: "x-ray",
			},
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

	test("derives both assessment.need and statement.need from config.mapping.need for the same need", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "comfort",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
				},
			],
		});

		expect(data.assessments[0]?.need).toBe(DEFAULT_CONFIG.mapping.need.comfort);
		expect(data.statements[0]?.need).toBe(DEFAULT_CONFIG.mapping.need.comfort);
	});

	test("leaves an assessment's relatedTo/evidencedBy undefined when the need has neither", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [{ type: "maintenance", isMet: true }],
		});

		expect(data.assessments[0]?.relatedTo).toBeUndefined();
		expect(data.assessments[0]?.evidencedBy).toBeUndefined();
	});

	test("gives an unmet need without goals an empty goals array", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
				},
			],
		});

		expect(data.statements[0]?.goals).toEqual([]);
	});

	test("labels goals with <statement number><goal letter>, based on position among statements", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{ type: "maintenance", isMet: true },
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [
						{ task: "floss daily", outcome: { status: "partial" } },
						{ task: "brush twice a day", outcome: { status: "partial" } },
					],
				},
				{
					type: "health",
					isMet: false,
					relatedTo: "sugar intake",
					evidencedBy: "diary",
					goals: [
						{
							task: "reduce sugar",
							doneBy: { date: "2026-08-01" },
							outcome: { status: "unmet" },
						},
					],
				},
			],
		});

		expect(data.statements[0]?.goals).toEqual([
			{
				label: "1a",
				task: "floss daily",
				doneBy: undefined,
				interventions: [],
				outcome: { label: "Partially met", note: undefined },
			},
			{
				label: "1b",
				task: "brush twice a day",
				doneBy: undefined,
				interventions: [],
				outcome: { label: "Partially met", note: undefined },
			},
		]);
		expect(data.statements[1]?.goals).toEqual([
			{
				label: "2a",
				task: "reduce sugar",
				doneBy: "08/01/2026",
				interventions: [],
				outcome: { label: "Not met", note: undefined },
			},
		]);
	});

	test("defaults a missing relatedTo or evidencedBy to an empty string", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					evidencedBy: "x-ray",
				},
			],
		});
		expect(data.statements[0]).toMatchObject({ relatedTo: "", evidencedBy: "x-ray" });

		const data2 = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
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
		expect(data.appointments).toBe("07/01/2026, 08/01/2026");
	});

	test("formats dates using a custom config.format.date pattern", () => {
		const data = convertData(validPlan, {
			...DEFAULT_CONFIG,
			format: { ...DEFAULT_CONFIG.format, date: "DD.MM.YYYY" },
		});

		expect(data.patient.dob).toBe("01.01.1990");
		expect(data.appointments).toBe("01.07.2026, 01.08.2026");
	});

	test("joins appointment dates using a custom config.format.appointment separator", () => {
		const data = convertData(validPlan, {
			...DEFAULT_CONFIG,
			format: { ...DEFAULT_CONFIG.format, appointment: " / " },
		});

		expect(data.appointments).toBe("07/01/2026 / 08/01/2026");
	});

	test("joins an empty appointments list into an empty string", () => {
		const data = convertData({ ...validPlan, appointments: [] });

		expect(data.appointments).toBe("");
	});

	function goalWithDoneBy(doneBy: { date?: string; relative?: string } | undefined) {
		return convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [
						doneBy === undefined
							? { task: "brush twice a day", outcome: { status: "unmet" as const } }
							: { task: "brush twice a day", doneBy, outcome: { status: "unmet" as const } },
					],
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
		expect(data.statements[0]?.goals[0]?.doneBy).toBe("08/01/2026 / by next visit");
	});

	test("uses a custom config.format.goal.doneBy pattern when both are given", () => {
		const data = convertData(
			{
				patient: PATIENT,
				appointments: APPOINTMENTS,
				subjective: { complaint: "sensitive teeth" },
				objective: {
					medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
					exams: { findings: ["no visible caries"], referrals: "none" },
				},
				needs: [
					{
						type: "integrity",
						isMet: false,
						relatedTo: "gum disease",
						evidencedBy: "x-ray",
						goals: [
							{
								task: "brush twice a day",
								doneBy: { date: "2026-08-01", relative: "by next visit" },
								outcome: { status: "unmet" },
							},
						],
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

	test("copies interventions onto a goal, defaulting to an empty array", () => {
		const data = convertData(validPlan);

		expect(data.statements[0]?.goals[0]?.interventions).toEqual(["oral hygiene education"]);

		const dataWithoutInterventions = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily", outcome: { status: "unmet" } }],
				},
			],
		});
		expect(dataWithoutInterventions.statements[0]?.goals[0]?.interventions).toEqual([]);
	});

	test("maps outcome status to a display label, one case per status", () => {
		const met = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily", outcome: { status: "met", note: "resolved" } }],
				},
			],
		});
		expect(met.statements[0]?.goals[0]?.outcome).toEqual({ label: "Met", note: "resolved" });

		const partial = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily", outcome: { status: "partial" } }],
				},
			],
		});
		expect(partial.statements[0]?.goals[0]?.outcome).toEqual({
			label: "Partially met",
			note: undefined,
		});

		const unmet = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily", outcome: { status: "unmet" } }],
				},
			],
		});
		expect(unmet.statements[0]?.goals[0]?.outcome).toEqual({ label: "Not met", note: undefined });
	});

	test("labels a goal's outcome as undefined when no outcome is given", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [{ task: "floss daily" }],
				},
			],
		});
		expect(data.statements[0]?.goals[0]?.outcome).toEqual({ label: "TBD", note: undefined });
	});

	test("uses a custom config's mapping.outcome labels instead of the defaults", () => {
		const customConfig = {
			...DEFAULT_CONFIG,
			mapping: {
				...DEFAULT_CONFIG.mapping,
				outcome: { met: "Achieved", partial: "In progress", unmet: "Pending", undefined: "TBD" },
			},
		};

		const data = convertData(
			{
				patient: PATIENT,
				appointments: APPOINTMENTS,
				subjective: { complaint: "sensitive teeth" },
				objective: {
					medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
					exams: { findings: ["no visible caries"], referrals: "none" },
				},
				needs: [
					{
						type: "integrity",
						isMet: false,
						relatedTo: "gum disease",
						evidencedBy: "x-ray",
						goals: [{ task: "floss daily", outcome: { status: "partial" } }],
					},
				],
			},
			customConfig,
		);

		expect(data.statements[0]?.goals[0]?.outcome).toEqual({
			label: "In progress",
			note: undefined,
		});
	});

	test("two goals on the same statement carry independent interventions and outcomes", () => {
		const data = convertData({
			patient: PATIENT,
			appointments: APPOINTMENTS,
			subjective: { complaint: "sensitive teeth" },
			objective: {
				medical: { bmi: "22.4", medications: "none", allergies: "none", asa: "I" },
				exams: { findings: ["no visible caries"], referrals: "none" },
			},
			needs: [
				{
					type: "integrity",
					isMet: false,
					relatedTo: "gum disease",
					evidencedBy: "x-ray",
					goals: [
						{
							task: "floss daily",
							interventions: ["oral hygiene education"],
							outcome: { status: "met", note: "resolved" },
						},
						{
							task: "brush twice a day",
							outcome: { status: "unmet" },
						},
					],
				},
			],
		});

		expect(data.statements[0]?.goals).toEqual([
			{
				label: "1a",
				task: "floss daily",
				doneBy: undefined,
				interventions: ["oral hygiene education"],
				outcome: { label: "Met", note: "resolved" },
			},
			{
				label: "1b",
				task: "brush twice a day",
				doneBy: undefined,
				interventions: [],
				outcome: { label: "Not met", note: undefined },
			},
		]);
	});
});
