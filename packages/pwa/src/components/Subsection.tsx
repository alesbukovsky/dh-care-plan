import { type ReactNode, useState } from "react";

interface SubsectionProps {
	title: string;
	defaultExpanded?: boolean;
	children: ReactNode;
}

export default function Subsection({ title, defaultExpanded = false, children }: SubsectionProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);

	return (
		<div className="rounded-lg border border-[#D8DED9] bg-[#FBFCFA]">
			<button
				type="button"
				className={`flex w-full items-center gap-3 rounded-t-lg bg-[#E7EDE8] px-3 py-2 text-left ${
					expanded ? "" : "rounded-b-lg"
				}`}
				onClick={() => setExpanded((prev) => !prev)}
			>
				<h4 className="min-w-0 flex-1 font-serif text-sm font-medium text-[#1E2B27]">{title}</h4>
				<span className="shrink-0 text-xs text-[#7C8B86]">{expanded ? "▾" : "▸"}</span>
			</button>

			{expanded && <div className="space-y-3 border-t border-[#D8DED9] px-3 py-3">{children}</div>}
		</div>
	);
}
