import type { Plan } from "dh-care-plan/schema";
import { type FieldDefinition, FieldGroup } from "./fields";
import Section from "./Section";

type Subjective = Plan["subjective"];

const FIELDS: FieldDefinition<Subjective>[] = [
	{
		key: "complaint",
		label: "Chief complaint",
		placeholder: "patient's primary concern",
		multiline: true,
	},
	{
		key: "personal",
		label: "Personal history",
		placeholder: "age, race, pronouns, birth gender, residence, water fluoridation",
		multiline: true,
	},
	{
		key: "medical",
		label: "Medical history",
		placeholder: "conditions reported by the client",
		multiline: true,
	},
	{
		key: "dental",
		label: "Dental history",
		placeholder: "home care, previous treatment",
		multiline: true,
	},
	{
		key: "social",
		label: "Social history",
		placeholder: "occupation, family, tobacco, diet, habits",
		multiline: true,
	},
	{
		key: "significance",
		label: "Significance to care",
		placeholder: "how the history affects this plan",
		multiline: true,
	},
	{
		key: "other",
		label: "Other",
		placeholder: "anything else the patient reported",
		multiline: true,
	},
];

interface SubjectiveSectionProps {
	subjective: Subjective;
	onChange: (next: Subjective) => void;
}

export default function SubjectiveSection({ subjective, onChange }: SubjectiveSectionProps) {
	return (
		<Section title="Subjective data" hint="What the patient reports">
			<FieldGroup fields={FIELDS} value={subjective} onChange={onChange} />
		</Section>
	);
}
