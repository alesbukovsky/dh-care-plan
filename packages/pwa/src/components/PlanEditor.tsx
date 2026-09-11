import type { Need, Plan } from "@dh-care-plan/core";
import { useMemo } from "react";
import { NEEDS } from "../needs";
import { computePriorityErrors } from "../priorityValidation";
import AppointmentsSection from "./AppointmentsSection";
import ConditionsSection from "./ConditionsSection";
import NeedCard from "./NeedCard";
import ObjectiveSection from "./ObjectiveSection";
import PatientSection from "./PatientSection";
import Section from "./Section";
import SubjectiveSection from "./SubjectiveSection";

interface PlanEditorProps {
	plan: Plan;
	onChange: (next: Plan) => void;
}

export default function PlanEditor({ plan, onChange }: PlanEditorProps) {
	function updateNeed(type: Need["type"], next: Need) {
		const index = plan.needs.findIndex((need) => need.type === type);
		const needs =
			index === -1
				? [...plan.needs, next]
				: plan.needs.map((need, i) => (i === index ? next : need));
		onChange({ ...plan, needs });
	}

	const priorityErrors = useMemo(() => computePriorityErrors(plan.needs), [plan.needs]);

	// A need only counts as assessed once it has been marked as existing or not.
	const assessedCount = plan.needs.filter((need) => need.exists !== undefined).length;
	const yesCount = plan.needs.filter((need) => need.exists === true).length;

	return (
		<section className="flex min-w-0 flex-[3] flex-col overflow-y-auto p-4">
			<h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-[#7C8B86]">
				Care Plan
			</h2>
			<div className="space-y-3">
				<PatientSection
					patient={plan.patient}
					onChangePatient={(patient) => onChange({ ...plan, patient })}
				/>
				<SubjectiveSection
					subjective={plan.subjective}
					onChange={(subjective) => onChange({ ...plan, subjective })}
				/>
				<ObjectiveSection
					objective={plan.objective}
					onChange={(objective) => onChange({ ...plan, objective })}
				/>
				<ConditionsSection
					conditions={plan.conditions}
					onChange={(conditions) => onChange({ ...plan, conditions })}
				/>
				<Section
					title="Human needs"
					hint="Assessment, diagnoses, goals, and interventions"
					badge={`${assessedCount} assessed / ${yesCount} yes`}
				>
					<div className="space-y-3">
						{NEEDS.map((definition, index) => (
							<NeedCard
								key={definition.type}
								index={index}
								definition={definition}
								need={plan.needs.find((need) => need.type === definition.type)}
								onChange={(next) => updateNeed(definition.type, next)}
								priorityError={priorityErrors.get(definition.type)}
							/>
						))}
					</div>
				</Section>
				<AppointmentsSection
					appointments={plan.appointments}
					onChange={(appointments) => onChange({ ...plan, appointments })}
				/>
			</div>
		</section>
	);
}
