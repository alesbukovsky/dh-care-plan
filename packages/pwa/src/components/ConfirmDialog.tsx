import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
	title: string;
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmDialog({
	title,
	message,
	confirmLabel,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	// Focus lands on cancel so a stray Enter never discards work.
	const cancelRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		cancelRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
				className="flex w-full max-w-md flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="confirm-dialog-title" className="font-serif font-medium text-[#1E2B27]">
						{title}
					</h2>
				</div>

				<p className="px-4 py-4 text-sm leading-snug text-[#4B5B55]">{message}</p>

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
						onClick={onConfirm}
						className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154]"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
