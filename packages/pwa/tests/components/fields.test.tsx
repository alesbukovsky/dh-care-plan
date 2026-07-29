import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { Field, FieldGroup } from "../../src/components/fields";

test("a field with no value renders empty, and reports an emptied input as no value", () => {
	const seen: (string | undefined)[] = [];

	function Harness() {
		const [value, setValue] = useState<string | undefined>(undefined);
		return (
			<Field
				label="Chart ID"
				placeholder="e.g. 12345"
				value={value}
				onChange={(next) => {
					seen.push(next);
					setValue(next);
				}}
			/>
		);
	}

	render(<Harness />);

	const input = screen.getByLabelText("Chart ID");
	expect(input).toHaveValue("");

	fireEvent.change(input, { target: { value: "12345" } });
	expect(input).toHaveValue("12345");

	fireEvent.change(input, { target: { value: "" } });
	expect(seen).toEqual(["12345", undefined]);
	expect(input).toHaveValue("");
});

test("a multiline field with no value renders empty", () => {
	render(<Field label="Findings" value={undefined} multiline onChange={vi.fn()} />);

	expect(screen.getByLabelText("Findings")).toHaveValue("");
});

test("a field group with no value yet fills in the edited field alone", () => {
	const onChange = vi.fn();
	render(
		<FieldGroup<{ gi?: string; pi?: string }>
			fields={[
				{ key: "gi", label: "Gingival index", placeholder: "0-3", width: "half" },
				{ key: "pi", label: "Plaque index", placeholder: "0-100%", width: "half" },
			]}
			value={undefined}
			onChange={onChange}
		/>,
	);

	expect(screen.getByLabelText("Gingival index")).toHaveValue("");

	fireEvent.change(screen.getByLabelText("Plaque index"), { target: { value: "40%" } });
	expect(onChange).toHaveBeenCalledWith({ pi: "40%" });
});
