import { describe, expect, test } from "bun:test";
import { Need } from "../src/schema/plan";

const baseGoal = { task: "floss daily", outcome: { status: "unmet" as const } };

const PATIENT = { initials: "J.D.", dob: "1990-01-01", chartId: "12345" };

function needWithGoal(doneBy?: unknown) {
	return {
		type: "integrity" as const,
		name: "brushing",
		isMet: false,
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

describe("Plan with the new Goal.doneBy shape", () => {
	test("parses a full plan using the object doneBy shape", () => {
		const plan = {
			patient: PATIENT,
			appointments: ["2026-07-01"],
			needs: [needWithGoal({ date: "2026-08-01", relative: "by next visit" })],
		};

		expect(() => Need.array().parse(plan.needs)).not.toThrow();
	});
});
