import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../src/App";

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
	expect(screen.getByText("v")).toBeInTheDocument();

	fireEvent.click(screen.getByRole("button", { name: "Expand" }));

	expect(screen.getByRole("heading", { name: "Care Plan Builder" })).toBeInTheDocument();
	expect(screen.getByText(/^Version /)).toBeInTheDocument();
});

test("case study text is editable", () => {
	render(<App />);

	const caseText = screen.getByPlaceholderText("Paste patient case text here…");
	fireEvent.change(caseText, { target: { value: "42 y/o patient, no relevant history" } });

	expect(caseText).toHaveValue("42 y/o patient, no relevant history");
});
