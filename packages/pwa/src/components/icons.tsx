import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-4 w-4 shrink-0"
			aria-hidden="true"
			{...props}
		/>
	);
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M12 3v11" />
			<path d="M7.5 10 12 14.5 16.5 10" />
			<path d="M4.5 17.5v2A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
		</Icon>
	);
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M12 14V3" />
			<path d="M7.5 7.5 12 3l4.5 4.5" />
			<path d="M4.5 17.5v2A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
		</Icon>
	);
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" />
			<path d="M14 3.5V8h4.5" />
			<path d="M9 13h6" />
			<path d="M9 16.5h6" />
		</Icon>
	);
}

export function NewDocumentIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z" />
			<path d="M14 3.5V8h4.5" />
			<path d="M12 12v5M9.5 14.5h5" />
		</Icon>
	);
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
			<path d="M19.55 14.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3.5a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9.5a1.65 1.65 0 0 0 1-1.51V3.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H20.5a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
		</Icon>
	);
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M14.5 5 8 12l6.5 7" />
		</Icon>
	);
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M9.5 5 16 12l-6.5 7" />
		</Icon>
	);
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M12 5v14M5 12h14" />
		</Icon>
	);
}

export function CloudIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M7 18.5a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.71-1.79A4.5 4.5 0 0 1 17.5 18.5H7Z" />
		</Icon>
	);
}

export function CloudOffIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M7 18.5a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.71-1.79A4.5 4.5 0 0 1 17.5 18.5H7Z" />
			<path d="M4 4l16 16" />
		</Icon>
	);
}

export function EraserIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="m16 5 3 3-9.5 9.5H6V14Z" />
			<path d="M9 20h9" />
		</Icon>
	);
}

export function CalculatorIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<rect x="5" y="3" width="14" height="18" rx="1.5" />
			<path d="M8 6.5h8" />
			<path d="M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h.01M16 18h.01" />
		</Icon>
	);
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<path d="M5 7h14" />
			<path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
			<path d="M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" />
			<path d="M10.5 11v6M13.5 11v6" />
		</Icon>
	);
}
