import type { Config } from "@dh-care-plan/core";
import { useState } from "react";
import DobCalculatorDialog from "./DobCalculatorDialog";
import { CalendarIcon } from "./icons";

interface DobCalculatorButtonProps {
	config: Config;
	onAccept: (result: string | undefined) => void;
}

export default function DobCalculatorButton({ config, onAccept }: DobCalculatorButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				title="Date of birth calculator"
				onClick={() => setOpen(true)}
				className="shrink-0 rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#2F6F62]"
			>
				<CalendarIcon className="h-5 w-5" />
			</button>
			{open && (
				<DobCalculatorDialog
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
