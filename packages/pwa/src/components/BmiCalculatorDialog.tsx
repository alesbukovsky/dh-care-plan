import { useEffect, useId, useRef, useState } from "react";
import { inputClass, labelClass } from "./fields";

interface BmiCalculatorDialogProps {
	onAccept: (result: string) => void;
	onCancel: () => void;
}

function categorize(bmi: number): string {
	if (bmi < 18.5) return "underweight";
	if (bmi < 25) return "normal";
	if (bmi < 30) return "overweight";
	return "obese";
}

// Height is entered as feet + inches, but either one alone is enough:
// feet-only defaults inches to 0, inches-only (e.g. 64) is just read as total inches.
function calculateBmi(weightLbs: number, feet: number, inches: number): number | undefined {
	const totalInches = feet * 12 + inches;
	if (!(weightLbs > 0) || !(totalInches > 0)) return undefined;
	return (703 * weightLbs) / (totalInches * totalInches);
}

export default function BmiCalculatorDialog({ onAccept, onCancel }: BmiCalculatorDialogProps) {
	const [weight, setWeight] = useState("");
	const [feet, setFeet] = useState("");
	const [inches, setInches] = useState("");
	const cancelRef = useRef<HTMLButtonElement>(null);
	const weightId = useId();
	const feetId = useId();
	const inchesId = useId();

	useEffect(() => {
		cancelRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	const bmi = calculateBmi(Number(weight), Number(feet) || 0, Number(inches) || 0);
	const result = bmi !== undefined ? `${bmi.toFixed(1)} ${categorize(bmi)}` : undefined;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="bmi-dialog-title"
				className="flex w-full max-w-sm flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="bmi-dialog-title" className="font-serif font-medium text-[#1E2B27]">
						BMI calculator
					</h2>
				</div>

				<div className="space-y-3 px-4 py-4">
					<div>
						<label htmlFor={weightId} className={labelClass}>
							Weight (lbs)
						</label>
						<input
							id={weightId}
							type="number"
							min="0"
							className={`w-full ${inputClass}`}
							value={weight}
							onChange={(event) => setWeight(event.target.value)}
						/>
					</div>
					<div className="flex gap-3">
						<div className="flex-1">
							<label htmlFor={feetId} className={labelClass}>
								Height (ft)
							</label>
							<input
								id={feetId}
								type="number"
								min="0"
								className={`w-full ${inputClass}`}
								value={feet}
								onChange={(event) => setFeet(event.target.value)}
							/>
						</div>
						<div className="flex-1">
							<label htmlFor={inchesId} className={labelClass}>
								Height (in)
							</label>
							<input
								id={inchesId}
								type="number"
								min="0"
								className={`w-full ${inputClass}`}
								value={inches}
								onChange={(event) => setInches(event.target.value)}
							/>
						</div>
					</div>
					<div>
						<p className={labelClass}>Result</p>
						<p className="text-sm text-[#1E2B27]">
							{result ?? <span className="text-[#7C8B86]">Enter weight and height</span>}
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
