import type { ComponentType, SVGProps } from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CloudIcon,
	CloudOffIcon,
	DocumentIcon,
	DownloadIcon,
	NewDocumentIcon,
	SettingsIcon,
	UploadIcon,
} from "./icons";

const APP_VERSION = __APP_VERSION__;

interface CommandAction {
	key: string;
	label: string;
	Icon: ComponentType<SVGProps<SVGSVGElement>>;
	disabled?: boolean;
}

const ACTIONS: CommandAction[] = [
	{ key: "new", label: "New plan", Icon: NewDocumentIcon },
	{ key: "import", label: "Import data", Icon: UploadIcon },
	{ key: "export", label: "Export data", Icon: DownloadIcon },
	{ key: "generate", label: "Generate plan", Icon: DocumentIcon },
	{ key: "configure", label: "Configure", Icon: SettingsIcon },
];

interface CommandBarProps {
	collapsed: boolean;
	onToggleCollapsed: () => void;
	onNewPlan: () => void;
	onImport: () => void;
	onExport: () => void;
	onGenerate: () => void;
	onConfigure: () => void;
	autosaveAvailable: boolean;
}

export default function CommandBar({
	collapsed,
	onToggleCollapsed,
	onNewPlan,
	onImport,
	onExport,
	onGenerate,
	onConfigure,
	autosaveAvailable,
}: CommandBarProps) {
	const handlers: Record<string, () => void> = {
		new: onNewPlan,
		import: onImport,
		export: onExport,
		generate: onGenerate,
		configure: onConfigure,
	};

	return (
		<nav
			className={`flex flex-col bg-[#1F4D43] text-[#EFEFE9] transition-[width] ${
				collapsed ? "w-14" : "w-56"
			}`}
		>
			<div className="flex items-center justify-between p-3">
				{!collapsed && (
					<h1 className="whitespace-nowrap font-serif text-base font-semibold">
						Care Plan Builder
					</h1>
				)}
				<button
					type="button"
					title={collapsed ? "Expand" : "Collapse"}
					onClick={onToggleCollapsed}
					className="rounded p-1 text-[#9FC3B7] hover:bg-white/10 hover:text-[#EFEFE9]"
				>
					{collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
				</button>
			</div>

			<div className="flex flex-1 flex-col gap-1 p-2">
				{ACTIONS.map(({ key, label, Icon, disabled }) => (
					<button
						key={key}
						type="button"
						title={disabled ? `${label} (coming soon)` : label}
						disabled={disabled}
						onClick={handlers[key]}
						className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${
							disabled
								? "cursor-not-allowed text-[#6F8F86]"
								: "text-[#CFE3DC] hover:bg-white/10 hover:text-[#EFEFE9]"
						} ${collapsed ? "justify-center" : ""}`}
					>
						<Icon />
						{!collapsed && <span>{label}</span>}
					</button>
				))}
			</div>

			{!collapsed && (
				<div className="flex items-center justify-between border-t border-white/10 p-3 font-mono text-xs text-[#9FC3B7]">
					<span>Version {APP_VERSION}</span>
					<span
						title={
							autosaveAvailable
								? "Autosave is on — your work is saved in this browser as you type"
								: "Autosave is off — this browser's storage is unavailable"
						}
					>
						{autosaveAvailable ? (
							<CloudIcon className="h-4 w-4" />
						) : (
							<CloudOffIcon className="h-4 w-4 text-amber-400" />
						)}
					</span>
				</div>
			)}
		</nav>
	);
}
