import { useEffect, useRef } from "react";

interface GenerateDialogProps {
	templateName: string | null;
	fileName: string;
	onChooseTemplate: () => void;
	onGenerate: () => void;
	onCancel: () => void;
}

export default function GenerateDialog({
	templateName,
	fileName,
	onChooseTemplate,
	onGenerate,
	onCancel,
}: GenerateDialogProps) {
	const cancelRef = useRef<HTMLButtonElement>(null);
	const ready = Boolean(templateName);

	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	useEffect(() => {
		cancelRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancelRef.current();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="generate-dialog-title"
				className="flex w-full max-w-md flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="generate-dialog-title" className="font-serif font-medium text-[#1E2B27]">
						Generate a plan
					</h2>
					<p className="mt-1 text-sm leading-snug text-[#4B5B55]">
						Pick a template to fill in with this plan
					</p>
				</div>

				<div className="flex flex-col gap-3 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="text-sm font-medium text-[#1E2B27]">Template</p>
							<p className="truncate text-sm text-[#4B5B55]">
								{templateName ?? "No template selected"}
							</p>
						</div>
						<button
							type="button"
							onClick={onChooseTemplate}
							className="shrink-0 rounded border border-[#D8DED9] bg-white px-3 py-1.5 text-sm text-[#1E2B27] hover:bg-[#EFF3EF]"
						>
							{templateName ? "Change…" : "Choose template…"}
						</button>
					</div>

					<div>
						<p className="text-sm font-medium text-[#1E2B27]">Downloads as</p>
						<p className="truncate font-mono text-sm text-[#4B5B55]">{fileName}</p>
						<p className="mt-0.5 text-xs leading-snug text-[#7C8B86]">
							Depending on you browser you may be able to select location later.
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
						disabled={!ready}
						onClick={onGenerate}
						className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154] disabled:cursor-not-allowed disabled:bg-[#9FB6AE] disabled:hover:bg-[#9FB6AE]"
					>
						Generate
					</button>
				</div>
			</div>
		</div>
	);
}
