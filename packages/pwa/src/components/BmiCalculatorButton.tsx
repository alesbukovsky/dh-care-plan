import type { Config } from "@dh-care-plan/core";
import { CalculatorIcon } from "@phosphor-icons/react";
import { useState } from "react";
import BmiCalculatorDialog from "./BmiCalculatorDialog";

interface BmiCalculatorButtonProps {
	config: Config;
	onAccept: (result: string | undefined) => void;
}

export default function BmiCalculatorButton({ config, onAccept }: BmiCalculatorButtonProps) {
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
					config={config}
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
