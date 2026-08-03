import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import GenerateDialog from "../../src/components/GenerateDialog";

test("the Generate button is disabled until a template is named, and there's no destination step", () => {
	const { rerender } = render(
		<GenerateDialog
			templateName={null}
			fileName="plan.docx"
			onChooseTemplate={vi.fn()}
			onGenerate={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
	expect(screen.getByText("plan.docx")).toBeInTheDocument();
	// No picker step - just the template button, Cancel and Generate.
	expect(screen.getAllByRole("button")).toHaveLength(3);

	rerender(
		<GenerateDialog
			templateName="template.docx"
			fileName="plan.docx"
			onChooseTemplate={vi.fn()}
			onGenerate={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
});

test("re-rendering with a new onCancel (as happens when picking a template updates App state) does not refocus the Cancel button", () => {
	const focus = vi.spyOn(HTMLButtonElement.prototype, "focus");

	const { rerender } = render(
		<GenerateDialog
			templateName={null}
			fileName="plan.docx"
			onChooseTemplate={vi.fn()}
			onGenerate={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	expect(focus).toHaveBeenCalledTimes(1);

	// A fresh onCancel reference, exactly like App re-rendering after setTemplateSelection.
	rerender(
		<GenerateDialog
			templateName="template.docx"
			fileName="plan.docx"
			onChooseTemplate={vi.fn()}
			onGenerate={vi.fn()}
			onCancel={vi.fn()}
		/>,
	);

	// Still just the one focus call from mount.
	expect(focus).toHaveBeenCalledTimes(1);

	focus.mockRestore();
});
