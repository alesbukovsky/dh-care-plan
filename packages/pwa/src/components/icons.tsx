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

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<Icon {...props}>
			<circle cx="12" cy="12" r="3.25" />
			<path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5 5.4 5.4" />
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
