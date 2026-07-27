import type { Plan } from "dh-care-plan/schema";
import { countFilled, type FieldDefinition, FieldGroup } from "./fields";
import Section from "./Section";

type Subjective = Plan["subjective"];

const FIELDS: FieldDefinition<Subjective>[] = [
	{
		key: "complaint",
		label: "Chief complaint",
		placeholder: "why the client came in",
		multiline: true,
	},
	{
		key: "personal",
		label: "Personal history",
		placeholder: "age, occupation, circumstances",
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
		placeholder: "tobacco, diet, habits",
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
		placeholder: "anything else the client reported",
		multiline: true,
	},
];

interface SubjectiveSectionProps {
	subjective: Subjective;
	onChange: (next: Subjective) => void;
}

export default function SubjectiveSection({ subjective, onChange }: SubjectiveSectionProps) {
	return (
		<Section
			title="Subjective"
			hint="What the client reports"
			badge={`${countFilled(subjective)}/${FIELDS.length}`}
		>
			<FieldGroup fields={FIELDS} value={subjective} onChange={onChange} />
		</Section>
	);
}
