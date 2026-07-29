import type { Plan } from "@dh-care-plan/core/schema";
import { DerivedField, Field } from "./fields";
import Section from "./Section";

type Patient = Plan["patient"];

export function calculateAge(dob: string, on: Date = new Date()): number | undefined {
	const [year, month, day] = dob.split("-").map(Number);
	if (!year || !month || !day) return undefined;

	let age = on.getFullYear() - year;
	const beforeBirthday =
		on.getMonth() + 1 < month || (on.getMonth() + 1 === month && on.getDate() < day);
	if (beforeBirthday) age -= 1;

	return age >= 0 ? age : undefined;
}

interface PatientSectionProps {
	patient: Patient;
	onChangePatient: (next: Patient) => void;
}

export default function PatientSection({ patient, onChangePatient }: PatientSectionProps) {
	const age = calculateAge(patient.dob);

	return (
		<Section title="Patient" hint="Personal information" badge={patient.initials}>
			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Initials"
					placeholder="e.g. J.D."
					value={patient.initials}
					onChange={(next) => onChangePatient({ ...patient, initials: next ?? "" })}
				/>
				<Field
					label="Chart ID"
					placeholder="e.g. 12345"
					value={patient.chartId}
					onChange={(next) => onChangePatient({ ...patient, chartId: next ?? "" })}
				/>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Field
					label="Date of birth"
					type="date"
					value={patient.dob}
					onChange={(next) => onChangePatient({ ...patient, dob: next ?? "" })}
				/>
				<DerivedField
					label="Age"
					hint="Calculated from the date of birth"
					value={age === undefined ? "—" : `${age} years`}
				/>
			</div>
		</Section>
	);
}
