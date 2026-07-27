import type { Need } from "dh-care-plan/schema";
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

const GOAL_TOGGLE_STATUSES = [
	{ value: "met", label: "Goal is met", activeClass: "border-[#2F6F62] bg-[#2F6F62] text-white" },
	{
		value: "unmet",
		label: "Goal is unmet",
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

	const goals = need?.goals ?? [];

	function setStatus(status: "met" | "unmet") {
		onChange({
			type: definition.type,
			isMet: status === "met",
			relatedTo: need?.relatedTo,
			evidencedBy: need?.evidencedBy,
			goals: need?.goals,
		});
		setExpanded(true);
	}

	function updateGoal(goalIndex: number, patch: Partial<Goal>) {
		if (!need) return;
		const nextGoals = goals.map((goal, i) => (i === goalIndex ? { ...goal, ...patch } : goal));
		onChange({ ...need, goals: nextGoals });
	}

	function addGoal() {
		if (!need) return;
		onChange({ ...need, goals: [...goals, { task: "", outcome: { status: "unmet" } }] });
	}

	function removeGoal(goalIndex: number) {
		if (!need) return;
		onChange({ ...need, goals: goals.filter((_, i) => i !== goalIndex) });
	}

	function updateGoalIntervention(goalIndex: number, interventionIndex: number, value: string) {
		const goal = goals[goalIndex];
		if (!goal) return;
		const interventions = goal.interventions ?? [];
		updateGoal(goalIndex, {
			interventions: interventions.map((v, i) => (i === interventionIndex ? value : v)),
		});
	}

	function addGoalIntervention(goalIndex: number) {
		const goal = goals[goalIndex];
		if (!goal) return;
		updateGoal(goalIndex, { interventions: [...(goal.interventions ?? []), ""] });
	}

	function removeGoalIntervention(goalIndex: number, interventionIndex: number) {
		const goal = goals[goalIndex];
		if (!goal) return;
		updateGoal(goalIndex, {
			interventions: (goal.interventions ?? []).filter((_, i) => i !== interventionIndex),
		});
	}

	const pill = need ? STATUS_PILL[need.isMet ? "met" : "unmet"] : NOT_STARTED_PILL;

	return (
		<div className="rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA]">
			<button
				type="button"
				className="flex w-full items-center gap-4 px-4 py-3 text-left"
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
							<div className="space-y-1 rounded-lg border border-dashed border-[#B9C3BD] bg-[#F6F5F0] px-3 pb-2 pt-3">
								<div>
									<p className="mb-1 font-serif italic text-[#4B5B55]">
										Unmet human need for {definition.name.toLowerCase()}, related to
									</p>
									<textarea
										className={`w-full resize-none ${inputClass}`}
										rows={2}
										placeholder="etiology / risk factor"
										value={need.relatedTo ?? ""}
										onChange={(e) => onChange({ ...need, relatedTo: e.target.value })}
									/>
								</div>
								<div>
									<p className="mb-1 font-serif italic text-[#4B5B55]">as evidenced by</p>
									<textarea
										className={`w-full resize-none ${inputClass}`}
										rows={2}
										placeholder="clinical signs / client report"
										value={need.evidencedBy ?? ""}
										onChange={(e) => onChange({ ...need, evidencedBy: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
									Goals
								</p>
								<div className="space-y-3">
									{goals.map((goal, goalIndex) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: goals have no stable id in the schema
											key={`goal-${goalIndex}`}
											className="space-y-2 rounded-lg border border-[#D8DED9] bg-white p-3"
										>
											<div className="flex items-center gap-2">
												<input
													type="text"
													className={`flex-1 ${inputClass}`}
													placeholder="e.g. Client will floss daily"
													value={goal.task}
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
													className={`w-32 shrink-0 ${inputClass}`}
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
													className={`w-48 shrink-0 ${inputClass}`}
													placeholder="relative term, e.g. by next visit"
													value={goal.doneBy?.relative ?? ""}
													onChange={(e) =>
														updateGoal(goalIndex, {
															doneBy: { ...goal.doneBy, relative: e.target.value || undefined },
														})
													}
												/>
											</div>

											<div className="flex gap-2">
												{GOAL_TOGGLE_STATUSES.map((status) => (
													<button
														key={status.value}
														type="button"
														onClick={() =>
															updateGoal(goalIndex, {
																outcome: { ...goal.outcome, status: status.value },
															})
														}
														className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold ${
															goal.outcome?.status === status.value
																? status.activeClass
																: "border-[#B9C3BD] bg-white text-[#4B5B55]"
														}`}
													>
														{status.label}
													</button>
												))}
											</div>

											<div>
												<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
													Interventions
												</p>
												<div className="space-y-2">
													{(goal.interventions ?? []).map((intervention, interventionIndex) => (
														<div
															// biome-ignore lint/suspicious/noArrayIndexKey: interventions have no stable id in the schema
															key={`intervention-${interventionIndex}`}
															className="flex items-center gap-2"
														>
															<input
																type="text"
																className={`flex-1 ${inputClass}`}
																placeholder="e.g. Provide oral hygiene instruction"
																value={intervention}
																onChange={(e) =>
																	updateGoalIntervention(
																		goalIndex,
																		interventionIndex,
																		e.target.value,
																	)
																}
															/>
															<button
																type="button"
																title="Remove intervention"
																onClick={() =>
																	removeGoalIntervention(goalIndex, interventionIndex)
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
													onClick={() => addGoalIntervention(goalIndex)}
													className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
												>
													<PlusIcon className="h-3.5 w-3.5" /> Add intervention
												</button>
											</div>

											<div>
												<p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
													Evaluation note
												</p>
												<textarea
													className={`w-full resize-none ${inputClass}`}
													rows={2}
													placeholder="How and when will this goal be reassessed?"
													value={goal.outcome?.note ?? ""}
													onChange={(e) =>
														updateGoal(goalIndex, {
															outcome: {
																status: goal.outcome?.status ?? "unmet",
																note: e.target.value,
															},
														})
													}
												/>
											</div>
										</div>
									))}
								</div>
								<button
									type="button"
									onClick={addGoal}
									className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
								>
									<PlusIcon className="h-3.5 w-3.5" /> Add goal
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
