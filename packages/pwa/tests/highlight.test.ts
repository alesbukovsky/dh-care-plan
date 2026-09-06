import { afterEach, describe, expect, test } from "vitest";
import { applyHighlight, insertPlainText, sanitizeHtml } from "../src/highlight";

function rangeOver(el: HTMLElement, start: number, end: number): Range {
	const textNode = el.firstChild as Text;
	const range = document.createRange();
	range.setStart(textNode, start);
	range.setEnd(textNode, end);
	return range;
}

describe("sanitizeHtml", () => {
	test("keeps plain text unchanged", () => {
		expect(sanitizeHtml("plain patient history")).toBe("plain patient history");
	});

	test("keeps an allowed highlight mark", () => {
		expect(sanitizeHtml('before <mark class="bg-yellow-200">note</mark> after')).toBe(
			'before <mark class="bg-yellow-200">note</mark> after',
		);
	});

	test("flattens disallowed markup to its text content", () => {
		expect(sanitizeHtml("<b>bold</b> and <div>a div</div> and <img src=x>")).toBe(
			"bold and a div and ",
		);
	});

	test("flattens a mark with an unrecognized class", () => {
		expect(sanitizeHtml('<mark class="something-else">note</mark>')).toBe("note");
	});

	test("flattens a mark carrying extra attributes", () => {
		expect(sanitizeHtml('<mark class="bg-yellow-200" style="color:red">note</mark>')).toBe(
			"note",
		);
	});
});

describe("applyHighlight", () => {
	let container: HTMLDivElement;

	afterEach(() => {
		container?.remove();
	});

	function setup(html: string): HTMLDivElement {
		container = document.createElement("div");
		container.innerHTML = html;
		document.body.append(container);
		return container;
	}

	test("wraps a plain-text selection in the given color", () => {
		const el = setup("hello world");
		applyHighlight(rangeOver(el, 0, 5), "bg-yellow-200");

		expect(el.innerHTML).toBe('<mark class="bg-yellow-200">hello</mark> world');
	});

	test("does nothing for a collapsed (empty) selection", () => {
		const el = setup("hello world");
		const range = rangeOver(el, 3, 3);
		applyHighlight(range, "bg-yellow-200");

		expect(el.innerHTML).toBe("hello world");
	});

	test("re-highlighting a highlighted span replaces its color", () => {
		const el = setup('<mark class="bg-yellow-200">hello</mark> world');
		const mark = el.firstChild as HTMLElement;
		const range = document.createRange();
		range.selectNodeContents(mark);
		applyHighlight(range, "bg-green-200");

		expect(el.innerHTML).toBe('<mark class="bg-green-200">hello</mark> world');
	});

	test("clearing (className: null) removes the mark and keeps the text", () => {
		const el = setup('<mark class="bg-yellow-200">hello</mark> world');
		const mark = el.firstChild as HTMLElement;
		const range = document.createRange();
		range.selectNodeContents(mark);
		applyHighlight(range, null);

		expect(el.innerHTML).toBe("hello world");
	});

	test("a selection spanning two different highlights resolves to one color", () => {
		const el = setup(
			'<mark class="bg-yellow-200">hello</mark> <mark class="bg-green-200">world</mark>',
		);
		const range = document.createRange();
		range.setStart(el, 0);
		range.setEnd(el, el.childNodes.length);
		applyHighlight(range, "bg-blue-200");

		expect(el.innerHTML).toBe('<mark class="bg-blue-200">hello world</mark>');
	});
});

describe("insertPlainText", () => {
	afterEach(() => {
		window.getSelection()?.removeAllRanges();
	});

	test("replaces the current selection with the given text", () => {
		const el = document.createElement("div");
		el.textContent = "hello world";
		document.body.append(el);

		const range = rangeOver(el, 0, 5);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);

		insertPlainText("goodbye");

		expect(el.textContent).toBe("goodbye world");
		el.remove();
	});
});
