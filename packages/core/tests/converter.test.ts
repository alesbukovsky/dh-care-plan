import { describe, expect, test } from "vitest";
import { convertData, dateStr } from "../src/converter";
import { DEFAULT_CONFIG } from "../src/schema/config";
import { DEFAULT_PLAN, Need } from "../src/schema/plan";

const PATIENT = { initials: "J.D.", dob: "1990-01-01", chartId: "12345" };

const validPlan = {
	patient: PATIENT,
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
				met: DEFAULT_CONFIG.mapping.met.true,
				priority: undefined,
				rationale: undefined,
			},
			{
				need: DEFAULT_CONFIG.mapping.need.integrity,
				met: DEFAULT_CONFIG.mapping.met.false,
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

	test("gives an unmet need without goals an empty goals array", () => {
		const data = convertData({
			patient: PATIENT,
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

	test("formats patient.dob using config.format.date, otherwise copying patient fields unchanged", () => {
		const data = convertData(validPlan);

		expect(data.patient).toEqual({ ...PATIENT, dob: "01/01/1990" });
	});

	test("orders objective.visits oldest to newest, formatting and joining using config.format.date/visits", () => {
		const data = convertData({
			...validPlan,
			objective: {
				...validPlan.objective,
				visits: [
					{ date: "2026-08-01", vitals: "BP 120/80" },
					{ date: "2026-07-01", vitals: "BP 118/76" },
				],
			},
		});

		expect(data.visits).toBe("07/01/2026, 08/01/2026");
	});

	test("leaves visits undefined when objective.visits is missing or empty", () => {
		expect(convertData(validPlan).visits).toBeUndefined();
		expect(
			convertData({ ...validPlan, objective: { ...validPlan.objective, visits: [] } }).visits,
		).toBeUndefined();
	});

	test("maps appointments onto the template 1:1, labelling each with its position", () => {
		const planned = [
			{
				length: "60 minutes",
				prophylaxis: "full mouth debridement",
				instruction: "flossing technique",
				recommendation: "return in 3 months",
				referral: "none",
			},
			{ length: "30 minutes" },
		];

		const data = convertData({
			...validPlan,
			appointments: { interval: "3 months", planned },
		});

		expect(data.appointments).toEqual({
			interval: "3 months",
			planned: [
				{ ...planned[0], label: "1" },
				{ ...planned[1], label: "2" },
			],
		});
	});

	test("defaults appointments.interval and appointments.planned when the plan has none", () => {
		expect(convertData(validPlan).appointments).toEqual({ interval: undefined, planned: [] });
	});

	test("orders objective.medical.vitals oldest to newest, formatting each using config.format.vitals", () => {
		const data = convertData({
			...validPlan,
			objective: {
				...validPlan.objective,
				visits: [
					{ date: "2026-08-01", vitals: "BP 120/80" },
					{ date: "2026-07-01", vitals: "BP 118/76" },
				],
			},
		});

		expect(data.objective.medical?.vitals).toEqual([
			"Appointment 07/01/2026: BP 118/76",
			"Appointment 08/01/2026: BP 120/80",
		]);
	});

	test("skips a visit's vitals when absent, without disturbing date order", () => {
		const data = convertData({
			...validPlan,
			objective: {
				...validPlan.objective,
				visits: [{ date: "2026-08-01", vitals: "BP 120/80" }, { date: "2026-07-01" }],
			},
		});

		expect(data.objective.medical?.vitals).toEqual(["Appointment 08/01/2026: BP 120/80"]);
	});

	test("uses a custom config.format.vitals pattern", () => {
		const data = convertData(
			{
				...validPlan,
				objective: {
					...validPlan.objective,
					visits: [{ date: "2026-08-01", vitals: "BP 120/80" }],
				},
			},
			{
				...DEFAULT_CONFIG,
				format: { ...DEFAULT_CONFIG.format, vitals: "{date} — {vitals}" },
			},
		);

		expect(data.objective.medical?.vitals).toEqual(["08/01/2026 — BP 120/80"]);
	});

	test("leaves objective.medical.vitals undefined when objective.visits is missing or empty", () => {
		expect(convertData(validPlan).objective.medical?.vitals).toBeUndefined();
		expect(
			convertData({ ...validPlan, objective: { ...validPlan.objective, visits: [] } }).objective
				.medical?.vitals,
		).toBeUndefined();
	});

	test("renders missing patient fields as empty text", () => {
		const data = convertData({ ...validPlan, patient: {} });

		expect(data.patient).toEqual({ initials: "", dob: "", chartId: "" });
	});

	test("lists an unassessed need as undecided, without a diagnosis statement", () => {
		const data = convertData({ ...validPlan, needs: [{ type: "health" }] });

		expect(data.assessments).toEqual([
			{
				need: DEFAULT_CONFIG.mapping.need.health,
				met: DEFAULT_CONFIG.mapping.met.undefined,
			},
		]);
		expect(data.statements).toEqual([]);
	});

	test("converts a brand new plan into an empty document", () => {
		const data = convertData(DEFAULT_PLAN);

		expect(data.patient).toEqual({ initials: "", dob: "", chartId: "" });
		expect(data.assessments).toHaveLength(Need.shape.type.options.length);
		expect(
			data.assessments.every((assessment) => assessment.met === DEFAULT_CONFIG.mapping.met.undefined),
		).toBe(true);
		expect(data.statements).toEqual([]);
	});

	test("formats dates using a custom config.format.date pattern", () => {
		const data = convertData(validPlan, {
			...DEFAULT_CONFIG,
			format: { ...DEFAULT_CONFIG.format, date: "DD.MM.YYYY" },
		});

		expect(data.patient.dob).toBe("01.01.1990");
	});

	function goalWithDoneBy(doneBy: { date?: string; relative?: string } | undefined) {
		return convertData({
			patient: PATIENT,
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
