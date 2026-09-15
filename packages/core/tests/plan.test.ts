import { describe, expect, test } from "vitest";
import {
	DEFAULT_PLAN,
	migratePlan,
	NEED_TYPES,
	Need,
	PLAN_VERSION,
	Plan,
} from "../src/schema/plan";

const baseGoal = { task: "floss daily", outcome: { status: "unmet" as const } };

const PATIENT = { initials: "J.D.", dob: "1990-01-01", chartId: "12345" };

function needWithGoal(doneBy?: unknown) {
	return {
		type: "integrity" as const,
		exists: true,
		relatedTo: "gum disease",
		evidencedBy: "x-ray",
		goals: [doneBy === undefined ? baseGoal : { ...baseGoal, doneBy }],
	};
}

describe("Goal.doneBy", () => {
	test("parses with no doneBy at all", () => {
		const need = Need.parse(needWithGoal());
		expect(need.goals?.[0]?.doneBy).toBeUndefined();
	});

	test("parses with only a date", () => {
		const need = Need.parse(needWithGoal({ date: "2026-08-01" }));
		expect(need.goals?.[0]?.doneBy).toEqual({ date: "2026-08-01" });
	});

	test("parses with only a relative term", () => {
		const need = Need.parse(needWithGoal({ relative: "by next visit" }));
		expect(need.goals?.[0]?.doneBy).toEqual({ relative: "by next visit" });
	});

	test("parses with both a date and a relative term", () => {
		const need = Need.parse(needWithGoal({ date: "2026-08-01", relative: "by next visit" }));
		expect(need.goals?.[0]?.doneBy).toEqual({
			date: "2026-08-01",
			relative: "by next visit",
		});
	});
});

describe("Patient", () => {
	test("parses with no fields at all, so they can be filled in later", () => {
		const plan = Plan.parse({ ...DEFAULT_PLAN, patient: {} });

		expect(plan.patient).toEqual({});
	});

	test("still rejects a field that is present but malformed", () => {
		expect(() => Plan.parse({ ...DEFAULT_PLAN, patient: { chartId: 12345 } })).toThrow();
	});

	test("accepts dob as free text, not just an ISO date", () => {
		const plan = Plan.parse({ ...DEFAULT_PLAN, patient: { dob: "01/17/2001 (age: 25)" } });

		expect(plan.patient.dob).toBe("01/17/2001 (age: 25)");
	});
});

describe("NEED_TYPES", () => {
	test("matches Need.type's enum values, in the order the enum declares them", () => {
		expect(NEED_TYPES).toEqual(Need.shape.type.options);
	});
});

describe("DEFAULT_PLAN", () => {
	test("is a valid plan", () => {
		expect(Plan.parse(DEFAULT_PLAN)).toEqual(DEFAULT_PLAN);
	});

	// Checked against the enum itself, not NEED_TYPES, so this holds independently
	// of the constant DEFAULT_PLAN is built from.
	test("carries exactly one need per Need.type enum value, in enum order", () => {
		expect(DEFAULT_PLAN.needs.map((need) => need.type)).toEqual([...Need.shape.type.options]);
	});

	test("carries every need unassessed, with nothing but its type", () => {
		expect(DEFAULT_PLAN.needs).toEqual(Need.shape.type.options.map((type) => ({ type })));
	});

	test("holds nothing else: no patient or findings", () => {
		expect(DEFAULT_PLAN).toMatchObject({
			patient: {},
			subjective: {},
			objective: {},
		});
	});
});

describe("Plan with the new Goal.doneBy shape", () => {
	test("parses a full plan using the object doneBy shape", () => {
		const plan = {
			patient: PATIENT,
			needs: [needWithGoal({ date: "2026-08-01", relative: "by next visit" })],
		};

		expect(() => Need.array().parse(plan.needs)).not.toThrow();
	});
});

describe("migratePlan", () => {
	test("data with no version field is assumed to be version 1, and stamped with the current version", () => {
		const migrated = migratePlan({ objective: { exams: { findings: "no visible caries" } } });

		expect(migrated).toEqual({
			version: PLAN_VERSION,
			data: {
				version: PLAN_VERSION,
				objective: { exams: { findings: "no visible caries" } },
			},
		});
	});

	test("data already at the current version passes through unchanged", () => {
		expect(migratePlan(DEFAULT_PLAN)).toEqual({ version: PLAN_VERSION, data: DEFAULT_PLAN });
	});

	test("a version newer than this build understands returns null", () => {
		expect(migratePlan({ ...DEFAULT_PLAN, version: PLAN_VERSION + 1 })).toBeNull();
	});
});
