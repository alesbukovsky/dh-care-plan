import { type Config, dateStr } from "@dh-care-plan/core";
import { useEffect, useId, useRef, useState } from "react";
import { calculateAge } from "../age";
import { inputClass, labelClass } from "./fields";

interface DobCalculatorDialogProps {
	config: Config;
	onAccept: (result: string) => void;
	onCancel: () => void;
}

function formatDob(iso: string, config: Config): string | undefined {
	const age = calculateAge(iso);
	if (age === undefined) return undefined;

	return config.format.patient.dob
		.replace("{date}", dateStr(iso, config.format.date))
		.replace("{age}", String(age));
}

export default function DobCalculatorDialog({
	config,
	onAccept,
	onCancel,
}: DobCalculatorDialogProps) {
	const [date, setDate] = useState("");
	const cancelRef = useRef<HTMLButtonElement>(null);
	const dateId = useId();

	useEffect(() => {
		cancelRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	const result = date ? formatDob(date, config) : undefined;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="dob-dialog-title"
				className="flex w-full max-w-sm flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="dob-dialog-title" className="font-serif font-medium text-[#1E2B27]">
						Date of birth calculator
					</h2>
				</div>

				<div className="space-y-3 px-4 py-4">
					<div>
						<label htmlFor={dateId} className={labelClass}>
							Date of birth
						</label>
						<input
							id={dateId}
							type="date"
							className={`w-full ${inputClass}`}
							value={date}
							onChange={(event) => setDate(event.target.value)}
						/>
					</div>
					<div>
						<p className={labelClass}>Result</p>
						<p className="text-sm text-[#1E2B27]">
							{result ?? <span className="text-[#7C8B86]">Select a date of birth</span>}
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-[#D8DED9] px-4 py-3">
					<button
						ref={cancelRef}
						type="button"
						onClick={onCancel}
						className="rounded border border-[#D8DED9] bg-white px-3 py-1.5 text-sm text-[#1E2B27] hover:bg-[#EFF3EF]"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!result}
						onClick={() => result && onAccept(result)}
						className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154] disabled:cursor-not-allowed disabled:opacity-50"
					>
						Accept
					</button>
				</div>
			</div>
		</div>
	);
}
