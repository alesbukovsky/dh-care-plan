import type { Plan } from "dh-care-plan/schema";
import { useState } from "react";
import CaseStudyPane from "./components/CaseStudyPane";
import CommandBar from "./components/CommandBar";
import PlanEditor from "./components/PlanEditor";
import { exportPlan } from "./export";

function getEmptyPlan(): Plan {
	return {
		patient: { initials: "", dob: "", chartId: "" },
		appointments: [],
		subjective: {},
		objective: {},
		needs: [],
	};
}

export default function App() {
	const [plan, setPlan] = useState(() => getEmptyPlan());
	const [caseText, setCaseText] = useState("");
	const [commandBarCollapsed, setCommandBarCollapsed] = useState(false);

	return (
		<main className="flex h-screen min-h-screen bg-[#F1F4F1] text-[#1E2B27]">
			<CommandBar
				collapsed={commandBarCollapsed}
				onToggleCollapsed={() => setCommandBarCollapsed((prev) => !prev)}
				onExport={() => void exportPlan(plan)}
			/>
			<CaseStudyPane value={caseText} onChange={setCaseText} />
			<PlanEditor plan={plan} onChange={setPlan} />
		</main>
	);
}
