import { DEFAULT_PLAN } from "@dh-care-plan/core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
	vi.unstubAllGlobals();
});

test("renders the heading", () => {
	render(<App />);
	expect(screen.getByRole("heading", { name: "Care Plan Builder" })).toBeInTheDocument();
});

test("the command bar collapses and expands", () => {
	render(<App />);
	expect(screen.getByText(/^Version /)).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Collapse" }));

	expect(screen.queryByRole("heading", { name: "Care Plan Builder" })).not.toBeInTheDocument();
	expect(screen.queryByText(/^Version /)).not.toBeInTheDocument();
	expect(screen.queryByText("v")).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Expand" }));

	expect(screen.getByRole("heading", { name: "Care Plan Builder" })).toBeInTheDocument();
	expect(screen.getByText(/^Version /)).toBeInTheDocument();
});

test("exporting asks for a destination and writes the plan there", async () => {
	const write = vi.fn();
	const showSaveFilePicker = vi.fn().mockResolvedValue({
		createWritable: () => Promise.resolve({ write, close: vi.fn() }),
	});
	vi.stubGlobal("showSaveFilePicker", showSaveFilePicker);
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Export data" }));

	await waitFor(() => expect(showSaveFilePicker).toHaveBeenCalled());
	// A brand new plan exports as the default: nothing filled in, every need listed.
	expect(JSON.parse(write.mock.calls[0]?.[0] as string)).toEqual(DEFAULT_PLAN);
});

test("the unimplemented actions are disabled", () => {
	render(<App />);

	expect(screen.getByRole("button", { name: /Generate plan/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: /Configure/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Export data" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "Import data" })).toBeEnabled();
});

function planFile(plan: unknown, name = "plan.json"): File {
	return new File([JSON.stringify(plan)], name, { type: "application/json" });
}

function pickFile(file: File) {
	const input = screen.getByLabelText("Care plan file");
	fireEvent.change(input, { target: { files: [file] } });
	return input as HTMLInputElement;
}

test("the import button opens the file picker", () => {
	render(<App />);
	const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

	fireEvent.click(screen.getByRole("button", { name: "Import data" }));

	expect(click).toHaveBeenCalled();
	click.mockRestore();
});

test("importing a valid plan fills the editor", async () => {
	render(<App />);

	const input = pickFile(
		planFile({
			patient: { initials: "J.D.", dob: "2001-04-17", chartId: "A1234" },
			subjective: { complaint: "Sensitivity on the lower left" },
			objective: {},
			needs: [{ type: "health", isMet: false }],
		}),
	);

	// The patient badge carries the initials even while the section is collapsed.
	await waitFor(() => expect(screen.getByText("J.D.")).toBeInTheDocument());
	expect(screen.getByText("1 assessed / 1 unmet")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));

	expect(screen.getByDisplayValue("J.D.")).toBeInTheDocument();
	expect(screen.getByDisplayValue("2001-04-17")).toBeInTheDocument();
	expect(screen.getByDisplayValue("A1234")).toBeInTheDocument();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	// Cleared so re-picking the same file still fires a change.
	expect(input.value).toBe("");
});

test("dismissing the picker without a file changes nothing", async () => {
	render(<App />);

	fireEvent.change(screen.getByLabelText("Care plan file"), { target: { files: [] } });

	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	// The new plan lists every need, none of them assessed yet.
	expect(screen.getByText("0 assessed / 0 unmet")).toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: /Human needs/ }));
	expect(screen.getAllByText("Not started")).toHaveLength(DEFAULT_PLAN.needs.length);
});

test("importing an invalid plan explains the problems and leaves the editor alone", async () => {
	render(<App />);

	pickFile(planFile({ patient: { initials: "JD" } }, "broken.json"));

	const dialog = await screen.findByRole("dialog");
	expect(dialog).toHaveAccessibleName("Cannot import this file");
	expect(screen.getByText(/“broken.json” is not a valid care plan/)).toBeInTheDocument();
	expect(within(dialog).getByText("Subjective data")).toBeInTheDocument();
	expect(
		screen.getAllByText("This field is required, but the file does not have it.").length,
	).toBeGreaterThan(1);

	fireEvent.click(screen.getByRole("button", { name: "Close" }));

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	// The rejected initials never reached the editor.
	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));
	expect(screen.getByLabelText("Initials")).toHaveValue("");
});

test("only the first dozen problems are listed, the rest are counted", async () => {
	render(<App />);

	pickFile(
		planFile({
			patient: { initials: "JD", dob: "2001-04-17", chartId: "A1234" },
			subjective: {},
			objective: {},
			needs: Array.from({ length: 14 }, () => ({ type: "health", isMet: "yes" })),
		}),
	);

	await screen.findByRole("dialog");
	expect(screen.getAllByText(/Need met$/)).toHaveLength(12);
	expect(screen.getByText("…and 2 more problems.")).toBeInTheDocument();
});

test("the error dialog closes on Escape", async () => {
	render(<App />);

	pickFile(planFile({ nope: true }));

	await screen.findByRole("dialog");
	fireEvent.keyDown(document, { key: "Escape" });

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("an unreadable file is reported without any field list", async () => {
	render(<App />);
	const file = planFile({});
	vi.spyOn(file, "text").mockRejectedValue(new Error("NotReadableError"));

	pickFile(file);

	await screen.findByRole("dialog");
	expect(screen.getByText(/could not be read/)).toBeInTheDocument();
	expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});

async function importNamedPatient() {
	pickFile(
		planFile({
			patient: { initials: "J.D.", dob: "2001-04-17", chartId: "A1234" },
			subjective: {},
			objective: {},
			needs: [{ type: "health", isMet: false }],
		}),
	);
	await waitFor(() => expect(screen.getByText("J.D.")).toBeInTheDocument());
}

test("starting a new plan asks first and replaces the plan once confirmed", async () => {
	render(<App />);
	await importNamedPatient();

	fireEvent.click(screen.getByRole("button", { name: "New plan" }));

	const dialog = await screen.findByRole("dialog");
	expect(dialog).toHaveAccessibleName("Start a new plan?");
	// Still the imported plan until the user says yes.
	expect(screen.getByText("J.D.")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Start new plan" }));

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(screen.queryByText("J.D.")).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: /Human needs/ }));
	expect(screen.getAllByText("Not started")).toHaveLength(DEFAULT_PLAN.needs.length);
});

test("a new plan returns the editor to its initial view", async () => {
	render(<App />);

	// Open a section that starts collapsed, so a stale view would be visible.
	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));
	expect(screen.getByLabelText("Initials")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "New plan" }));
	await screen.findByRole("dialog");
	fireEvent.click(screen.getByRole("button", { name: "Start new plan" }));

	expect(screen.queryByLabelText("Initials")).not.toBeInTheDocument();
	// Every section, including Human needs, returns to its collapsed initial state.
	fireEvent.click(screen.getByRole("button", { name: /Human needs/ }));
	expect(screen.getAllByText("Not started")).toHaveLength(DEFAULT_PLAN.needs.length);
});

test("cancelling or dismissing the new plan prompt keeps the current plan", async () => {
	render(<App />);
	await importNamedPatient();

	fireEvent.click(screen.getByRole("button", { name: "New plan" }));
	await screen.findByRole("dialog");
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(screen.getByText("J.D.")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "New plan" }));
	await screen.findByRole("dialog");
	fireEvent.keyDown(document, { key: "Escape" });

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(screen.getByText("J.D.")).toBeInTheDocument();
});

test("case study text is editable", () => {
	render(<App />);

	const caseText = screen.getByPlaceholderText("Paste patient case text here…");
	fireEvent.change(caseText, { target: { value: "42 y/o patient, no relevant history" } });

	expect(caseText).toHaveValue("42 y/o patient, no relevant history");
});
