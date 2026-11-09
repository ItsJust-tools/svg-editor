/**
 * Client-side SVG optimizer ("SVGO-lite").
 *
 * Strips redundant content from SVG markup entirely in the browser — no
 * network requests, no dependencies:
 * - Metadata blocks (<metadata>) and editor namespaces (inkscape:, sodipodi:, sketch:)
 * - XML comments
 * - Empty container elements (<g>, <defs>, etc. with no meaningful children)
 * - Unused ids (ids not referenced by url(#...), href="#...", or aria attributes)
 * - Editor-only attributes (data-name, inkscape:*, sodipodi:*, sketch:*,
 *   editor xmlns:* declarations)
 *
 * Implemented on top of the browser DOMParser so parsing is robust even for
 * messy design-tool output (Figma, Illustrator, Inkscape, Sketch).
 */

/** Namespace declarations that only exist to support editor metadata. */
const EDITOR_NS_ATTRS = new Set<string>([
  "xmlns:inkscape",
  "xmlns:sodipodi",
  "xmlns:sketch",
  "xmlns:dc",
  "xmlns:cc",
  "xmlns:rdf",
  "xmlns:serif",
  "xmlns:i",
  "xmlns:flow",
  "xmlns:flow-root",
  "xmlns:v",
]);

/** Elements that may be removed entirely when they have no meaningful children. */
const EMPTY_REMOVABLE_TAGS = new Set([
  "g",
  "defs",
  "metadata",
  "title",
  "desc",
  "symbol",
  "marker",
  "pattern",
  "clipPath",
  "mask",
]);

export interface SvgOptimizeResult {
  /** The optimized SVG string. */
  svg: string;
  /** Number of individual cleanups applied. */
  removedCount: number;
  /** Human-readable breakdown of what was removed. */
  removedTypes: string[];
}

/** Returns true when an attribute name is editor-only. */
function isEditorAttr(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.startsWith("inkscape:") ||
    lower.startsWith("sodipodi:") ||
    lower.startsWith("sketch:") ||
    lower === "data-name" ||
    EDITOR_NS_ATTRS.has(lower)
  );
}

/** Returns true when the element contains meaningful content. */
function hasMeaningfulContent(el: Element): boolean {
  return (el.textContent?.trim().length ?? 0) > 0 || el.children.length > 0;
}

/**
 * Collect all ids referenced from attribute values anywhere in the document
 * (url(#id), href="#id", xlink:href="#id", aria-labelledby/describedby lists,
 * and SMIL begin/end animation references).
 */
function collectReferencedIds(doc: Document): Set<string> {
  const refs = new Set<string>();
  const root = doc.documentElement;
  if (!root) return refs;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode as Element | null;
  while (current) {
    for (const attr of Array.from(current.getAttributeNames())) {
      const value = current.getAttribute(attr) ?? "";
      // url(#id) references (fill="url(#grad)", clip-path, filter, mask, ...)
      for (const m of value.matchAll(/url\(["']?#([^)"'\s]+)["']?\)/g)) {
        refs.add(m[1]!);
      }
      // href / xlink:href fragment references
      if (/^#/.test(value.trim())) {
        const id = value.trim().slice(1);
        if (id) refs.add(id);
      }
      // ID lists (aria-labelledby="a b c")
      if (/^aria-(labelledby|describedby)$/i.test(attr)) {
        for (const token of value.split(/\s+/)) {
          if (token) refs.add(token);
        }
      }
      // SMIL animation begin/end references (begin="anim1.end")
      if (/^(begin|end)$/i.test(attr) && value.includes("id=")) {
        for (const m of value.matchAll(/id=([^\s;]+)/g)) refs.add(m[1]!);
      }
    }
    current = walker.nextNode() as Element | null;
  }
  return refs;
}

/** Recursively strip comments from a node; counts how many were removed. */
function stripComments(node: Node, count: { value: number }): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      count.value++;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      stripComments(child, count);
    }
  }
}

/** Recursively remove editor-only attributes from elements; counts removals. */
function stripEditorAttributes(node: Node, count: { value: number }): void {
  // Invoked with the Document node, which is not an element itself —
  // recurse into children rather than returning early.
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    for (const name of Array.from(el.getAttributeNames())) {
      if (isEditorAttr(name)) {
        el.removeAttribute(name);
        count.value++;
      }
    }
  }
  for (const child of Array.from(node.childNodes)) {
    stripEditorAttributes(child, count);
  }
}

/**
 * Recursively remove <metadata> elements and removable containers that ended
 * up empty. Elements bearing ids are kept (they may be referenced).
 */
function stripUnwantedElements(node: Node, count: { value: number }): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.replace(/^.*:/, "");

    if (tag === "metadata") {
      el.remove();
      count.value++;
      continue;
    }

    // Recurse first so nested empties are evaluated bottom-up.
    stripUnwantedElements(el, count);

    if (
      EMPTY_REMOVABLE_TAGS.has(tag) &&
      el.parentElement &&
      !el.getAttribute("id") &&
      !hasMeaningfulContent(el)
    ) {
      el.remove();
      count.value++;
    }
  }
}

/** Remove id attributes that are not referenced anywhere; counts removals. */
function stripUnusedIds(
  doc: Document,
  referenced: Set<string>,
  count: { value: number },
): void {
  for (const el of Array.from(doc.querySelectorAll("[id]"))) {
    const id = el.getAttribute("id");
    if (id && !referenced.has(id)) {
      el.removeAttribute("id");
      count.value++;
    }
  }
}

/**
 * Optimize an SVG string: remove metadata, comments, empty groups, editor
 * attributes, and unused ids. Falls back to the original string (no changes)
 * when the markup cannot be parsed as SVG.
 *
 * @param svg - Raw SVG markup.
 * @returns Optimized SVG plus a report of what was removed.
 */
export function optimizeSvg(svg: string): SvgOptimizeResult {
  const removedTypes: string[] = [];
  const bump = (label: string, n: number) => {
    if (n > 0) removedTypes.push(`${label} (${n})`);
  };

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) {
      return { svg, removedCount: 0, removedTypes: [] };
    }
  } catch {
    return { svg, removedCount: 0, removedTypes: [] };
  }

  if (
    !doc.documentElement ||
    doc.documentElement.tagName.toLowerCase() !== "svg"
  ) {
    return { svg, removedCount: 0, removedTypes: [] };
  }

  const commentsRemoved = { value: 0 };
  stripComments(doc, commentsRemoved);
  bump("comments", commentsRemoved.value);

  const metaCount = doc.querySelectorAll("metadata").length;
  const elementsRemoved = { value: 0 };
  stripUnwantedElements(doc, elementsRemoved);
  bump("metadata/empty groups", elementsRemoved.value);

  const attrsRemoved = { value: 0 };
  stripEditorAttributes(doc, attrsRemoved);
  bump("editor attributes", attrsRemoved.value);

  const referenced = collectReferencedIds(doc);
  const idsRemoved = { value: 0 };
  stripUnusedIds(doc, referenced, idsRemoved);
  bump("unused ids", idsRemoved.value);

  // The root <svg> element itself must always survive optimization.
  if (!doc.documentElement) {
    return { svg, removedCount: 0, removedTypes: [] };
  }

  const optimized = new XMLSerializer().serializeToString(doc);
  const removedCount =
    commentsRemoved.value +
    elementsRemoved.value +
    attrsRemoved.value +
    idsRemoved.value;
  return { svg: optimized, removedCount, removedTypes };
}
