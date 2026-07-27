import { type ReactNode, useId } from "react";
import { PlusIcon, TrashIcon } from "./icons";

export const inputClass =
	"rounded-md border border-[#B9C3BD] bg-white px-2 py-1 text-sm text-[#1E2B27] outline-none focus:border-[#7C8B86]";

export const labelClass = "mb-1 block font-mono text-xs uppercase tracking-wide text-[#7C8B86]";

export interface FieldDefinition<T> {
	key: keyof T & string;
	label: string;
	placeholder: string;
	multiline?: boolean;
}

interface FieldProps {
	label: string;
	placeholder?: string;
	value: string | undefined;
	onChange: (next: string | undefined) => void;
	multiline?: boolean;
	type?: "text" | "date";
}

export function Field({
	label,
	placeholder,
	value,
	onChange,
	multiline,
	type = "text",
}: FieldProps) {
	const id = useId();

	return (
		<div>
			<label htmlFor={id} className={labelClass}>
				{label}
			</label>
			{multiline ? (
				<textarea
					id={id}
					rows={2}
					className={`w-full resize-none ${inputClass}`}
					placeholder={placeholder}
					value={value ?? ""}
					onChange={(event) => onChange(event.target.value || undefined)}
				/>
			) : (
				<input
					id={id}
					type={type}
					className={`w-full ${inputClass}`}
					placeholder={placeholder}
					value={value ?? ""}
					onChange={(event) => onChange(event.target.value || undefined)}
				/>
			)}
		</div>
	);
}

interface DerivedFieldProps {
	label: string;
	value: string;
	hint?: string;
}

export function DerivedField({ label, value, hint }: DerivedFieldProps) {
	const id = useId();

	return (
		<div>
			<label htmlFor={id} className={labelClass}>
				{label}
			</label>
			<input
				id={id}
				readOnly
				title={hint}
				className="w-full cursor-default rounded-md border border-dashed border-[#B9C3BD] bg-[#F6F5F0] px-2 py-1 text-sm text-[#4B5B55] outline-none"
				value={value}
			/>
		</div>
	);
}

interface StringListFieldProps {
	label: string;
	placeholder: string;
	addLabel: string;
	values: string[];
	onChange: (next: string[] | undefined) => void;
	type?: "text" | "date";
}

export function StringListField({
	label,
	placeholder,
	addLabel,
	values,
	onChange,
	type = "text",
}: StringListFieldProps) {
	return (
		<div>
			<p className={labelClass}>{label}</p>
			<div className="space-y-2">
				{values.map((value, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: list entries have no stable id in the schema
						key={`${label}-${index}`}
						className="flex items-center gap-2"
					>
						<input
							type={type}
							className={`flex-1 ${inputClass}`}
							placeholder={placeholder}
							value={value}
							onChange={(event) =>
								onChange(values.map((v, i) => (i === index ? event.target.value : v)))
							}
						/>
						<button
							type="button"
							title={`Remove ${label.toLowerCase()} entry`}
							onClick={() => {
								const next = values.filter((_, i) => i !== index);
								onChange(next.length > 0 ? next : undefined);
							}}
							className="rounded p-1 text-[#7C8B86] hover:bg-[#F0F0EC] hover:text-[#B85C2E]"
						>
							<TrashIcon />
						</button>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() => onChange([...values, ""])}
				className="mt-2 flex items-center gap-1 text-xs text-[#2F6F62] hover:underline"
			>
				<PlusIcon className="h-3.5 w-3.5" /> {addLabel}
			</button>
		</div>
	);
}

interface FieldGroupProps<T extends object> {
	title?: string;
	fields: FieldDefinition<T>[];
	value: T | undefined;
	onChange: (next: T) => void;
	children?: ReactNode;
}

export function FieldGroup<T extends object>({
	title,
	fields,
	value,
	onChange,
	children,
}: FieldGroupProps<T>) {
	return (
		<div className="space-y-3">
			{title && <p className="font-serif text-sm font-medium text-[#1E2B27]">{title}</p>}
			{fields.map((field) => (
				<Field
					key={field.key}
					label={field.label}
					placeholder={field.placeholder}
					multiline={field.multiline}
					value={value?.[field.key] as string | undefined}
					onChange={(next) => onChange({ ...value, [field.key]: next } as T)}
				/>
			))}
			{children}
		</div>
	);
}

export function countFilled(value: Record<string, unknown> | undefined): number {
	if (!value) return 0;
	return Object.values(value).filter((entry) =>
		Array.isArray(entry) ? entry.length > 0 : entry !== undefined && entry !== "",
	).length;
}
