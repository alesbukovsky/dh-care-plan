import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function UpdateToast() {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_url, registration) {
			if (!registration) return;
			setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS);
		},
	});

	if (!needRefresh) return null;

	return (
		<div role="status" className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
			<div className="flex w-fit max-w-full flex-col gap-3 rounded-[10px] border border-[#C08A2E] bg-[#F6ECD4] px-4 py-3 shadow-xl">
				<p className="whitespace-nowrap text-sm text-[#6B5216]">
					A new application version is available! Your data is safe and nothing will be lost.
				</p>
				<div className="flex justify-center gap-2">
					<button
						type="button"
						onClick={() => setNeedRefresh(false)}
						className="rounded border border-[#C08A2E] bg-white px-3 py-1.5 text-sm text-[#6B5216] hover:bg-[#F6EFD6]"
					>
						Dismiss
					</button>
					<button
						type="button"
						onClick={() => updateServiceWorker(true)}
						className="rounded bg-[#1F4D43] px-3 py-1.5 text-sm text-[#EFEFE9] hover:bg-[#2A6154]"
					>
						Refresh
					</button>
				</div>
			</div>
		</div>
	);
}
