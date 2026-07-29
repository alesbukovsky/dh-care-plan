import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ImportErrorDialog from "../../src/components/ImportErrorDialog";
import type { ImportIssue } from "../../src/import";

function issues(count: number): ImportIssue[] {
	return Array.from({ length: count }, (_, index) => ({
		field: `Field ${index + 1}`,
		message: `Problem ${index + 1}`,
	}));
}

test("lists every issue when there are few enough to show", () => {
	render(
		<ImportErrorDialog summary="2 fields need attention:" issues={issues(2)} onClose={vi.fn()} />,
	);

	expect(screen.getByText("2 fields need attention:")).toBeInTheDocument();
	expect(screen.getAllByRole("listitem")).toHaveLength(2);
	expect(screen.queryByText(/more problem/)).not.toBeInTheDocument();
});

test("shows at most twelve issues and counts the rest", () => {
	const { rerender } = render(
		<ImportErrorDialog
			summary="13 fields need attention:"
			issues={issues(13)}
			onClose={vi.fn()}
		/>,
	);

	expect(screen.getByText("Problem 12")).toBeInTheDocument();
	expect(screen.queryByText("Problem 13")).not.toBeInTheDocument();
	expect(screen.getByText("…and 1 more problem.")).toBeInTheDocument();

	rerender(
		<ImportErrorDialog
			summary="15 fields need attention:"
			issues={issues(15)}
			onClose={vi.fn()}
		/>,
	);
	expect(screen.getByText("…and 3 more problems.")).toBeInTheDocument();
});

test("renders no issue list when the failure has no per-field problems", () => {
	render(<ImportErrorDialog summary="“plan.json” is empty." issues={[]} onClose={vi.fn()} />);

	expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});

test("focuses close on open, and closes on the button or Escape", () => {
	const onClose = vi.fn();
	render(
		<ImportErrorDialog summary="1 field needs attention:" issues={issues(1)} onClose={onClose} />,
	);

	const close = screen.getByRole("button", { name: "Close" });
	expect(close).toHaveFocus();

	fireEvent.keyDown(document, { key: "a" });
	expect(onClose).not.toHaveBeenCalled();

	fireEvent.keyDown(document, { key: "Escape" });
	expect(onClose).toHaveBeenCalledTimes(1);

	fireEvent.click(close);
	expect(onClose).toHaveBeenCalledTimes(2);
});

test("stops listening for Escape once it is gone", () => {
	const onClose = vi.fn();
	const { unmount } = render(
		<ImportErrorDialog summary="1 field needs attention:" issues={issues(1)} onClose={onClose} />,
	);

	unmount();
	fireEvent.keyDown(document, { key: "Escape" });
	expect(onClose).not.toHaveBeenCalled();
});
