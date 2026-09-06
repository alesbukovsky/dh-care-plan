interface CaseStudyPaneProps {
	value: string;
	onChange: (value: string) => void;
}

export default function CaseStudyPane({ value, onChange }: CaseStudyPaneProps) {
	return (
		<section className="flex min-w-0 flex-[2] flex-col bg-[#F3EFE4] p-4">
			<h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-[#7C8B86]">
				Case study
			</h2>
			<textarea
				className="flex-1 resize-y rounded-lg border border-[#B9C3BD] bg-white p-3 text-sm text-[#1E2B27] outline-none focus:border-[#7C8B86]"
				placeholder="Paste patient case text here…"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</section>
	);
}
