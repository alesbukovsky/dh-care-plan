import { fireEvent, render, screen } from "@testing-library/react";
import type { Need } from "dh-care-plan/schema";
import { useState } from "react";
import { expect, test } from "vitest";
import NeedCard from "./NeedCard";

const definition = { type: "health", name: "Health", def: "test need" } as const;

function required<T>(value: T | undefined | null): T {
	if (value === undefined || value === null) throw new Error("expected value to be defined");
	return value;
}

function Harness() {
	const [need, setNeed] = useState<Need | undefined>({
		type: "health",
		isMet: false,
		goals: [
			{ task: "", outcome: { status: "unmet" } },
			{ task: "", outcome: { status: "unmet" } },
		],
	});
	return <NeedCard definition={definition} index={0} need={need} onChange={setNeed} />;
}

test("each goal's outcome, interventions, and note are edited independently", () => {
	render(<Harness />);

	fireEvent.click(
		required(screen.getByRole("heading", { name: definition.name }).closest("button")),
	);

	const goalTasks = screen.getAllByPlaceholderText("e.g. Client will floss daily");
	expect(goalTasks).toHaveLength(2);
	fireEvent.change(required(goalTasks[0]), { target: { value: "Floss daily" } });
	fireEvent.change(required(goalTasks[1]), { target: { value: "Brush twice daily" } });

	const goalMetButtons = screen.getAllByRole("button", { name: "Goal is met" });
	fireEvent.click(required(goalMetButtons[0]));

	const addInterventionButtons = screen.getAllByRole("button", { name: "Add intervention" });
	fireEvent.click(required(addInterventionButtons[0]));
	const interventionInputs = screen.getAllByPlaceholderText(
		"e.g. Provide oral hygiene instruction",
	);
	fireEvent.change(required(interventionInputs[0]), {
		target: { value: "Oral hygiene instruction" },
	});

	const notes = screen.getAllByPlaceholderText("How and when will this goal be reassessed?");
	fireEvent.change(required(notes[0]), { target: { value: "Reassess at next visit" } });
	fireEvent.change(required(notes[1]), { target: { value: "Reassess in six months" } });

	expect(screen.getAllByRole("button", { name: "Goal is met" })[0]).toHaveClass("bg-[#2F6F62]");
	expect(screen.getAllByRole("button", { name: "Goal is unmet" })[1]).toHaveClass("bg-[#B85C2E]");

	expect(screen.getAllByPlaceholderText("e.g. Provide oral hygiene instruction")).toHaveLength(1);

	const notesAfter = screen.getAllByPlaceholderText("How and when will this goal be reassessed?");
	expect(notesAfter[0]).toHaveValue("Reassess at next visit");
	expect(notesAfter[1]).toHaveValue("Reassess in six months");

	const tasksAfter = screen.getAllByPlaceholderText("e.g. Client will floss daily");
	expect(tasksAfter[0]).toHaveValue("Floss daily");
	expect(tasksAfter[1]).toHaveValue("Brush twice daily");
});
