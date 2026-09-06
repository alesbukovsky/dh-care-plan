import type { Plan } from "@dh-care-plan/core";
import { type FieldDefinition, FieldGroup } from "./fields";
import { PlusIcon, TrashIcon } from "./icons";
import Section from "./Section";

type Condition = Plan["conditions"][number];

const CONDITION_FIELDS: FieldDefinition<Condition>[] = [
	{ key: "description", label: "Condition", placeholder: "e.g. Type 2 diabetes" },
	{
		key: "medications",
		label: "Medications",
		placeholder: "drug and dose",
		multiline: true,
	},
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
		onChange([...conditions, {}]);
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
								fields={CONDITION_FIELDS}
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
