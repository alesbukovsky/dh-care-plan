import type { Config, Plan } from "@dh-care-plan/core";
import DobCalculatorButton from "./DobCalculatorButton";
import { Field } from "./fields";
import Section from "./Section";

export { calculateAge } from "../age";

type Patient = Plan["patient"];

interface PatientSectionProps {
	patient: Patient;
	onChangePatient: (next: Patient) => void;
	config: Config;
}

export default function PatientSection({ patient, onChangePatient, config }: PatientSectionProps) {
	return (
		<Section title="Patient" hint="Personal information" badge={patient.initials}>
			<div className="grid grid-cols-5 gap-3">
				<Field
					label="Initials"
					placeholder="e.g. J.D."
					value={patient.initials}
					onChange={(next) => onChangePatient({ ...patient, initials: next })}
					className="col-span-1"
				/>
				<Field
					label="Chart ID"
					placeholder="e.g. 12345"
					value={patient.chartId}
					onChange={(next) => onChangePatient({ ...patient, chartId: next })}
					className="col-span-2"
				/>
				<Field
					label="Date of birth"
					placeholder="e.g. 01/17/1990 (age: 35)"
					value={patient.dob}
					onChange={(next) => onChangePatient({ ...patient, dob: next })}
					className="col-span-2"
					extra={
						<DobCalculatorButton
							config={config}
							onAccept={(next) => onChangePatient({ ...patient, dob: next })}
						/>
					}
				/>
			</div>
		</Section>
	);
}
