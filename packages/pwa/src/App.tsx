import { DEFAULT_PLAN } from "@dh-care-plan/core";
import { type ChangeEvent, useRef, useState } from "react";
import CaseStudyPane from "./components/CaseStudyPane";
import CommandBar from "./components/CommandBar";
import ConfirmDialog from "./components/ConfirmDialog";
import ImportErrorDialog from "./components/ImportErrorDialog";
import PlanEditor from "./components/PlanEditor";
import { exportPlan } from "./export";
import { type ImportFailure, readPlanFile } from "./import";

export default function App() {
	// Cloned so editing this session never mutates the shared default.
	const [plan, setPlan] = useState(() => structuredClone(DEFAULT_PLAN));
	const [caseText, setCaseText] = useState("");
	const [commandBarCollapsed, setCommandBarCollapsed] = useState(false);
	const [importFailure, setImportFailure] = useState<ImportFailure | null>(null);
	const [confirmingNewPlan, setConfirmingNewPlan] = useState(false);
	// Bumped to remount the editor, so a new plan also resets which sections are expanded.
	const [planGeneration, setPlanGeneration] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function startNewPlan() {
		setPlan(structuredClone(DEFAULT_PLAN));
		setPlanGeneration((prev) => prev + 1);
		setConfirmingNewPlan(false);
	}

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
				onNewPlan={() => setConfirmingNewPlan(true)}
				onImport={() => fileInputRef.current?.click()}
				onExport={() => void exportPlan(plan)}
			/>
			<CaseStudyPane value={caseText} onChange={setCaseText} />
			<PlanEditor key={planGeneration} plan={plan} onChange={setPlan} />

			<input
				ref={fileInputRef}
				type="file"
				accept="application/json,.json"
				aria-label="Care plan file"
				className="hidden"
				onChange={(event) => void handleImportFile(event)}
			/>

			{confirmingNewPlan && (
				<ConfirmDialog
					title="Start a new plan?"
					message="The current plan will be replaced with a blank one. Any unsaved changes will be lost."
					confirmLabel="Start new plan"
					onConfirm={startNewPlan}
					onCancel={() => setConfirmingNewPlan(false)}
				/>
			)}

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
