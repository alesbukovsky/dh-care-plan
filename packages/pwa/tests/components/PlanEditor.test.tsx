import type { Plan } from "@dh-care-plan/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
	expand("Objective data");
	for (const group of [
		"Medical history",
		"Extraoral / intraoral exams",
		"Restorative assessment",
		"Periodontal assessment",
		"Other findings",
	]) {
		expand(group);
	}

	fireEvent.change(screen.getByLabelText("ASA class"), { target: { value: "II" } });
	fireEvent.change(screen.getByLabelText("Caries risk"), { target: { value: "low" } });
	fireEvent.change(screen.getByLabelText("Gingival index (GI)"), { target: { value: "1.2" } });
	fireEvent.change(screen.getByLabelText("Radiographic needs"), {
		target: { value: "none needed" },
	});

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

test("exam findings are edited and removed by position, and the last one drops the list", () => {
	render(<Harness />);
	expand("Objective data");
	expand("Extraoral / intraoral exams");

	fireEvent.click(screen.getByRole("button", { name: "Add finding" }));
	fireEvent.click(screen.getByRole("button", { name: "Add finding" }));
	const findings = screen.getAllByPlaceholderText("e.g. no visible lesions");
	fireEvent.change(required(findings[0]), { target: { value: "no visible lesions" } });
	fireEvent.change(required(findings[1]), { target: { value: "tonsils within normal limits" } });

	expect(latest.objective.exams?.findings).toEqual([
		"no visible lesions",
		"tonsils within normal limits",
	]);

	fireEvent.click(required(screen.getAllByRole("button", { name: "Remove findings entry" })[0]));

	expect(latest.objective.exams?.findings).toEqual(["tonsils within normal limits"]);

	fireEvent.click(screen.getByRole("button", { name: "Remove findings entry" }));

	expect(latest.objective.exams?.findings).toBeUndefined();
});

test("exam referrals and diagnostic needs are stored under their own keys", () => {
	render(<Harness />);
	expand("Objective data");
	expand("Extraoral / intraoral exams");
	expand("Other findings");

	fireEvent.change(screen.getByLabelText("Need for referrals"), {
		target: { value: "oral surgery" },
	});
	fireEvent.change(screen.getByLabelText("Diagnostic needs"), {
		target: { value: "pulp vitality test" },
	});

	expect(latest.objective).toEqual({
		exams: { referrals: "oral surgery" },
		diagnostic: "pulp vitality test",
	});
});

test("assessing a need adds it to the plan and counts it in the badge", () => {
	render(<Harness />);

	expect(screen.getByText("0 assessed / 0 unmet")).toBeInTheDocument();

	expand("Human needs");
	expand("Wholesome facial image");
	fireEvent.click(screen.getByRole("button", { name: "Need is unmet" }));

	expect(latest.needs).toEqual([{ type: "image", isMet: false }]);
	expect(screen.getByText("1 assessed / 1 unmet")).toBeInTheDocument();

	// changing the status of an assessed need replaces it rather than appending
	fireEvent.click(screen.getByRole("button", { name: "Need is met" }));

	expect(latest.needs).toEqual([{ type: "image", isMet: true }]);
	expect(screen.getByText("1 assessed / 0 unmet")).toBeInTheDocument();

	expand("Freedom from anxiety / stress");
	fireEvent.click(required(screen.getAllByRole("button", { name: "Need is unmet" })[1]));

	expect(latest.needs).toEqual([
		{ type: "image", isMet: true },
		{ type: "peace", isMet: false },
	]);
	expect(screen.getByText("2 assessed / 1 unmet")).toBeInTheDocument();

	// updating a need other than the first leaves the earlier ones alone
	fireEvent.click(required(screen.getAllByRole("button", { name: "Need is met" })[1]));

	expect(latest.needs).toEqual([
		{ type: "image", isMet: true },
		{ type: "peace", isMet: true },
	]);
	expect(screen.getByText("2 assessed / 0 unmet")).toBeInTheDocument();
});

test("appointments are added, edited, and removed", () => {
	render(<Harness />);
	expand("Appointments");

	fireEvent.click(screen.getByRole("button", { name: "Add appointment" }));
	fireEvent.change(screen.getByLabelText("Estimated Length"), {
		target: { value: "60 minutes" },
	});
	fireEvent.change(screen.getByLabelText("Prophylaxis (TX)"), {
		target: { value: "full mouth debridement" },
	});

	expect(latest.appointments).toEqual([
		{ length: "60 minutes", prophylaxis: "full mouth debridement" },
	]);

	fireEvent.click(screen.getByRole("button", { name: "Add appointment" }));
	fireEvent.change(required(screen.getAllByLabelText("Estimated Length")[1]), {
		target: { value: "30 minutes" },
	});

	expect(latest.appointments).toEqual([
		{ length: "60 minutes", prophylaxis: "full mouth debridement" },
		{ length: "30 minutes" },
	]);

	fireEvent.click(required(screen.getAllByRole("button", { name: "Remove appointment" })[0]));

	expect(latest.appointments).toEqual([{ length: "30 minutes" }]);

	fireEvent.click(screen.getByRole("button", { name: "Remove appointment" }));

	expect(latest.appointments).toBeUndefined();
});

test("clearing a field drops it from the plan", () => {
	render(<Harness />);
	expand("Subjective data");

	const complaint = screen.getByLabelText("Chief complaint");
	fireEvent.change(complaint, { target: { value: "sensitive teeth" } });
	fireEvent.change(complaint, { target: { value: "" } });

	expect(latest.subjective.complaint).toBeUndefined();
});
