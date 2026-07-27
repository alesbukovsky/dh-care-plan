import type { Need, Plan } from "dh-care-plan";
import { NEEDS } from "../needs";
import NeedCard from "./NeedCard";

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

	return (
		<section className="flex min-w-0 flex-[3] flex-col overflow-y-auto p-4">
			<h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-[#7C8B86]">
				Care Plan
			</h2>
			<div className="space-y-3">
				{NEEDS.map((definition, index) => (
					<NeedCard
						key={definition.type}
						index={index}
						definition={definition}
						need={plan.needs.find((need) => need.type === definition.type)}
						onChange={(next) => updateNeed(definition.type, next)}
					/>
				))}
			</div>
		</section>
	);
}
