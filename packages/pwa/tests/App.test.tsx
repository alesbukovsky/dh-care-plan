import {
	checkTemplate,
	render as coreRender,
	DEFAULT_CONFIG,
	DEFAULT_PLAN,
} from "@dh-care-plan/core";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "../src/App";
import { loadDraft, saveDraft } from "../src/persistence";

vi.mock("@dh-care-plan/core", async () => {
	const actual = await vi.importActual<typeof import("@dh-care-plan/core")>("@dh-care-plan/core");
	return { ...actual, checkTemplate: vi.fn(), render: vi.fn() };
});

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
	vi.useRealTimers();
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

test("every command bar action is enabled", () => {
	render(<App />);

	expect(screen.getByRole("button", { name: "Configure" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "Export data" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "Import data" })).toBeEnabled();
	expect(screen.getByRole("button", { name: /Generate plan/ })).toBeEnabled();
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

	pickFile(planFile({ patient: { initials: "JD" }, needs: [{}, {}] }, "broken.json"));

	const dialog = await screen.findByRole("dialog");
	expect(dialog).toHaveAccessibleName("Cannot import this file");
	expect(screen.getByText(/“broken.json” is not a valid care plan/)).toBeInTheDocument();
	expect(within(dialog).getByText("Human needs #1 → Need type")).toBeInTheDocument();
	expect(
		screen.getAllByText(
			"Must be one of: image, peace, integrity, health, comfort, dentition, understanding, responsibility, maintenance.",
		).length,
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

	pickFile(planFile({ needs: "none" }));

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

function templateFile(name = "template.docx"): File {
	return new File([new Uint8Array([1, 2, 3])], name, {
		type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});
}

function pickTemplateFile(file: File) {
	const input = screen.getByLabelText("Care plan template file");
	fireEvent.change(input, { target: { files: [file] } });
	return input as HTMLInputElement;
}

function stubDownload() {
	const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
	vi.stubGlobal(
		"URL",
		Object.assign(URL, { createObjectURL: () => "blob:plan", revokeObjectURL() {} }),
	);
	return click;
}

test("the generate button opens a dialog to pick a template, with the output name already shown", async () => {
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));

	const dialog = await screen.findByRole("dialog");
	expect(dialog).toHaveAccessibleName("Generate a plan");
	expect(within(dialog).getByText(/\.docx$/)).toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
});

test("the Generate button becomes actionable as soon as a template is picked", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();

	pickTemplateFile(templateFile("my-template.docx"));
	await screen.findByText("my-template.docx");

	expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
});

test("generating downloads the rendered docx under its generated name and closes the dialog", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	vi.mocked(coreRender).mockReturnValue({ ok: true, output: new Uint8Array([9, 9, 9]) });
	const click = stubDownload();
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile());
	await waitFor(() => expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled());

	fireEvent.click(screen.getByRole("button", { name: "Generate" }));

	await waitFor(() => expect(click).toHaveBeenCalled());
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("cancelling the generate dialog discards the picked template", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile());
	await screen.findByText("template.docx");

	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

	// Reopening starts clean rather than resuming the discarded pick.
	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	expect(screen.getByText("No template selected")).toBeInTheDocument();
});

test("an invalid template reports the tag issues and keeps the generate dialog open", async () => {
	vi.mocked(checkTemplate).mockReturnValue({
		ok: false,
		issues: [{ path: "unknownTag", message: "not defined in Template" }],
	});
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile("bad.docx"));

	const errorDialog = await screen.findByRole("dialog", { name: "Cannot generate plan" });
	expect(within(errorDialog).getByText(/“bad.docx” is not a valid template/)).toBeInTheDocument();
	expect(within(errorDialog).getByText("unknownTag")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Close" }));

	// The generate dialog is still there so the user can pick a different template.
	expect(screen.getByRole("dialog", { name: "Generate a plan" })).toBeInTheDocument();
});

test("a render failure is reported without downloading anything", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	vi.mocked(coreRender).mockReturnValue({ ok: false, message: "boom" });
	const click = stubDownload();
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile());
	await waitFor(() => expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled());

	fireEvent.click(screen.getByRole("button", { name: "Generate" }));

	const errorDialog = await screen.findByRole("dialog", { name: "Cannot generate plan" });
	expect(within(errorDialog).getByText("Could not generate the plan.")).toBeInTheDocument();
	expect(within(errorDialog).getByText("boom")).toBeInTheDocument();
	expect(click).not.toHaveBeenCalled();
});

test("configuring updates the config passed when generating a plan", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	vi.mocked(coreRender).mockReturnValue({ ok: true, output: new Uint8Array([9, 9, 9]) });
	stubDownload();
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Configure" }));
	const configDialog = await screen.findByRole("dialog");
	fireEvent.change(within(configDialog).getByLabelText("Date"), {
		target: { value: "DD/MM/YYYY" },
	});
	fireEvent.click(within(configDialog).getByRole("button", { name: "Save" }));

	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile());
	await waitFor(() => expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled());
	fireEvent.click(screen.getByRole("button", { name: "Generate" }));

	expect(coreRender).toHaveBeenCalledWith(
		DEFAULT_PLAN,
		expect.anything(),
		expect.objectContaining({ format: expect.objectContaining({ date: "DD/MM/YYYY" }) }),
	);
});

test("cancelling the config dialog discards the edited config", async () => {
	vi.mocked(checkTemplate).mockReturnValue({ ok: true });
	vi.mocked(coreRender).mockReturnValue({ ok: true, output: new Uint8Array([9, 9, 9]) });
	stubDownload();
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: "Configure" }));
	const configDialog = await screen.findByRole("dialog");
	fireEvent.change(within(configDialog).getByLabelText("Date"), {
		target: { value: "DD/MM/YYYY" },
	});
	fireEvent.click(within(configDialog).getByRole("button", { name: "Cancel" }));

	fireEvent.click(screen.getByRole("button", { name: "Generate plan" }));
	await screen.findByRole("dialog");
	pickTemplateFile(templateFile());
	await waitFor(() => expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled());
	fireEvent.click(screen.getByRole("button", { name: "Generate" }));

	expect(coreRender).toHaveBeenCalledWith(DEFAULT_PLAN, expect.anything(), DEFAULT_CONFIG);
});

test("case study text is editable", () => {
	render(<App />);

	const caseText = screen.getByRole("textbox", { name: "Case study" });
	caseText.textContent = "42 y/o patient, no relevant history";
	fireEvent.input(caseText);

	expect(caseText).toHaveTextContent("42 y/o patient, no relevant history");
});

test("a previously saved draft is restored when the app loads", () => {
	saveDraft({ ...DEFAULT_PLAN, patient: { initials: "J.D." } }, DEFAULT_CONFIG);

	render(<App />);

	expect(screen.getByText("J.D.")).toBeInTheDocument();
});

test("edits are autosaved to the draft a short pause after the last change", () => {
	vi.useFakeTimers();
	render(<App />);

	fireEvent.click(screen.getByRole("button", { name: /Patient/ }));
	fireEvent.change(screen.getByLabelText("Initials"), { target: { value: "J.D." } });

	// Not yet — still within the debounce window.
	expect(loadDraft()).toBeNull();

	vi.advanceTimersByTime(1000);

	expect(loadDraft()?.plan.patient?.initials).toBe("J.D.");
});

test("starting a new plan clears the saved draft, not just the editor", async () => {
	render(<App />);
	await importNamedPatient();
	saveDraft({ ...DEFAULT_PLAN, patient: { initials: "J.D." } }, DEFAULT_CONFIG);

	fireEvent.click(screen.getByRole("button", { name: "New plan" }));
	await screen.findByRole("dialog");
	fireEvent.click(screen.getByRole("button", { name: "Start new plan" }));

	expect(loadDraft()).toBeNull();
});

test("the autosave icon shows enabled when storage works", () => {
	render(<App />);
	expect(screen.getByTitle(/Autosave is on/)).toBeInTheDocument();
	expect(screen.queryByTitle(/Autosave is off/)).not.toBeInTheDocument();
});

test("the autosave icon shows disabled when storage is unavailable", () => {
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("SecurityError");
	});

	render(<App />);

	expect(screen.getByTitle(/Autosave is off/)).toBeInTheDocument();
});
