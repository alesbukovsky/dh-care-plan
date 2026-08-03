import { type Config, DEFAULT_CONFIG } from "@dh-care-plan/core";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { exportConfig, readConfigFile } from "../configFile";
import type { ImportIssue } from "../schemaIssues";
import { Field } from "./fields";

export interface ConfigImportFailure {
	summary: string;
	issues: ImportIssue[];
}

interface ConfigDialogProps {
	config: Config;
	onImportFailure: (failure: ConfigImportFailure) => void;
	onSave: (config: Config) => void;
	onCancel: () => void;
}

interface FormatSectionProps {
	value: Config["format"];
	onChange: (next: Config["format"]) => void;
}

function FormatSection({ value, onChange }: FormatSectionProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<Field
				label="Date"
				value={value.date}
				onChange={(next) => onChange({ ...value, date: next ?? "" })}
			/>
			<Field
				label="Goal due date"
				value={value.goal.doneBy}
				onChange={(next) => onChange({ ...value, goal: { doneBy: next ?? "" } })}
			/>
			<Field
				label="Visits"
				value={value.visits}
				onChange={(next) => onChange({ ...value, visits: next ?? "" })}
			/>
			<Field
				label="Vitals"
				value={value.vitals}
				onChange={(next) => onChange({ ...value, vitals: next ?? "" })}
			/>
		</div>
	);
}

interface NeedSectionProps {
	value: Config["mapping"]["need"];
	onChange: (next: Config["mapping"]["need"]) => void;
}

const NEED_LABELS: { key: keyof Config["mapping"]["need"]; label: string }[] = [
	{ key: "image", label: "Image" },
	{ key: "peace", label: "Peace" },
	{ key: "integrity", label: "Integrity" },
	{ key: "health", label: "Health" },
	{ key: "comfort", label: "Comfort" },
	{ key: "dentition", label: "Dentition" },
	{ key: "understanding", label: "Understanding" },
	{ key: "responsibility", label: "Responsibility" },
	{ key: "maintenance", label: "Maintenance" },
];

function NeedSection({ value, onChange }: NeedSectionProps) {
	return (
		<div className="grid grid-cols-1 gap-3">
			{NEED_LABELS.map(({ key, label }) => (
				<Field
					key={key}
					label={label}
					value={value[key]}
					onChange={(next) => onChange({ ...value, [key]: next ?? "" })}
				/>
			))}
		</div>
	);
}

interface OutcomeSectionProps {
	value: Config["mapping"]["outcome"];
	onChange: (next: Config["mapping"]["outcome"]) => void;
}

const OUTCOME_LABELS: { key: keyof Config["mapping"]["outcome"]; label: string }[] = [
	{ key: "met", label: "Met" },
	{ key: "partial", label: "Partial" },
	{ key: "unmet", label: "Unmet" },
	{ key: "undefined", label: "Undefined" },
];

function OutcomeSection({ value, onChange }: OutcomeSectionProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{OUTCOME_LABELS.map(({ key, label }) => (
				<Field
					key={key}
					label={label}
					value={value[key]}
					onChange={(next) => onChange({ ...value, [key]: next ?? "" })}
				/>
			))}
		</div>
	);
}

export default function ConfigDialog({
	config,
	onImportFailure,
	onSave,
	onCancel,
}: ConfigDialogProps) {
	const [draft, setDraft] = useState(config);
	const cancelRef = useRef<HTMLButtonElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	useEffect(() => {
		cancelRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancelRef.current();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		event.target.value = "";
		if (!file) return;

		const result = await readConfigFile(file);
		if (result.ok) {
			setDraft(result.config);
			return;
		}
		onImportFailure(result);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="config-dialog-title"
				className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="config-dialog-title" className="font-serif font-medium text-[#1E2B27]">
						Configure
					</h2>
					<p className="mt-1 text-sm leading-snug text-[#4B5B55]">
						Formatting and labels used for plan generation
					</p>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="application/json,.json"
					aria-label="Care plan config file"
					className="hidden"
					onChange={(event) => void handleImportFile(event)}
				/>

				<div className="min-h-0 flex-1 space-y-5 overflow-y-scroll px-4 py-4">
					<section className="rounded-md border border-[#D8DED9] bg-white p-3">
						<h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-[#4B5B55]">
							Format
						</h3>
						<FormatSection
							value={draft.format}
							onChange={(format) => setDraft({ ...draft, format })}
						/>
					</section>

					<section className="rounded-md border border-[#D8DED9] bg-white p-3">
						<h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-[#4B5B55]">
							Need Labels
						</h3>
						<NeedSection
							value={draft.mapping.need}
							onChange={(need) => setDraft({ ...draft, mapping: { ...draft.mapping, need } })}
						/>
					</section>

					<section className="rounded-md border border-[#D8DED9] bg-white p-3">
						<h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-[#4B5B55]">
							Outcome Labels
						</h3>
						<OutcomeSection
							value={draft.mapping.outcome}
							onChange={(outcome) =>
								setDraft({ ...draft, mapping: { ...draft.mapping, outcome } })
							}
						/>
					</section>
				</div>

				<div className="flex items-center justify-between gap-2 border-t border-[#D8DED9] px-4 py-3">
					<button
						type="button"
						onClick={() => setDraft(structuredClone(DEFAULT_CONFIG))}
						className="text-sm text-[#2F6F62] hover:underline"
					>
						Reset to defaults
					</button>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="rounded border border-[#D8DED9] bg-white px-3 py-1.5 text-sm text-[#1E2B27] hover:bg-[#EFF3EF]"
						>
							Import
						</button>
						<button
							type="button"
							onClick={() => void exportConfig(draft)}
							className="rounded border border-[#D8DED9] bg-white px-3 py-1.5 text-sm text-[#1E2B27] hover:bg-[#EFF3EF]"
						>
							Export
						</button>
						<button
							ref={cancelRef}
							type="button"
							onClick={onCancel}
							className="rounded border border-[#D8DED9] bg-white px-3 py-1.5 text-sm text-[#1E2B27] hover:bg-[#EFF3EF]"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => onSave(draft)}
							className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154]"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
