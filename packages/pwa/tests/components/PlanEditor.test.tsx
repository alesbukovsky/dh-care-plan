import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Plan } from "dh-care-plan/schema";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { calculateAge } from "../../src/components/PatientSection";
import PlanEditor from "../../src/components/PlanEditor";

afterEach(cleanup);

function required<T>(value: T | undefined | null): T {
	if (value === undefined || value === null) throw new Error("expected value to be defined");
	return value;
}

let latest: Plan;

function Harness() {
	const [plan, setPlan] = useState<Plan>({
		patient: { initials: "", dob: "", chartId: "" },
		appointments: [],
		subjective: {},
		objective: {},
		needs: [],
	});
	latest = plan;
	return <PlanEditor plan={plan} onChange={setPlan} />;
}

function expand(title: string) {
	fireEvent.click(required(screen.getByRole("heading", { name: title }).closest("button")));
}

test("patient identifiers are editable", () => {
	render(<Harness />);
	expand("Patient");

	fireEvent.change(screen.getByLabelText("Initials"), { target: { value: "J.D." } });
	fireEvent.change(screen.getByLabelText("Chart ID"), { target: { value: "12345" } });
	fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-01-01" } });

	expect(latest.patient).toEqual({ initials: "J.D.", dob: "1990-01-01", chartId: "12345" });
});

test("age is derived from the date of birth and is not editable", () => {
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(new Date("2026-07-27T12:00:00Z"));

	render(<Harness />);
	expand("Patient");

	const ageField = screen.getByLabelText("Age");
	expect(ageField).toHaveValue("—");
	expect(ageField).toHaveAttribute("readonly");

	fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-01-01" } });

	expect(screen.getByLabelText("Age")).toHaveValue("36 years");
	expect(latest.patient).not.toHaveProperty("age");

	vi.useRealTimers();
});

test("age accounts for a birthday that has not happened yet this year", () => {
	const on = new Date("2026-07-27T12:00:00Z");

	expect(calculateAge("1990-07-27", on)).toBe(36);
	expect(calculateAge("1990-07-28", on)).toBe(35);
	expect(calculateAge("1990-08-01", on)).toBe(35);
	expect(calculateAge("", on)).toBeUndefined();
	expect(calculateAge("2030-01-01", on)).toBeUndefined();
});

test("subjective fields are stored under their own keys", () => {
	render(<Harness />);
	expand("Subjective data");

	fireEvent.change(screen.getByLabelText("Chief complaint"), {
		target: { value: "sensitive teeth" },
	});
	fireEvent.change(screen.getByLabelText("Dental history"), {
		target: { value: "does not floss" },
	});

	expect(latest.subjective).toEqual({
		complaint: "sensitive teeth",
		dental: "does not floss",
	});
});

test("objective groups, exam findings, and other findings are editable", () => {
	render(<Harness />);
	expand("Objective");

	fireEvent.change(screen.getByLabelText("ASA classification"), { target: { value: "II" } });
	fireEvent.change(screen.getByLabelText("Caries risk"), { target: { value: "low" } });
	fireEvent.change(screen.getByLabelText("Gingival index (GI)"), { target: { value: "1.2" } });
	fireEvent.change(screen.getByLabelText("Radiographic"), { target: { value: "none needed" } });

	fireEvent.click(screen.getByRole("button", { name: "Add finding" }));
	fireEvent.change(required(screen.getAllByPlaceholderText("e.g. no visible lesions")[0]), {
		target: { value: "no visible caries" },
	});

	expect(latest.objective).toEqual({
		medical: { asa: "II" },
		restorative: { risk: "low" },
		periodontal: { gi: "1.2" },
		exams: { findings: ["no visible caries"] },
		radiographic: "none needed",
	});
});

test("clearing a field drops it from the plan", () => {
	render(<Harness />);
	expand("Subjective data");

	const complaint = screen.getByLabelText("Chief complaint");
	fireEvent.change(complaint, { target: { value: "sensitive teeth" } });
	fireEvent.change(complaint, { target: { value: "" } });

	expect(latest.subjective.complaint).toBeUndefined();
});
