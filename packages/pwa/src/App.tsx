import { DEFAULT_CONFIG, DEFAULT_PLAN } from "@dh-care-plan/core";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import CaseStudyPane from "./components/CaseStudyPane";
import CommandBar from "./components/CommandBar";
import ConfigDialog, { type ConfigImportFailure } from "./components/ConfigDialog";
import ConfirmDialog from "./components/ConfirmDialog";
import GenerateDialog from "./components/GenerateDialog";
import ImportErrorDialog from "./components/ImportErrorDialog";
import PlanEditor from "./components/PlanEditor";
import { exportPlan } from "./export";
import {
	downloadGeneratedPlan,
	type GenerateFailure,
	generatedPlanFileName,
	readTemplateFile,
	renderPlan,
} from "./generate";
import { type ImportFailure, readPlanFile } from "./import";
import { clearDraft, isStorageAvailable, loadDraft, saveDraft } from "./persistence";

interface TemplateSelection {
	name: string;
	template: Uint8Array;
}

// How long to wait after the last edit before autosaving the draft.
const AUTOSAVE_DEBOUNCE_MS = 1000;

export default function App() {
	// Cloned so editing this session never mutates the shared default.
	const [plan, setPlan] = useState(() => loadDraft()?.plan ?? structuredClone(DEFAULT_PLAN));
	const [config, setConfig] = useState(() => loadDraft()?.config ?? structuredClone(DEFAULT_CONFIG));
	const [autosaveAvailable, setAutosaveAvailable] = useState(() => isStorageAvailable());
	const [commandBarCollapsed, setCommandBarCollapsed] = useState(false);
	const [importFailure, setImportFailure] = useState<ImportFailure | null>(null);
	const [configImportFailure, setConfigImportFailure] = useState<ConfigImportFailure | null>(null);
	const [generateFailure, setGenerateFailure] = useState<GenerateFailure | null>(null);
	const [confirmingNewPlan, setConfirmingNewPlan] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [configuring, setConfiguring] = useState(false);
	const [templateSelection, setTemplateSelection] = useState<TemplateSelection | null>(null);
	// Bumped to remount the editor, so a new plan also resets which sections are expanded.
	const [planGeneration, setPlanGeneration] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const templateInputRef = useRef<HTMLInputElement>(null);

	// Autosaves the draft ~1s after the last edit, so typing never triggers a write per keystroke.
	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!saveDraft(plan, config)) setAutosaveAvailable(false);
		}, AUTOSAVE_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [plan, config]);

	function startNewPlan() {
		setPlan(structuredClone(DEFAULT_PLAN));
		setConfig(structuredClone(DEFAULT_CONFIG));
		setPlanGeneration((prev) => prev + 1);
		setConfirmingNewPlan(false);
		clearDraft();
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

	function openGenerateDialog() {
		setTemplateSelection(null);
		setGenerating(true);
	}

	function closeGenerateDialog() {
		setGenerating(false);
		setTemplateSelection(null);
	}

	async function handleTemplateFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		// Clear the input so picking the same file again still fires a change.
		event.target.value = "";
		if (!file) return;

		const templateResult = await readTemplateFile(file);
		if (!templateResult.ok) {
			setGenerateFailure(templateResult);
			return;
		}

		setTemplateSelection({ name: file.name, template: templateResult.template });
	}

	async function handleGenerate() {
		if (!templateSelection) return;

		const rendered = renderPlan(plan, templateSelection.template, config);
		if (!rendered.ok) {
			setGenerateFailure(rendered);
			return;
		}

		await downloadGeneratedPlan(plan, rendered.output);
		closeGenerateDialog();
	}

	return (
		<main className="flex h-screen min-h-screen bg-[#F1F4F1] text-[#1E2B27]">
			<CommandBar
				collapsed={commandBarCollapsed}
				onToggleCollapsed={() => setCommandBarCollapsed((prev) => !prev)}
				onNewPlan={() => setConfirmingNewPlan(true)}
				onImport={() => fileInputRef.current?.click()}
				onExport={() => void exportPlan(plan)}
				onGenerate={openGenerateDialog}
				onConfigure={() => setConfiguring(true)}
				autosaveAvailable={autosaveAvailable}
			/>
			<CaseStudyPane value={plan.study ?? ""} onChange={(study) => setPlan({ ...plan, study })} />
			<PlanEditor key={planGeneration} plan={plan} onChange={setPlan} />

			<input
				ref={fileInputRef}
				type="file"
				accept="application/json,.json"
				aria-label="Care plan file"
				className="hidden"
				onChange={(event) => void handleImportFile(event)}
			/>

			<input
				ref={templateInputRef}
				type="file"
				accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
				aria-label="Care plan template file"
				className="hidden"
				onChange={(event) => void handleTemplateFile(event)}
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

			{configImportFailure && (
				<ImportErrorDialog
					summary={configImportFailure.summary}
					issues={configImportFailure.issues}
					onClose={() => setConfigImportFailure(null)}
				/>
			)}

			{generateFailure && (
				<ImportErrorDialog
					title="Cannot generate plan"
					summary={generateFailure.summary}
					issues={generateFailure.issues}
					onClose={() => setGenerateFailure(null)}
				/>
			)}

			{generating && (
				<GenerateDialog
					templateName={templateSelection?.name ?? null}
					fileName={generatedPlanFileName(plan)}
					onChooseTemplate={() => templateInputRef.current?.click()}
					onGenerate={handleGenerate}
					onCancel={closeGenerateDialog}
				/>
			)}

			{configuring && (
				<ConfigDialog
					config={config}
					onImportFailure={setConfigImportFailure}
					onSave={(next) => {
						setConfig(next);
						setConfiguring(false);
					}}
					onCancel={() => setConfiguring(false)}
				/>
			)}
		</main>
	);
}
