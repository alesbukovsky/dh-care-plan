export interface SaveFileType {
	description?: string;
	accept: Record<string, string[]>;
}

/** Widened from `BlobPart` so a `Uint8Array<ArrayBufferLike>`, as returned by `render`, fits too. */
export type SaveFileData = string | Uint8Array;

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: SaveFileType[];
}

interface WritableFile {
	write: (data: SaveFileData) => Promise<void>;
	close: () => Promise<void>;
}

interface SaveFileHandle {
	name: string;
	createWritable: () => Promise<WritableFile>;
}

/**
 * The File System Access API is not in the DOM typings yet, and is unavailable in
 * Firefox and Safari, where we fall back to a plain download.
 */
type FilePickerWindow = Window & {
	showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<SaveFileHandle>;
};

/**
 * Downloads data under the given name. Whether (and where) the browser then
 * asks for a save location depends entirely on the user's own browser
 * settings — this is a plain download, not a picker.
 */
export function downloadFile(data: SaveFileData, fileName: string, mimeType: string): void {
	const url = URL.createObjectURL(new Blob([data as BlobPart], { type: mimeType }));
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}

/** A place to write data to, chosen up front so writing can happen later. */
export interface SaveDestination {
	name: string;
	write: (data: SaveFileData) => Promise<void>;
}

/**
 * Asks the user where to save a file, without writing anything yet. Resolves
 * to `null` when the user cancels the picker. Browsers without the File
 * System Access API have no location to choose, so the destination just
 * downloads under the suggested name once written to.
 *
 * A picker call that fails for any other reason (e.g. denied permission)
 * throws by default so the failure isn't mistaken for a chosen destination.
 * Pass `lenientFallback: true` to instead treat that failure the same as an
 * unsupported browser, silently downloading under the suggested name.
 */
export async function pickSaveDestination(
	fileName: string,
	mimeType: string,
	types?: SaveFileType[],
	{ lenientFallback = false }: { lenientFallback?: boolean } = {},
): Promise<SaveDestination | null> {
	const picker = (window as FilePickerWindow).showSaveFilePicker;
	const fallback = (): SaveDestination => ({
		name: fileName,
		write: (data) => Promise.resolve(downloadFile(data, fileName, mimeType)),
	});

	if (!picker) return fallback();

	let handle: SaveFileHandle;
	try {
		handle = await picker.call(window, { suggestedName: fileName, types });
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") return null;
		if (lenientFallback) return fallback();
		throw error;
	}

	return {
		name: handle.name,
		write: async (data) => {
			const writable = await handle.createWritable();
			await writable.write(data);
			await writable.close();
		},
	};
}

/**
 * Asks the user where to save the given data and writes it there. Resolves
 * without writing anything when the user cancels the picker.
 */
export async function saveFile(
	data: SaveFileData,
	fileName: string,
	mimeType: string,
	types?: SaveFileType[],
): Promise<void> {
	const destination = await pickSaveDestination(fileName, mimeType, types, {
		lenientFallback: true,
	});
	await destination?.write(data);
}
