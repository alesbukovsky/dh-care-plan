import { DEFAULT_CONFIG, type Plan } from "@dh-care-plan/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";
import { calculateAge } from "../../src/age";
import PatientSection from "../../src/components/PatientSection";

type Patient = Plan["patient"];

let latest: Patient;

function Harness(props: { initial: Patient }) {
	const [patient, setPatient] = useState<Patient>(props.initial);
	latest = patient;
	return (
		<PatientSection patient={patient} onChangePatient={setPatient} config={DEFAULT_CONFIG} />
	);
}

const patient: Patient = { initials: "J.D.", chartId: "12345", dob: "1990-06-15" };

function expand() {
	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));
}

test("clearing a patient field drops it, since every one of them is optional", () => {
	render(<Harness initial={patient} />);
	expand();

	fireEvent.change(screen.getByLabelText("Initials"), { target: { value: "" } });
	expect(latest).toEqual({ ...patient, initials: undefined });

	fireEvent.change(screen.getByLabelText("Chart ID"), { target: { value: "" } });
	expect(latest).toEqual({ ...patient, initials: undefined, chartId: undefined });

	fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "" } });
	expect(latest).toEqual({});
});

test("date of birth is a free text field", () => {
	render(<Harness initial={{ ...patient, dob: "" }} />);
	expand();

	fireEvent.change(screen.getByLabelText("Date of birth"), {
		target: { value: "06/15/1990 (age: 35)" },
	});
	expect(latest).toEqual({ ...patient, dob: "06/15/1990 (age: 35)" });
});

test("calculateAge counts whole years elapsed on the given day", () => {
	expect(calculateAge("1990-06-15", new Date("2020-06-15T00:00:00"))).toBe(30);
	// the day before the birthday is still the previous age
	expect(calculateAge("1990-06-15", new Date("2020-06-14T00:00:00"))).toBe(29);
	expect(calculateAge("1990-07-01", new Date("2020-06-15T00:00:00"))).toBe(29);
	// a date of birth in the future has no age to show
	expect(calculateAge("2030-06-15", new Date("2020-06-15T00:00:00"))).toBeUndefined();
	expect(calculateAge("not-a-date")).toBeUndefined();
	// a plan may carry no date of birth at all
	expect(calculateAge(undefined)).toBeUndefined();
});
