import type { Plan } from "@dh-care-plan/core";
import { type ChangeEvent, useRef, useState } from "react";
import CaseStudyPane from "./components/CaseStudyPane";
import CommandBar from "./components/CommandBar";
import ImportErrorDialog from "./components/ImportErrorDialog";
import PlanEditor from "./components/PlanEditor";
import { exportPlan } from "./export";
import { type ImportFailure, readPlanFile } from "./import";

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
	const [importFailure, setImportFailure] = useState<ImportFailure | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		// Clear the input so picking the same file again still fires a change.
		event.target.value = "";
		if (!file) return;

		const result = await readPlanFile(file);
		if (result.ok) {
			setPlan(result.plan);
			setImportFailure(null);
			return;
		}
		setImportFailure(result);
	}

	return (
		<main className="flex h-screen min-h-screen bg-[#F1F4F1] text-[#1E2B27]">
			<CommandBar
				collapsed={commandBarCollapsed}
				onToggleCollapsed={() => setCommandBarCollapsed((prev) => !prev)}
				onImport={() => fileInputRef.current?.click()}
				onExport={() => void exportPlan(plan)}
			/>
			<CaseStudyPane value={caseText} onChange={setCaseText} />
			<PlanEditor plan={plan} onChange={setPlan} />

			<input
				ref={fileInputRef}
				type="file"
				accept="application/json,.json"
				aria-label="Care plan file"
				className="hidden"
				onChange={(event) => void handleImportFile(event)}
			/>

			{importFailure && (
				<ImportErrorDialog
					summary={importFailure.summary}
					issues={importFailure.issues}
					onClose={() => setImportFailure(null)}
				/>
			)}
		</main>
	);
}
