import { renderCarePlan } from "dh-care-plan";
import { useRef, useState } from "react";
import { staticData } from "./data";

export default function App() {
	const [errors, setErrors] = useState<string[] | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		setErrors(null);

		try {
			const templateBuffer = await file.arrayBuffer();
			const output = renderCarePlan(templateBuffer, staticData);

			const baseName = file.name.replace(/\.docx$/i, "");
			const blob = new Blob([output as BlobPart], {
				type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			});
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `${baseName}-filled.docx`;
			anchor.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			setErrors(message.split("\n"));
		}
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-slate-100">
			<h1 className="text-3xl font-semibold">Care Plan</h1>

			<input
				ref={inputRef}
				type="file"
				accept=".docx"
				onChange={handleFileChange}
				className="hidden"
			/>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				className="rounded bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white"
			>
				Choose template
			</button>

			{errors && (
				<div className="w-full max-w-lg rounded border border-red-500 bg-red-950/50 p-4 text-sm text-red-200">
					<p className="mb-2 font-semibold">Conversion failed:</p>
					<ul className="list-inside list-disc space-y-1">
						{errors.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				</div>
			)}
		</main>
	);
}
