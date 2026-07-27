import { type ReactNode, useState } from "react";

interface SectionProps {
	title: string;
	hint?: string;
	badge?: string;
	defaultExpanded?: boolean;
	children: ReactNode;
}

export default function Section({
	title,
	hint,
	badge,
	defaultExpanded = false,
	children,
}: SectionProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);

	return (
		<div className="rounded-[10px] border border-[#D8DED9] bg-[#FBFCFA]">
			<button
				type="button"
				className="flex w-full items-center gap-4 px-4 py-3 text-left"
				onClick={() => setExpanded((prev) => !prev)}
			>
				<div className="min-w-0 flex-1">
					<h3 className="font-serif font-medium text-[#1E2B27]">{title}</h3>
					{hint && <p className="text-xs leading-snug text-[#4B5B55]">{hint}</p>}
				</div>
				{badge && (
					<span className="shrink-0 rounded-full bg-[#EEEEEC] px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-[#7C8B86]">
						{badge}
					</span>
				)}
				<span className="shrink-0 text-[#7C8B86]">{expanded ? "▾" : "▸"}</span>
			</button>

			{expanded && (
				<div className="space-y-4 border-t border-[#D8DED9] px-4 py-4 text-sm text-[#4B5B55]">
					{children}
				</div>
			)}
		</div>
	);
}
