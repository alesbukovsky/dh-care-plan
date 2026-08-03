import { DEFAULT_PLAN, NEED_TYPES, type Plan } from "@dh-care-plan/core";
import { expect, test } from "vitest";
import { readPlanFile } from "../src/import";

const VALID_PLAN: Plan = {
	patient: { initials: "J.D.", dob: "2001-04-17", chartId: "A1234" },
	subjective: { complaint: "Sensitivity on the lower left" },
	objective: { medical: { bmi: "22.4" } },
	needs: [{ type: "health", isMet: false, goals: [{ task: "Reduce plaque score" }] }],
};

function makeFile(contents: string, name = "plan.json"): File {
	return new File([contents], name, { type: "application/json" });
}

function planFile(plan: unknown, name?: string): File {
	return makeFile(JSON.stringify(plan, null, 2), name);
}

test("a valid plan file is accepted and returned", async () => {
	const result = await readPlanFile(planFile(VALID_PLAN));

	expect(result).toEqual({ ok: true, plan: VALID_PLAN });
});

test("an empty file is reported by name", async () => {
	const result = await readPlanFile(makeFile("   \n", "blank.json"));

	expect(result).toMatchObject({ ok: false, issues: [] });
	expect(result.ok ? "" : result.summary).toBe("“blank.json” is empty.");
});

test("a file that is not JSON explains what import expects", async () => {
	const result = await readPlanFile(makeFile("Not a plan, just prose.", "notes.txt"));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.summary).toContain("“notes.txt” is not a JSON file");
	expect(result.issues[0]?.field).toBe("The file");
	expect(result.issues[0]?.message).toBeTruthy();
});

test("an unreadable file is reported instead of thrown", async () => {
	const file = {
		name: "locked.json",
		text: () => Promise.reject(new Error("NotReadableError")),
	} as unknown as File;

	const result = await readPlanFile(file);

	expect(result.ok ? "" : result.summary).toBe(
		"“locked.json” could not be read. Check the file and try again.",
	);
});

test("an empty plan is accepted so an unfilled DOCX can still be rendered", async () => {
	const result = await readPlanFile(planFile({}));

	expect(result).toEqual({
		ok: true,
		plan: {
			patient: {},
			subjective: {},
			objective: {},
			needs: NEED_TYPES.map((type) => ({ type })),
		},
	});
});

test("missing top-level sections are filled in rather than rejected", async () => {
	const result = await readPlanFile(planFile({ patient: { initials: "JD" } }));

	expect(result).toEqual({
		ok: true,
		plan: {
			patient: { initials: "JD" },
			subjective: {},
			objective: {},
			needs: NEED_TYPES.map((type) => ({ type })),
		},
	});
});

test("a single problem is phrased in the singular", async () => {
	const result = await readPlanFile(planFile({ ...VALID_PLAN, needs: "none" }));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.summary).toContain("One field needs attention");
	expect(result.issues).toEqual([
		{
			field: "Human needs",
			message: 'Expected a list, but the file has text ("none").',
		},
	]);
});

test("wrong types name both what was expected and what the file has", async () => {
	const result = await readPlanFile(
		planFile({
			...VALID_PLAN,
			objective: { medical: { bmi: 22.4 }, exams: { findings: "None" } },
			needs: [{ type: "health", isMet: "yes" }],
		}),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual(
		expect.arrayContaining([
			{
				field: "Objective data → Medical history → BMI",
				message: "Expected text, but the file has a number (22.4).",
			},
			{
				field: "Objective data → Exams → Findings",
				message: 'Expected a list, but the file has text ("None").',
			},
			{
				field: "Human needs #1 → Need met",
				message: 'Expected a true/false value, but the file has text ("yes").',
			},
		]),
	);
});

test("bad dates spell out the expected format", async () => {
	const result = await readPlanFile(
		planFile({
			...VALID_PLAN,
			patient: { ...VALID_PLAN.patient, dob: "17/04/2001" },
			objective: { ...VALID_PLAN.objective, visits: [{ date: "2026-13-01" }] },
		}),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{
			field: "Patient → Date of birth",
			message: 'Must be a date written as YYYY-MM-DD, but the file has text ("17/04/2001").',
		},
		{
			field: "Objective data → Visits #1 → Date",
			message: 'Must be a date written as YYYY-MM-DD, but the file has text ("2026-13-01").',
		},
	]);
});

test("an unknown need type lists the allowed values", async () => {
	const result = await readPlanFile(
		planFile({ ...VALID_PLAN, needs: [{ type: "wellness", isMet: true }] }),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{
			field: "Human needs #1 → Need type",
			message:
				"Must be one of: image, peace, integrity, health, comfort, dentition, understanding, responsibility, maintenance.",
		},
	]);
});

test("problems deep inside goals keep their full trail", async () => {
	const result = await readPlanFile(
		planFile({
			...VALID_PLAN,
			needs: [
				{
					type: "health",
					isMet: false,
					goals: [{ task: "Fine" }, { doneBy: { date: "soon" }, outcome: { status: "great" } }],
				},
			],
		}),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual(
		expect.arrayContaining([
			{
				field: "Human needs #1 → Goals #2 → Target date → Date",
				message: 'Must be a date written as YYYY-MM-DD, but the file has text ("soon").',
			},
			{
				field: "Human needs #1 → Goals #2 → Outcome → Status",
				message: "Must be one of: met, partial, unmet.",
			},
		]),
	);
});

test("a JSON file that is not a plan at all is blamed as a whole", async () => {
	const result = await readPlanFile(planFile([]));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{ field: "The file", message: "Expected a group of fields, but the file has a list." },
	]);
});

test("every kind of wrong value is named in plain language", async () => {
	const long = "Sensitivity on the lower left quadrant since last week";
	const result = await readPlanFile(
		planFile({
			...VALID_PLAN,
			patient: { initials: 12, dob: null, chartId: { id: "A1234" } },
			subjective: { complaint: true },
			objective: { medical: { bmi: [22.4] }, exams: { findings: long } },
		}),
	);

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{ field: "Patient → Initials", message: "Expected text, but the file has a number (12)." },
		{
			field: "Patient → Date of birth",
			message: "Expected text, but the file has an empty value.",
		},
		{
			field: "Patient → Chart ID",
			message: "Expected text, but the file has a group of fields.",
		},
		{
			field: "Subjective data → Chief complaint",
			message: "Expected text, but the file has a true/false value (true).",
		},
		{
			field: "Objective data → Medical history → BMI",
			message: "Expected text, but the file has a list.",
		},
		{
			field: "Objective data → Exams → Findings",
			message: `Expected a list, but the file has text ("${long.slice(0, 30)}…").`,
		},
	]);
});

test("a brand new plan exported before any editing is importable again", async () => {
	const result = await readPlanFile(planFile(DEFAULT_PLAN));

	expect(result).toEqual({ ok: true, plan: DEFAULT_PLAN });
});

test("a patient field left empty by the editor is still rejected as a date", async () => {
	const result = await readPlanFile(planFile({ ...DEFAULT_PLAN, patient: { dob: "" } }));

	if (result.ok) throw new Error("expected the import to fail");
	expect(result.issues).toEqual([
		{
			field: "Patient → Date of birth",
			message: "Must be a date written as YYYY-MM-DD, but the file has empty text.",
		},
	]);
});
