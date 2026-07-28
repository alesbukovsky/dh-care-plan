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

let latest: Need | undefined;

function Harness() {
	const [need, setNeed] = useState<Need | undefined>({
		type: "health",
		isMet: false,
		goals: [{ task: "" }, { task: "", outcome: { status: "unmet" } }],
	});
	latest = need;
	return <NeedCard definition={definition} index={0} need={need} onChange={setNeed} />;
}

function UnassessedHarness() {
	const [need, setNeed] = useState<Need | undefined>(undefined);
	latest = need;
	return <NeedCard definition={definition} index={3} need={need} onChange={setNeed} />;
}

function expand() {
	fireEvent.click(
		required(screen.getByRole("heading", { name: definition.name }).closest("button")),
	);
}

function values(elements: HTMLElement[]) {
	return elements.map((element) => (element as HTMLInputElement).value);
}

test("each goal's outcome, interventions, and note are edited independently", () => {
	render(<Harness />);

	expand();

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

	expand();

	const notes = screen.getAllByPlaceholderText("how and when will this goal be reassessed?");
	fireEvent.change(required(notes[0]), { target: { value: "Reassess in six months" } });

	fireEvent.click(required(screen.getAllByRole("button", { name: "TBD" })[1]));

	expect(screen.getAllByRole("button", { name: "TBD" })[1]).toHaveClass("bg-[#DFDFDA]");
	expect(screen.getAllByPlaceholderText("set an outcome to add a note")).toHaveLength(2);
});

test("an unassessed need stays not started until a status is picked", () => {
	render(<UnassessedHarness />);

	expect(screen.getByText("Not started")).toBeInTheDocument();

	expand();

	expect(screen.queryByPlaceholderText("etiology / risk factor")).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Need is unmet" }));

	expect(latest).toEqual({ type: "health", isMet: false });
	expect(screen.getByText("Unmet")).toBeInTheDocument();
});

test("the diagnosis statement and goals survive a change of status", () => {
	render(<UnassessedHarness />);
	expand();

	fireEvent.click(screen.getByRole("button", { name: "Need is unmet" }));
	fireEvent.change(screen.getByPlaceholderText("etiology / risk factor"), {
		target: { value: "poor plaque control" },
	});
	fireEvent.change(screen.getByPlaceholderText("clinical signs / patient report"), {
		target: { value: "generalized bleeding on probing" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Add goal" }));
	fireEvent.change(screen.getByPlaceholderText("e.g. floss daily"), {
		target: { value: "Floss daily" },
	});

	fireEvent.click(screen.getByRole("button", { name: "Need is met" }));

	expect(screen.getByText("Met")).toBeInTheDocument();
	// a met need shows neither the diagnosis statement nor the goals
	expect(screen.queryByPlaceholderText("etiology / risk factor")).not.toBeInTheDocument();
	expect(screen.queryByPlaceholderText("e.g. floss daily")).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Need is unmet" }));

	expect(screen.getByPlaceholderText("etiology / risk factor")).toHaveValue("poor plaque control");
	expect(screen.getByPlaceholderText("clinical signs / patient report")).toHaveValue(
		"generalized bleeding on probing",
	);
	expect(screen.getByPlaceholderText("e.g. floss daily")).toHaveValue("Floss daily");
});

test("goals are added and removed by position", () => {
	render(<Harness />);
	expand();

	fireEvent.click(screen.getByRole("button", { name: "Add goal" }));

	const tasks = screen.getAllByPlaceholderText("e.g. floss daily");
	expect(tasks).toHaveLength(3);
	fireEvent.change(required(tasks[0]), { target: { value: "Floss daily" } });
	fireEvent.change(required(tasks[1]), { target: { value: "Brush twice daily" } });
	fireEvent.change(required(tasks[2]), { target: { value: "Attend recall visit" } });

	fireEvent.click(required(screen.getAllByRole("button", { name: "Remove goal" })[1]));

	expect(values(screen.getAllByPlaceholderText("e.g. floss daily"))).toEqual([
		"Floss daily",
		"Attend recall visit",
	]);
});

test("interventions are removed by position within their own goal", () => {
	render(<Harness />);
	expand();

	fireEvent.click(required(screen.getAllByRole("button", { name: "Add intervention" })[0]));
	fireEvent.click(required(screen.getAllByRole("button", { name: "Add intervention" })[0]));

	const interventions = screen.getAllByPlaceholderText("e.g. provide oral hygiene instruction");
	expect(interventions).toHaveLength(2);
	fireEvent.change(required(interventions[0]), { target: { value: "Oral hygiene instruction" } });
	fireEvent.change(required(interventions[1]), { target: { value: "Fluoride varnish" } });

	fireEvent.click(required(screen.getAllByRole("button", { name: "Remove intervention" })[0]));

	expect(values(screen.getAllByPlaceholderText("e.g. provide oral hygiene instruction"))).toEqual([
		"Fluoride varnish",
	]);
	// the second goal is untouched by edits to the first
	expect(latest?.goals?.[1]?.interventions).toBeUndefined();
});

test("a goal's target date and relative term are dropped when emptied", () => {
	const { container } = render(<Harness />);
	expand();

	const date = required(container.querySelector<HTMLInputElement>('input[type="date"]'));
	const relative = required(
		screen.getAllByPlaceholderText("relative term, e.g. by next visit")[0],
	);

	fireEvent.change(date, { target: { value: "2026-09-01" } });
	fireEvent.change(relative, { target: { value: "by next visit" } });

	expect(latest?.goals?.[0]?.doneBy).toEqual({
		date: "2026-09-01",
		relative: "by next visit",
	});

	fireEvent.change(date, { target: { value: "" } });
	fireEvent.change(relative, { target: { value: "" } });

	expect(latest?.goals?.[0]?.doneBy).toEqual({});
});
