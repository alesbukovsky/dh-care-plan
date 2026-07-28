import type { Plan } from "dh-care-plan/schema";
import { Field, type FieldDefinition, FieldGroup, StringListField } from "./fields";
import Section from "./Section";
import Subsection from "./Subsection";

type Objective = Plan["objective"];
type Medical = NonNullable<Objective["medical"]>;
type Restorative = NonNullable<Objective["restorative"]>;
type Periodontal = NonNullable<Objective["periodontal"]>;

const MEDICAL_FIELDS: FieldDefinition<Medical>[] = [
	{ key: "bmi", label: "BMI", placeholder: "e.g. 22.4", width: "half" },
	{ key: "asa", label: "ASA class", placeholder: "e.g. II", width: "half" },
	{
		key: "medications",
		label: "Medications",
		placeholder: "drug, dose, oral implications",
		multiline: true,
	},
	{ key: "allergies", label: "Allergies", placeholder: "allergen and reaction", multiline: true },
	{
		key: "diseases",
		label: "Diseases / conditions",
		placeholder: "systemic findings",
		multiline: true,
	},
	{
		key: "referrals",
		label: "Need for referrals",
		placeholder: "medical referrals made",
		multiline: true,
	},
];

const RESTORATIVE_FIELDS: FieldDefinition<Restorative>[] = [
	{ key: "caries", label: "Caries", placeholder: "teeth and surfaces affected", multiline: true },
	{
		key: "restorations",
		label: "Restorations",
		placeholder: "existing and defective restorations",
		multiline: true,
	},
	{ key: "risk", label: "Caries risk", placeholder: "e.g. low", width: "half" },
	{ key: "occlusion", label: "Occlusion", placeholder: "e.g. class I", width: "half" },
	{
		key: "referrals",
		label: "Need for referrals",
		placeholder: "restorative referrals made",
		multiline: true,
	},
];

const PERIODONTAL_FIELDS: FieldDefinition<Periodontal>[] = [
	{
		key: "gingiva",
		label: "Gingiva description",
		placeholder: "color, contour, consistency",
		multiline: true,
	},
	{ key: "aap", label: "AAP assessment", placeholder: "e.g. stage II grade B" },
	{ key: "debridement", label: "Debridement Skill", placeholder: "e.g. 2", width: "third" },
	{ key: "gi", label: "Gingival index (GI)", placeholder: "e.g. 1.2", width: "third" },
	{ key: "pi", label: "Plaque index (PI)", placeholder: "e.g. 1.8", width: "third" },
	{
		key: "referrals",
		label: "Need for referrals",
		placeholder: "periodontal referrals made",
		multiline: true,
	},
];

interface ObjectiveSectionProps {
	objective: Objective;
	onChange: (next: Objective) => void;
}

export default function ObjectiveSection({ objective, onChange }: ObjectiveSectionProps) {
	const findings = objective.exams?.findings ?? [];

	return (
		<Section title="Objective data" hint="Clinical findings from assessment">
			<Subsection title="Medical history">
				<FieldGroup
					fields={MEDICAL_FIELDS}
					value={objective.medical}
					onChange={(medical) => onChange({ ...objective, medical })}
				/>
			</Subsection>

			<Subsection title="Extraoral / intraoral exams">
				<StringListField
					label="Findings"
					placeholder="e.g. no visible lesions"
					addLabel="Add finding"
					values={findings}
					onChange={(next) =>
						onChange({ ...objective, exams: { ...objective.exams, findings: next } })
					}
				/>
				<Field
					label="Need for referrals"
					placeholder="referrals from the exams"
					multiline
					value={objective.exams?.referrals}
					onChange={(referrals) =>
						onChange({ ...objective, exams: { ...objective.exams, referrals } })
					}
				/>
			</Subsection>

			<Subsection title="Restorative assessment">
				<FieldGroup
					fields={RESTORATIVE_FIELDS}
					value={objective.restorative}
					onChange={(restorative) => onChange({ ...objective, restorative })}
				/>
			</Subsection>

			<Subsection title="Periodontal assessment">
				<FieldGroup
					fields={PERIODONTAL_FIELDS}
					value={objective.periodontal}
					onChange={(periodontal) => onChange({ ...objective, periodontal })}
				/>
			</Subsection>

			<Subsection title="Other findings">
				<Field
					label="Radiographic needs"
					placeholder="radiographs taken and findings"
					multiline
					value={objective.radiographic}
					onChange={(radiographic) => onChange({ ...objective, radiographic })}
				/>
				<Field
					label="Diagnostic needs"
					placeholder="diagnostic tests and results"
					multiline
					value={objective.diagnostic}
					onChange={(diagnostic) => onChange({ ...objective, diagnostic })}
				/>
			</Subsection>
		</Section>
	);
}
