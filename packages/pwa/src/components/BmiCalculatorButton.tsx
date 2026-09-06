import { useState } from "react";
import BmiCalculatorDialog from "./BmiCalculatorDialog";
import { CalculatorIcon } from "./icons";

interface BmiCalculatorButtonProps {
	onAccept: (result: string | undefined) => void;
}

export default function BmiCalculatorButton({ onAccept }: BmiCalculatorButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				title="BMI calculator"
				onClick={() => setOpen(true)}
				className="shrink-0 rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#2F6F62]"
			>
				<CalculatorIcon className="h-5 w-5" />
			</button>
			{open && (
				<BmiCalculatorDialog
					onAccept={(result) => {
						onAccept(result);
						setOpen(false);
					}}
					onCancel={() => setOpen(false)}
				/>
			)}
		</>
	);
}
