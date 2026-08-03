import { DEFAULT_CONFIG } from "@dh-care-plan/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ConfigDialog from "../../src/components/ConfigDialog";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

test("the dialog opens pre-filled with the current config", () => {
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	expect(screen.getByDisplayValue(DEFAULT_CONFIG.format.date)).toBeInTheDocument();
	expect(screen.getByDisplayValue(DEFAULT_CONFIG.mapping.need.image)).toBeInTheDocument();
	expect(screen.getByDisplayValue(DEFAULT_CONFIG.mapping.outcome.met)).toBeInTheDocument();
});

test("editing a field and cancelling does not call onSave", () => {
	const onSave = vi.fn();
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={onSave}
			onCancel={vi.fn()}
		/>,
	);

	fireEvent.change(screen.getByLabelText("Date"), { target: { value: "YYYY-MM-DD" } });
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

	expect(onSave).not.toHaveBeenCalled();
});

test("editing a field and saving passes the whole updated config", () => {
	const onSave = vi.fn();
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={onSave}
			onCancel={vi.fn()}
		/>,
	);

	fireEvent.change(screen.getByLabelText("Date"), { target: { value: "YYYY-MM-DD" } });
	fireEvent.click(screen.getByRole("button", { name: "Save" }));

	expect(onSave).toHaveBeenCalledWith({
		...DEFAULT_CONFIG,
		format: { ...DEFAULT_CONFIG.format, date: "YYYY-MM-DD" },
	});
});

test("reset to defaults restores an edited field without saving", () => {
	const onSave = vi.fn();
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={onSave}
			onCancel={vi.fn()}
		/>,
	);

	fireEvent.change(screen.getByLabelText("Date"), { target: { value: "YYYY-MM-DD" } });
	fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));

	expect(screen.getByLabelText("Date")).toHaveValue(DEFAULT_CONFIG.format.date);

	fireEvent.click(screen.getByRole("button", { name: "Save" }));
	expect(onSave).toHaveBeenCalledWith(DEFAULT_CONFIG);
});

test("the dialog closes on Escape via onCancel", () => {
	const onCancel = vi.fn();
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={vi.fn()}
			onCancel={onCancel}
		/>,
	);

	fireEvent.keyDown(document, { key: "Escape" });

	expect(onCancel).toHaveBeenCalled();
});

test("the import button opens the file picker", () => {
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);
	const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

	fireEvent.click(screen.getByRole("button", { name: "Import" }));

	expect(click).toHaveBeenCalled();
	click.mockRestore();
});

function configPickerFile(config: unknown, name = "config.json"): File {
	return new File([JSON.stringify(config)], name, { type: "application/json" });
}

test("importing a valid config file replaces the draft", async () => {
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={vi.fn()}
			onSave={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	const imported = {
		...DEFAULT_CONFIG,
		format: { ...DEFAULT_CONFIG.format, date: "DD/MM/YYYY" },
	};
	const input = screen.getByLabelText("Care plan config file");
	fireEvent.change(input, { target: { files: [configPickerFile(imported)] } });

	expect(await screen.findByDisplayValue("DD/MM/YYYY")).toBeInTheDocument();
});

test("importing an invalid config file reports the failure and leaves the draft alone", async () => {
	const onImportFailure = vi.fn();
	render(
		<ConfigDialog
			config={DEFAULT_CONFIG}
			onImportFailure={onImportFailure}
			onSave={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	const input = screen.getByLabelText("Care plan config file");
	fireEvent.change(input, {
		target: { files: [configPickerFile({ ...DEFAULT_CONFIG, format: undefined }, "broken.json")] },
	});

	await vi.waitFor(() => expect(onImportFailure).toHaveBeenCalled());
	expect(onImportFailure.mock.calls[0]?.[0].summary).toContain(
		"“broken.json” is not a valid config",
	);
	expect(screen.getByLabelText("Date")).toHaveValue(DEFAULT_CONFIG.format.date);
});
