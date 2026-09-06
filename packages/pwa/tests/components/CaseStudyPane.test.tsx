import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import CaseStudyPane from "../../src/components/CaseStudyPane";

afterEach(cleanup);

function selectAllTextIn(el: HTMLElement) {
	const range = document.createRange();
	range.selectNodeContents(el);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

let latest = "";

function Harness() {
	const [value, setValue] = useState("");
	latest = value;
	return (
		<CaseStudyPane
			value={value}
			onChange={(next) => {
				setValue(next);
				latest = next;
			}}
		/>
	);
}

test("shows a placeholder until the case study has content", () => {
	render(<Harness />);
	expect(screen.getByText("Paste patient case text here…")).toBeInTheDocument();
});

test("typing updates the plan's case study text", () => {
	render(<Harness />);
	const editor = screen.getByRole("textbox", { name: "Case study" });

	editor.textContent = "sensitive teeth on the lower left";
	fireEvent.input(editor);

	expect(latest).toBe("sensitive teeth on the lower left");
});

test("selecting text and clicking a color swatch highlights it", () => {
	render(<Harness />);
	const editor = screen.getByRole("textbox", { name: "Case study" });

	editor.textContent = "sensitive teeth";
	fireEvent.input(editor);
	selectAllTextIn(editor);

	fireEvent.mouseDown(screen.getByTitle("Highlight yellow"));

	expect(latest).toBe('<mark class="bg-yellow-200">sensitive teeth</mark>');
});

test("clear removes a highlight but keeps the text", () => {
	render(<Harness />);
	const editor = screen.getByRole("textbox", { name: "Case study" });

	editor.textContent = "sensitive teeth";
	fireEvent.input(editor);
	selectAllTextIn(editor);
	fireEvent.mouseDown(screen.getByTitle("Highlight yellow"));

	selectAllTextIn(editor);
	fireEvent.mouseDown(screen.getByTitle("Clear highlight"));

	expect(latest).toBe("sensitive teeth");
});
