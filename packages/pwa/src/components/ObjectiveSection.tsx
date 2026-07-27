import type { Plan } from "dh-care-plan";
import { countFilled, Field, type FieldDefinition, FieldGroup, StringListField } from "./fields";
import Section from "./Section";

type Objective = Plan["objective"];
type Medical = NonNullable<Objective["medical"]>;
type Exams = NonNullable<Objective["exams"]>;
type Restorative = NonNullable<Objective["restorative"]>;
type Periodontal = NonNullable<Objective["periodontal"]>;

const MEDICAL_FIELDS: FieldDefinition<Medical>[] = [
	{ key: "bmi", label: "BMI", placeholder: "e.g. 22.4" },
	{ key: "asa", label: "ASA classification", placeholder: "e.g. II" },
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
	{ key: "referrals", label: "Referrals", placeholder: "medical referrals made", multiline: true },
];

const RESTORATIVE_FIELDS: FieldDefinition<Restorative>[] = [
	{ key: "caries", label: "Caries", placeholder: "teeth and surfaces affected", multiline: true },
	{
		key: "restorations",
		label: "Restorations",
		placeholder: "existing and defective restorations",
		multiline: true,
	},
	{ key: "risk", label: "Caries risk", placeholder: "e.g. low" },
	{ key: "occlusion", label: "Occlusion", placeholder: "e.g. class I" },
	{
		key: "referrals",
		label: "Referrals",
		placeholder: "restorative referrals made",
		multiline: true,
	},
];

const PERIODONTAL_FIELDS: FieldDefinition<Periodontal>[] = [
	{
		key: "gingiva",
		label: "Gingiva",
		placeholder: "colour, contour, consistency",
		multiline: true,
	},
	{ key: "aap", label: "AAP classification", placeholder: "e.g. stage II grade B" },
	{ key: "debridement", label: "Debridement", placeholder: "e.g. moderate, generalized" },
	{ key: "gi", label: "Gingival index (GI)", placeholder: "e.g. 1.2" },
	{ key: "pi", label: "Plaque index (PI)", placeholder: "e.g. 1.8" },
	{
		key: "referrals",
		label: "Referrals",
		placeholder: "periodontal referrals made",
		multiline: true,
	},
];

const EXAMS_FIELDS: FieldDefinition<Exams>[] = [
	{
		key: "referrals",
		label: "Referrals",
		placeholder: "referrals from the exams",
		multiline: true,
	},
];

function countObjective(objective: Objective): number {
	return (
		countFilled(objective.medical) +
		countFilled(objective.exams) +
		countFilled(objective.restorative) +
		countFilled(objective.periodontal) +
		countFilled({ radiographic: objective.radiographic, diagnostic: objective.diagnostic })
	);
}

interface ObjectiveSectionProps {
	objective: Objective;
	onChange: (next: Objective) => void;
}

export default function ObjectiveSection({ objective, onChange }: ObjectiveSectionProps) {
	const findings = objective.exams?.findings ?? [];

	return (
		<Section
			title="Objective"
			hint="Clinical findings from assessment"
			badge={`${countObjective(objective)} filled`}
		>
			<FieldGroup
				title="Medical"
				fields={MEDICAL_FIELDS}
				value={objective.medical}
				onChange={(medical) => onChange({ ...objective, medical })}
			/>

			<FieldGroup
				title="Extraoral / intraoral exams"
				fields={EXAMS_FIELDS}
				value={objective.exams}
				onChange={(exams) => onChange({ ...objective, exams: { ...objective.exams, ...exams } })}
			>
				<StringListField
					label="Findings"
					placeholder="e.g. no visible lesions"
					addLabel="Add finding"
					values={findings}
					onChange={(next) =>
						onChange({ ...objective, exams: { ...objective.exams, findings: next } })
					}
				/>
			</FieldGroup>

			<FieldGroup
				title="Restorative"
				fields={RESTORATIVE_FIELDS}
				value={objective.restorative}
				onChange={(restorative) => onChange({ ...objective, restorative })}
			/>

			<FieldGroup
				title="Periodontal"
				fields={PERIODONTAL_FIELDS}
				value={objective.periodontal}
				onChange={(periodontal) => onChange({ ...objective, periodontal })}
			/>

			<div className="space-y-3">
				<p className="font-serif text-sm font-medium text-[#1E2B27]">Other findings</p>
				<Field
					label="Radiographic"
					placeholder="radiographs taken and findings"
					multiline
					value={objective.radiographic}
					onChange={(radiographic) => onChange({ ...objective, radiographic })}
				/>
				<Field
					label="Diagnostic"
					placeholder="diagnostic tests and results"
					multiline
					value={objective.diagnostic}
					onChange={(diagnostic) => onChange({ ...objective, diagnostic })}
				/>
			</div>
		</Section>
	);
}
