import { fireEvent, render, screen } from "@testing-library/react";
import type { Need } from "dh-care-plan/schema";
import { useState } from "react";
import { expect, test } from "vitest";
import NeedCard from "../../src/components/NeedCard";

const definition = { type: "health", name: "Health", def: "test need" } as const;

function required<T>(value: T | undefined | null): T {
	if (value === undefined || value === null) throw new Error("expected value to be defined");
	return value;
}

function Harness() {
	const [need, setNeed] = useState<Need | undefined>({
		type: "health",
		isMet: false,
		goals: [{ task: "" }, { task: "", outcome: { status: "unmet" } }],
	});
	return <NeedCard definition={definition} index={0} need={need} onChange={setNeed} />;
}

test("each goal's outcome, interventions, and note are edited independently", () => {
	render(<Harness />);

	fireEvent.click(
		required(screen.getByRole("heading", { name: definition.name }).closest("button")),
	);

	const goalTasks = screen.getAllByPlaceholderText("e.g. floss daily");
	expect(goalTasks).toHaveLength(2);
	fireEvent.change(required(goalTasks[0]), { target: { value: "Floss daily" } });
	fireEvent.change(required(goalTasks[1]), { target: { value: "Brush twice daily" } });

	// the first goal starts without an outcome, so its note is locked until one is picked
	expect(screen.getByPlaceholderText("set an outcome to add a note")).toBeDisabled();
	expect(screen.getAllByRole("button", { name: "TBD" })[0]).toHaveClass("bg-[#DFDFDA]");

	fireEvent.click(required(screen.getAllByRole("button", { name: "Partially met" })[0]));

	const addInterventionButtons = screen.getAllByRole("button", { name: "Add intervention" });
	fireEvent.click(required(addInterventionButtons[0]));
	const interventionInputs = screen.getAllByPlaceholderText(
		"e.g. provide oral hygiene instruction",
	);
	fireEvent.change(required(interventionInputs[0]), {
		target: { value: "Oral hygiene instruction" },
	});

	const notes = screen.getAllByPlaceholderText("how and when will this goal be reassessed?");
	fireEvent.change(required(notes[0]), { target: { value: "Reassess at next visit" } });
	fireEvent.change(required(notes[1]), { target: { value: "Reassess in six months" } });

	expect(screen.getAllByRole("button", { name: "Partially met" })[0]).toHaveClass("bg-[#C08A2E]");
	expect(screen.getAllByRole("button", { name: "Not met" })[1]).toHaveClass("bg-[#B85C2E]");

	expect(screen.getAllByPlaceholderText("e.g. provide oral hygiene instruction")).toHaveLength(1);

	const notesAfter = screen.getAllByPlaceholderText("how and when will this goal be reassessed?");
	expect(notesAfter[0]).toHaveValue("Reassess at next visit");
	expect(notesAfter[1]).toHaveValue("Reassess in six months");

	const tasksAfter = screen.getAllByPlaceholderText("e.g. floss daily");
	expect(tasksAfter[0]).toHaveValue("Floss daily");
	expect(tasksAfter[1]).toHaveValue("Brush twice daily");
});

test("clearing a goal's outcome back to TBD drops the outcome and its note", () => {
	render(<Harness />);

	fireEvent.click(
		required(screen.getByRole("heading", { name: definition.name }).closest("button")),
	);

	const notes = screen.getAllByPlaceholderText("how and when will this goal be reassessed?");
	fireEvent.change(required(notes[0]), { target: { value: "Reassess in six months" } });

	fireEvent.click(required(screen.getAllByRole("button", { name: "TBD" })[1]));

	expect(screen.getAllByRole("button", { name: "TBD" })[1]).toHaveClass("bg-[#DFDFDA]");
	expect(screen.getAllByPlaceholderText("set an outcome to add a note")).toHaveLength(2);
});
