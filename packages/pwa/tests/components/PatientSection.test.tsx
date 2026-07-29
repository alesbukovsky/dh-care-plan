import { fireEvent, render, screen } from "@testing-library/react";
import type { Plan } from "dh-care-plan/schema";
import { useState } from "react";
import { expect, test } from "vitest";
import PatientSection, { calculateAge } from "../../src/components/PatientSection";

type Patient = Plan["patient"];

let latest: Patient;

function Harness(props: { initial: Patient }) {
	const [patient, setPatient] = useState<Patient>(props.initial);
	latest = patient;
	return <PatientSection patient={patient} onChangePatient={setPatient} />;
}

const patient: Patient = { initials: "J.D.", chartId: "12345", dob: "1990-06-15" };

function expand() {
	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));
}

test("clearing a patient field keeps it as empty text rather than dropping it", () => {
	render(<Harness initial={patient} />);
	expand();

	// Field reports an emptied input as undefined; the patient shape has no room for that.
	fireEvent.change(screen.getByLabelText("Initials"), { target: { value: "" } });
	expect(latest).toEqual({ ...patient, initials: "" });

	fireEvent.change(screen.getByLabelText("Chart ID"), { target: { value: "" } });
	expect(latest).toEqual({ ...patient, initials: "", chartId: "" });

	fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "" } });
	expect(latest).toEqual({ initials: "", chartId: "", dob: "" });
});

test("age shows a dash until the date of birth is a real date", () => {
	render(<Harness initial={{ ...patient, dob: "" }} />);
	expand();

	expect(screen.getByLabelText("Age")).toHaveValue("—");

	fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-06-15" } });
	expect(screen.getByLabelText("Age")).not.toHaveValue("—");
});

test("calculateAge counts whole years elapsed on the given day", () => {
	expect(calculateAge("1990-06-15", new Date("2020-06-15T00:00:00"))).toBe(30);
	// the day before the birthday is still the previous age
	expect(calculateAge("1990-06-15", new Date("2020-06-14T00:00:00"))).toBe(29);
	expect(calculateAge("1990-07-01", new Date("2020-06-15T00:00:00"))).toBe(29);
	// a date of birth in the future has no age to show
	expect(calculateAge("2030-06-15", new Date("2020-06-15T00:00:00"))).toBeUndefined();
	expect(calculateAge("not-a-date")).toBeUndefined();
});
