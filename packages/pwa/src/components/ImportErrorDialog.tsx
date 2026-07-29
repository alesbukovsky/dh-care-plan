import { useEffect, useRef } from "react";
import type { ImportIssue } from "../import";

/** Long lists of problems stop being useful; the rest are only counted. */
const MAX_SHOWN_ISSUES = 12;

interface ImportErrorDialogProps {
	summary: string;
	issues: ImportIssue[];
	onClose: () => void;
}

export default function ImportErrorDialog({ summary, issues, onClose }: ImportErrorDialogProps) {
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		closeRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const shown = issues.slice(0, MAX_SHOWN_ISSUES);
	const hidden = issues.length - shown.length;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2B27]/40 p-4">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="import-error-title"
				className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA] shadow-xl"
			>
				<div className="rounded-t-[10px] border-b border-[#D8DED9] bg-[#E7EDE8] px-4 py-3">
					<h2 id="import-error-title" className="font-serif font-medium text-[#1E2B27]">
						Cannot import this file
					</h2>
					<p className="mt-1 text-sm leading-snug text-[#4B5B55]">{summary}</p>
				</div>

				{shown.length > 0 && (
					<ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 text-sm text-[#4B5B55]">
						{shown.map((issue) => (
							<li
								key={`${issue.field}: ${issue.message}`}
								className="rounded border border-[#D8DED9] bg-white px-3 py-2"
							>
								<span className="font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
									{issue.field}
								</span>
								<p className="leading-snug">{issue.message}</p>
							</li>
						))}
						{hidden > 0 && (
							<li className="px-1 text-xs italic text-[#7C8B86]">
								…and {hidden} more problem{hidden === 1 ? "" : "s"}.
							</li>
						)}
					</ul>
				)}

				<div className="flex justify-end border-t border-[#D8DED9] px-4 py-3">
					<button
						ref={closeRef}
						type="button"
						onClick={onClose}
						className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154]"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
