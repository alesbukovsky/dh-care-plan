import type { Plan } from "@dh-care-plan/core";
import { Field, type FieldDefinition, FieldGroup } from "./fields";
import { PlusIcon, TrashIcon } from "./icons";
import Section from "./Section";

type Appointments = Plan["appointments"];
type Appointment = NonNullable<NonNullable<Appointments>["planned"]>[number];

const APPOINTMENT_FIELDS: FieldDefinition<Appointment>[] = [
	{ key: "length", label: "Estimated Length", placeholder: "e.g. 60 minutes" },
	{
		key: "prophylaxis",
		label: "Prophylaxis (TX)",
		placeholder: "cleaning to perform",
		multiline: true,
	},
	{
		key: "instruction",
		label: "Instruction (OHI)",
		placeholder: "oral hygiene instruction given",
		multiline: true,
	},
	{
		key: "recommendation",
		label: "Recommendation",
		placeholder: "e.g. return in 3 months",
		multiline: true,
	},
	{ key: "referral", label: "Referral", placeholder: "referral made", multiline: true },
];

interface AppointmentsSectionProps {
	appointments: Appointments;
	onChange: (next: Appointments) => void;
}

export default function AppointmentsSection({ appointments, onChange }: AppointmentsSectionProps) {
	const interval = appointments?.interval;
	const items = appointments?.planned ?? [];

	function updateAppointment(index: number, next: Appointment) {
		onChange({
			...appointments,
			planned: items.map((appointment, i) => (i === index ? next : appointment)),
		});
	}

	function addAppointment() {
		onChange({ ...appointments, planned: [...items, {}] });
	}

	function removeAppointment(index: number) {
		const next = items.filter((_, i) => i !== index);
		onChange({ ...appointments, planned: next.length > 0 ? next : undefined });
	}

	return (
		<Section title="Appointments" hint="Planned future appointments" badge={String(items.length)}>
			<Field
				label="Recommended interval of care"
				placeholder="e.g. 3 months"
				value={interval}
				onChange={(next) => onChange({ ...appointments, interval: next })}
			/>
			<div className="space-y-3">
				{items.map((appointment, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: appointments have no stable id in the schema
						key={`appointment-${index}`}
						className="space-y-3 rounded-lg border border-[#D8DED9] bg-[#F6F5F0] p-3"
					>
						<div className="flex items-center justify-between">
							<span className="font-serif text-sm text-[#7C8B86]">Appointment {index + 1}</span>
							<button
								type="button"
								title="Remove appointment"
								onClick={() => removeAppointment(index)}
								className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
							>
								<TrashIcon />
							</button>
						</div>
						<FieldGroup
							fields={APPOINTMENT_FIELDS}
							value={appointment}
							onChange={(next) => updateAppointment(index, next)}
						/>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={addAppointment}
				className="mt-3 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
			>
				<PlusIcon className="h-3.5 w-3.5" /> Add appointment
			</button>
		</Section>
	);
}
