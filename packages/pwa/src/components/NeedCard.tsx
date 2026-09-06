import type { Need } from "@dh-care-plan/core";
import { useState } from "react";
import type { NeedDefinition } from "../needs";
import { inputClass } from "./fields";
import { PlusIcon, TrashIcon } from "./icons";

interface NeedCardProps {
	definition: NeedDefinition;
	index: number;
	need: Need | undefined;
	onChange: (next: Need) => void;
}

type Goal = NonNullable<Need["goals"]>[number];

const TOGGLE_STATUSES = [
	{ value: "met", label: "Need is met", activeClass: "border-[#2F6F62] bg-[#2F6F62] text-white" },
	{
		value: "unmet",
		label: "Need is unmet",
		activeClass: "border-[#B85C2E] bg-[#B85C2E] text-white",
	},
] as const;

const GOAL_OUTCOME_STATUSES = [
	{
		value: undefined,
		label: "TBD",
		activeClass: "border-[#C9C9C4] bg-[#DFDFDA] text-[#5C6B66]",
	},
	{ value: "met", label: "Met", activeClass: "border-[#2F6F62] bg-[#2F6F62] text-white" },
	{
		value: "partial",
		label: "Partially met",
		activeClass: "border-[#C08A2E] bg-[#C08A2E] text-white",
	},
	{
		value: "unmet",
		label: "Not met",
		activeClass: "border-[#B85C2E] bg-[#B85C2E] text-white",
	},
] as const;

const STATUS_PILL: Record<"met" | "unmet", { label: string; className: string }> = {
	met: { label: "Met", className: "bg-[#E4EFEA] text-[#1F4D43]" },
	unmet: { label: "Unmet", className: "bg-[#F3E1D3] text-[#B85C2E]" },
};
const NOT_STARTED_PILL = { label: "Not started", className: "bg-[#EEEEEC] text-[#7C8B86]" };

export default function NeedCard({ definition, index, need, onChange }: NeedCardProps) {
	const [expanded, setExpanded] = useState(false);

	function setStatus(status: "met" | "unmet") {
		onChange({
			type: definition.type,
			isMet: status === "met",
			relatedTo: need?.relatedTo,
			evidencedBy: need?.evidencedBy,
			priority: need?.priority,
			rationale: need?.rationale,
			goals: need?.goals,
		});
		setExpanded(true);
	}

	const pill =
		need?.isMet === undefined ? NOT_STARTED_PILL : STATUS_PILL[need.isMet ? "met" : "unmet"];

	return (
		<div className="rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA]">
			<button
				type="button"
				className={`flex w-full items-center gap-4 rounded-t-[10px] bg-[#E7EDE8] px-4 py-3 text-left ${
					expanded ? "" : "rounded-b-[10px]"
				}`}
				onClick={() => setExpanded((prev) => !prev)}
			>
				<span className="w-6 shrink-0 font-serif text-sm text-[#7C8B86]">
					{String(index + 1).padStart(2, "0")}
				</span>
				<div className="min-w-0 flex-1">
					<h3 className="font-serif font-medium text-[#1E2B27]">{definition.name}</h3>
					<p className="text-xs leading-snug text-[#4B5B55]">{definition.def}</p>
				</div>
				<span
					className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs uppercase tracking-wide ${pill.className}`}
				>
					{pill.label}
				</span>
				<span className="shrink-0 text-[#7C8B86]">{expanded ? "▾" : "▸"}</span>
			</button>

			{expanded && (
				<div className="space-y-3 border-t border-[#D8DED9] px-4 py-4 text-sm text-[#4B5B55]">
					<div className="flex gap-2">
						{TOGGLE_STATUSES.map((status) => (
							<button
								key={status.value}
								type="button"
								onClick={() => setStatus(status.value)}
								className={`flex-1 rounded-md border px-2 py-2 text-xs font-semibold ${
									need?.isMet === (status.value === "met")
										? status.activeClass
										: "border-[#B9C3BD] bg-white text-[#4B5B55]"
								}`}
							>
								{status.label}
							</button>
						))}
					</div>

					{need?.isMet === false && (
						<>
							<div className="space-y-1 rounded-lg border border-[#B9C3BD] bg-[#EDEBE1] px-3 pb-2 pt-3">
								<div>
									<p className="mb-1 font-serif italic text-[#4B5B55]">
										Unmet human need for {definition.name.toLowerCase()}, related to
									</p>
									<textarea
										className={`w-full resize-y ${inputClass}`}
										rows={2}
										placeholder="etiology / risk factor"
										value={need.relatedTo ?? ""}
										onChange={(e) => onChange({ ...need, relatedTo: e.target.value })}
									/>
								</div>
								<div>
									<p className="mb-1 font-serif italic text-[#4B5B55]">as evidenced by</p>
									<textarea
										className={`w-full resize-y ${inputClass}`}
										rows={2}
										placeholder="clinical signs / patient report"
										value={need.evidencedBy ?? ""}
										onChange={(e) => onChange({ ...need, evidencedBy: e.target.value })}
									/>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<label
									htmlFor={`priority-${definition.type}`}
									className="font-mono text-xs uppercase tracking-wide text-[#7C8B86]"
								>
									Priority
								</label>
								<input
									id={`priority-${definition.type}`}
									type="text"
									className={`w-32 ${inputClass}`}
									placeholder="e.g. 1"
									value={need.priority ?? ""}
									onChange={(e) => onChange({ ...need, priority: e.target.value || undefined })}
								/>
							</div>

							<div>
								<label
									htmlFor={`rationale-${definition.type}`}
									className="mb-1 block font-mono text-xs uppercase tracking-wide text-[#7C8B86]"
								>
									Rationale
								</label>
								<textarea
									id={`rationale-${definition.type}`}
									className={`w-full resize-y ${inputClass}`}
									rows={2}
									placeholder="why this priority"
									value={need.rationale ?? ""}
									onChange={(e) => onChange({ ...need, rationale: e.target.value })}
								/>
							</div>

							<GoalsEditor need={need} onChange={onChange} />
						</>
					)}
				</div>
			)}
		</div>
	);
}

interface GoalsEditorProps {
	need: Need;
	onChange: (next: Need) => void;
}

/**
 * Split out of NeedCard so goal editing works against a need that is known to
 * exist, rather than re-checking for one at every callback.
 */
function GoalsEditor({ need, onChange }: GoalsEditorProps) {
	const goals = need.goals ?? [];

	function updateGoal(goalIndex: number, patch: Partial<Goal>) {
		const nextGoals = goals.map((goal, i) => (i === goalIndex ? { ...goal, ...patch } : goal));
		onChange({ ...need, goals: nextGoals });
	}

	function addGoal() {
		onChange({ ...need, goals: [...goals, { task: "" }] });
	}

	function removeGoal(goalIndex: number) {
		onChange({ ...need, goals: goals.filter((_, i) => i !== goalIndex) });
	}

	return (
		<div>
			<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">Goals</p>
			<div className="space-y-3">
				{goals.map((goal, goalIndex) => {
					const interventions = goal.interventions ?? [];
					const outcome = goal.outcome;
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: goals have no stable id in the schema
							key={`goal-${goalIndex}`}
							className="space-y-2 rounded-lg border border-[#D8DED9] bg-[#F6F5F0] p-3"
						>
							<p className="font-serif italic text-[#4B5B55]">The patient will</p>
							<div className="flex items-center gap-2">
								<input
									type="text"
									className={`flex-1 ${inputClass}`}
									placeholder="e.g. floss daily"
									value={goal.task ?? ""}
									onChange={(e) => updateGoal(goalIndex, { task: e.target.value })}
								/>
								<button
									type="button"
									title="Remove goal"
									onClick={() => removeGoal(goalIndex)}
									className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
								>
									<TrashIcon />
								</button>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-serif italic text-[#7C8B86]">by</span>
								<input
									type="date"
									className={`w-36 shrink-0 ${inputClass}`}
									value={goal.doneBy?.date ?? ""}
									onChange={(e) =>
										updateGoal(goalIndex, {
											doneBy: { ...goal.doneBy, date: e.target.value || undefined },
										})
									}
								/>
								<span className="font-serif italic text-[#7C8B86]">or</span>
								<input
									type="text"
									className={`w-64 shrink-0 ${inputClass}`}
									placeholder="relative term, e.g. by next visit"
									value={goal.doneBy?.relative ?? ""}
									onChange={(e) =>
										updateGoal(goalIndex, {
											doneBy: { ...goal.doneBy, relative: e.target.value || undefined },
										})
									}
								/>
							</div>

							<div>
								<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
									Interventions
								</p>
								<div className="space-y-2">
									{interventions.map((intervention, interventionIndex) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: interventions have no stable id in the schema
											key={`intervention-${interventionIndex}`}
											className="flex items-center gap-2"
										>
											<input
												type="text"
												className={`flex-1 ${inputClass}`}
												placeholder="e.g. provide oral hygiene instruction"
												value={intervention}
												onChange={(e) =>
													updateGoal(goalIndex, {
														interventions: interventions.map((v, i) =>
															i === interventionIndex ? e.target.value : v,
														),
													})
												}
											/>
											<button
												type="button"
												title="Remove intervention"
												onClick={() =>
													updateGoal(goalIndex, {
														interventions: interventions.filter((_, i) => i !== interventionIndex),
													})
												}
												className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
											>
												<TrashIcon />
											</button>
										</div>
									))}
								</div>
								<button
									type="button"
									onClick={() => updateGoal(goalIndex, { interventions: [...interventions, ""] })}
									className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
								>
									<PlusIcon className="h-3.5 w-3.5" /> Add intervention
								</button>
							</div>

							<div>
								<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
									Outcome
								</p>
								<div className="flex gap-2">
									{GOAL_OUTCOME_STATUSES.map((status) => (
										<button
											key={status.label}
											type="button"
											onClick={() =>
												updateGoal(goalIndex, {
													outcome: status.value
														? { note: outcome?.note, status: status.value }
														: undefined,
												})
											}
											className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${
												outcome?.status === status.value
													? status.activeClass
													: "border-[#B9C3BD] bg-white text-[#4B5B55]"
											}`}
										>
											{status.label}
										</button>
									))}
								</div>
							</div>

							<div>
								<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
									Outcome evaluation
								</p>
								<textarea
									className={`w-full resize-y ${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
									rows={2}
									disabled={!outcome}
									placeholder={
										outcome
											? "how and when will this goal be reassessed?"
											: "set an outcome to add a note"
									}
									value={outcome?.note ?? ""}
									// Without an outcome there is no status to attach a note to, which is
									// what the disabled state above is saying.
									onChange={
										outcome &&
										((e) =>
											updateGoal(goalIndex, { outcome: { ...outcome, note: e.target.value } }))
									}
								/>
							</div>
						</div>
					);
				})}
			</div>
			<button
				type="button"
				onClick={addGoal}
				className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
			>
				<PlusIcon className="h-3.5 w-3.5" /> Add goal
			</button>
		</div>
	);
}
