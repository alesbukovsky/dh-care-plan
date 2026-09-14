import type { Plan } from "@dh-care-plan/core";
import { type FieldDefinition, FieldGroup, inputClass } from "./fields";
import { PlusIcon, TrashIcon } from "./icons";
import Section from "./Section";

type Condition = Plan["conditions"][number];
type Medication = Condition["medications"][number];

const CONDITION_FIELDS_BEFORE_MEDICATIONS: FieldDefinition<Condition>[] = [
	{ key: "name", label: "Name", placeholder: "e.g. Type 2 diabetes", width: "half" },
	{
		key: "description",
		label: "Description",
		placeholder: "diagnosis details, history",
		multiline: true,
	},
];

const CONDITION_FIELDS_AFTER_MEDICATIONS: FieldDefinition<Condition>[] = [
	{
		key: "adverse",
		label: "Adverse effects",
		placeholder: "reactions to watch for",
		multiline: true,
	},
	{
		key: "interactions",
		label: "Drug interactions",
		placeholder: "interactions with dental treatment",
		multiline: true,
	},
	{
		key: "modifications",
		label: "Modifications to care",
		placeholder: "changes to the care plan",
		multiline: true,
	},
	{
		key: "recommendations",
		label: "TX recommendations",
		placeholder: "e.g. consult with physician",
		multiline: true,
	},
];

interface ConditionsSectionProps {
	conditions: Plan["conditions"];
	onChange: (next: Plan["conditions"]) => void;
}

export default function ConditionsSection({ conditions, onChange }: ConditionsSectionProps) {
	function updateCondition(index: number, next: Condition) {
		onChange(conditions.map((condition, i) => (i === index ? next : condition)));
	}

	function addCondition() {
		onChange([...conditions, { medications: [] }]);
	}

	function removeCondition(index: number) {
		onChange(conditions.filter((_, i) => i !== index));
	}

	return (
		<Section
			title="Medical conditions"
			hint="Medical history interpretation"
			badge={String(conditions.length)}
		>
			{conditions.length > 0 && (
				<div className="space-y-3">
					{conditions.map((condition, index) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: conditions have no stable id in the schema
							key={`condition-${index}`}
							className="space-y-3 rounded-lg border border-[#D8DED9] bg-[#F6F5F0] p-3"
						>
							<div className="flex items-center justify-between">
								<span className="font-serif text-sm text-[#7C8B86]">Condition {index + 1}</span>
								<button
									type="button"
									title="Remove condition"
									onClick={() => removeCondition(index)}
									className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
								>
									<TrashIcon />
								</button>
							</div>
							<FieldGroup
								fields={CONDITION_FIELDS_BEFORE_MEDICATIONS}
								value={condition}
								onChange={(next) => updateCondition(index, next)}
							/>
							<MedicationsEditor
								medications={condition.medications}
								onChange={(medications) => updateCondition(index, { ...condition, medications })}
							/>
							<FieldGroup
								fields={CONDITION_FIELDS_AFTER_MEDICATIONS}
								value={condition}
								onChange={(next) => updateCondition(index, next)}
							/>
						</div>
					))}
				</div>
			)}
			<button
				type="button"
				onClick={addCondition}
				className="mt-3 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
			>
				<PlusIcon className="h-3.5 w-3.5" /> Add condition
			</button>
		</Section>
	);
}

interface MedicationsEditorProps {
	medications: Medication[];
	onChange: (next: Medication[]) => void;
}

function MedicationsEditor({ medications, onChange }: MedicationsEditorProps) {
	function updateMedication(index: number, patch: Partial<Medication>) {
		onChange(
			medications.map((medication, i) => (i === index ? { ...medication, ...patch } : medication)),
		);
	}

	function addMedication() {
		onChange([...medications, {}]);
	}

	function removeMedication(index: number) {
		onChange(medications.filter((_, i) => i !== index));
	}

	return (
		<div>
			<p className="mb-1 block font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
				Medications
			</p>
			<div className="space-y-2">
				{medications.map((medication, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: medications have no stable id in the schema
						key={`medication-${index}`}
						className="flex items-center gap-2"
					>
						<input
							type="text"
							className={`w-40 shrink-0 ${inputClass}`}
							placeholder="drug name"
							value={medication.name ?? ""}
							onChange={(event) =>
								updateMedication(index, { name: event.target.value || undefined })
							}
						/>
						<input
							type="text"
							className={`flex-1 ${inputClass}`}
							placeholder="dose, oral implications"
							value={medication.description ?? ""}
							onChange={(event) =>
								updateMedication(index, { description: event.target.value || undefined })
							}
						/>
						<button
							type="button"
							title="Remove medication"
							onClick={() => removeMedication(index)}
							className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
						>
							<TrashIcon />
						</button>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={addMedication}
				className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
			>
				<PlusIcon className="h-3.5 w-3.5" /> Add medication
			</button>
		</div>
	);
}
