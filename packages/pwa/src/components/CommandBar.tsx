import type { ComponentType, SVGProps } from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	DocumentIcon,
	ExportIcon,
	ImportIcon,
	SettingsIcon,
} from "./icons";

const APP_VERSION = "0.1.0";

interface CommandAction {
	key: string;
	label: string;
	Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ACTIONS: CommandAction[] = [
	{ key: "import", label: "Import data", Icon: ImportIcon },
	{ key: "export", label: "Export data", Icon: ExportIcon },
	{ key: "generate", label: "Generate plan", Icon: DocumentIcon },
	{ key: "configure", label: "Configure", Icon: SettingsIcon },
];

interface CommandBarProps {
	collapsed: boolean;
	onToggleCollapsed: () => void;
}

export default function CommandBar({ collapsed, onToggleCollapsed }: CommandBarProps) {
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
				{ACTIONS.map(({ key, label, Icon }) => (
					<button
						key={key}
						type="button"
						title={label}
						onClick={() => {}}
						className={`flex items-center gap-2 rounded px-2 py-2 text-sm text-[#CFE3DC] hover:bg-white/10 hover:text-[#EFEFE9] ${
							collapsed ? "justify-center" : ""
						}`}
					>
						<Icon />
						{!collapsed && <span>{label}</span>}
					</button>
				))}
			</div>

			<div className="border-t border-white/10 p-3 font-mono text-xs text-[#9FC3B7]">
				{collapsed ? (
					<span title={`Version ${APP_VERSION}`}>v</span>
				) : (
					<span>Version {APP_VERSION}</span>
				)}
			</div>
		</nav>
	);
}
