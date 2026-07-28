import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
	expect(JSON.parse(write.mock.calls[0]?.[0] as string)).toMatchObject({ needs: [] });
});

test("the unimplemented actions are disabled", () => {
	render(<App />);

	expect(screen.getByRole("button", { name: /Generate plan/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: /Configure/ })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Export data" })).toBeEnabled();
});

test("case study text is editable", () => {
	render(<App />);

	const caseText = screen.getByPlaceholderText("Paste patient case text here…");
	fireEvent.change(caseText, { target: { value: "42 y/o patient, no relevant history" } });

	expect(caseText).toHaveValue("42 y/o patient, no relevant history");
});
