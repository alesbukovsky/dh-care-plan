export interface HighlightColor {
	key: string;
	label: string;
	className: string;
}

export const HIGHLIGHT_COLORS: readonly HighlightColor[] = [
	{ key: "yellow", label: "Yellow", className: "bg-yellow-200" },
	{ key: "green", label: "Green", className: "bg-green-200" },
	{ key: "pink", label: "Pink", className: "bg-pink-200" },
	{ key: "blue", label: "Blue", className: "bg-blue-200" },
];

const ALLOWED_MARK_CLASSES = new Set(HIGHLIGHT_COLORS.map((color) => color.className));

function isAllowedMark(el: Element): boolean {
	return (
		el.tagName === "MARK" && el.attributes.length === 1 && ALLOWED_MARK_CLASSES.has(el.className)
	);
}

function sanitizeChildren(node: Node): void {
	for (const child of Array.from(node.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) continue;
		if (child.nodeType !== Node.ELEMENT_NODE) {
			node.removeChild(child);
			continue;
		}
		const el = child as Element;
		sanitizeChildren(el);
		if (isAllowedMark(el)) continue;

		// Flatten any other element (bold, foreign spans/divs, images, …) to its own children.
		const parent = el.parentNode;
		if (!parent) continue;
		while (el.firstChild) parent.insertBefore(el.firstChild, el);
		parent.removeChild(el);
	}
}

/** Keeps only text and `<mark class="hl-color">` from a contentEditable's innerHTML, flattening everything else. */
export function sanitizeHtml(html: string): string {
	const container = document.createElement("div");
	container.innerHTML = html;
	sanitizeChildren(container);
	return container.innerHTML;
}

function unwrapMarks(fragment: DocumentFragment): void {
	for (const mark of Array.from(fragment.querySelectorAll("mark"))) {
		const parent = mark.parentNode;
		if (!parent) continue;
		while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
		parent.removeChild(mark);
	}
}

/**
 * Extracting a selection that exactly fills an existing `<mark>` leaves that mark behind,
 * now empty. Climb out of it (and any now-empty text node) so the new content lands
 * beside it rather than nested inside it. Never climbs past a `<mark>` — the editor root
 * itself is left alone even if extraction emptied it out entirely.
 */
function collapseEmptyMarkAncestors(range: Range): void {
	let node: Node | null = range.startContainer;
	while (node) {
		const parent: Node | null = node.parentNode;
		if (!parent) break;

		const isEmptyText = node.nodeType === Node.TEXT_NODE && (node as Text).length === 0;
		const isEmptyMark =
			node.nodeType === Node.ELEMENT_NODE &&
			(node as Element).tagName === "MARK" &&
			!node.hasChildNodes();
		if (!isEmptyText && !isEmptyMark) break;

		const index = Array.prototype.indexOf.call(parent.childNodes, node);
		parent.removeChild(node);
		range.setStart(parent, index);
		range.setEnd(parent, index);
		node = parent;
	}
}

/**
 * Applies (or, with `className: null`, clears) a highlight over `range`, replacing any
 * highlight already inside the selection so overlapping marks resolve to one color.
 */
export function applyHighlight(range: Range, className: string | null): void {
	if (range.collapsed) return;

	const fragment = range.extractContents();
	unwrapMarks(fragment);
	collapseEmptyMarkAncestors(range);

	if (className) {
		const mark = document.createElement("mark");
		mark.className = className;
		mark.appendChild(fragment);
		range.insertNode(mark);
	} else {
		range.insertNode(fragment);
	}
}

/** The current selection's range, if it's a non-empty selection inside `container`. */
export function getSelectionRangeWithin(container: HTMLElement): Range | null {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
	const range = selection.getRangeAt(0);
	if (!container.contains(range.commonAncestorContainer)) return null;
	return range;
}

/** Inserts plain text at the current selection, replacing it (used for Enter and paste). */
export function insertPlainText(text: string): void {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;
	const range = selection.getRangeAt(0);
	range.deleteContents();
	const node = document.createTextNode(text);
	range.insertNode(node);
	range.setStartAfter(node);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}
