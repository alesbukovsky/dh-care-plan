import {
	type ClipboardEvent,
	type FormEvent,
	type KeyboardEvent,
	type MouseEvent,
	useEffect,
	useRef,
} from "react";
import {
	applyHighlight,
	getSelectionRangeWithin,
	HIGHLIGHT_COLORS,
	insertPlainText,
	sanitizeHtml,
} from "../highlight";
import { EraserIcon } from "./icons";

interface CaseStudyPaneProps {
	value: string;
	onChange: (value: string) => void;
}

export default function CaseStudyPane({ value, onChange }: CaseStudyPaneProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const lastEmitted = useRef<string | null>(null);

	useEffect(() => {
		const el = editorRef.current;
		if (!el || value === lastEmitted.current) return;
		el.innerHTML = value;
		lastEmitted.current = value;
	}, [value]);

	function commit(el: HTMLDivElement) {
		const raw = el.innerHTML;
		const clean = sanitizeHtml(raw);
		if (clean !== raw) el.innerHTML = clean;
		lastEmitted.current = clean;
		onChange(clean);
	}

	function handleInput(event: FormEvent<HTMLDivElement>) {
		commit(event.currentTarget);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key !== "Enter") return;
		event.preventDefault();
		insertPlainText("\n");
		commit(event.currentTarget);
	}

	function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
		event.preventDefault();
		insertPlainText(event.clipboardData.getData("text/plain"));
		commit(event.currentTarget);
	}

	function handleHighlight(className: string | null) {
		return (event: MouseEvent<HTMLButtonElement>) => {
			// Keep the editor's selection alive across the button click.
			event.preventDefault();
			const el = editorRef.current;
			if (!el) return;
			const range = getSelectionRangeWithin(el);
			if (!range) return;
			applyHighlight(range, className);
			commit(el);
		};
	}

	return (
		<section className="flex min-w-0 flex-[2] flex-col bg-[#F3EFE4] p-4">
			<h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-[#7C8B86]">
				Case study
			</h2>
			<div className="mb-2 flex items-center gap-1.5">
				{HIGHLIGHT_COLORS.map((color) => (
					<button
						key={color.key}
						type="button"
						title={`Highlight ${color.label.toLowerCase()}`}
						onMouseDown={handleHighlight(color.className)}
						className={`h-5 w-5 rounded-full border border-black/10 ${color.className}`}
					/>
				))}
				<button
					type="button"
					title="Clear highlight"
					onMouseDown={handleHighlight(null)}
					className="ml-1 rounded p-1 text-[#7C8B86] hover:bg-[#EAE5D8] hover:text-[#B85C2E]"
				>
					<EraserIcon className="h-5 w-5" />
				</button>
			</div>
			<div className="relative min-h-0 flex-1">
				{value === "" && (
					<p className="pointer-events-none absolute inset-0 p-3 text-sm text-[#8C8C86]">
						Paste patient case text here…
					</p>
				)}
				{/* biome-ignore lint/a11y/useSemanticElements: a plain textarea can't render inline highlight marks */}
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					tabIndex={0}
					role="textbox"
					aria-multiline="true"
					aria-label="Case study"
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					className="h-full resize-y overflow-y-auto whitespace-pre-wrap rounded-lg border border-[#B9C3BD] bg-white p-3 text-sm text-[#1E2B27] outline-none focus:border-[#7C8B86]"
				/>
			</div>
		</section>
	);
}
