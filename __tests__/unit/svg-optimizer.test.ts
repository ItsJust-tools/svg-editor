import { describe, it, expect, beforeEach, vi } from "vitest";
import { optimizeSvg } from "@/tool/svg-optimizer";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import path from "node:path";

// The optimizer uses DOMParser/XMLSerializer (browser APIs). In the vitest
// node environment these are unavailable, so we install them from jsdom.
if (typeof globalThis.DOMParser === "undefined") {
  const dom = new JSDOM("");
  (globalThis as Record<string, unknown>).DOMParser = dom.window.DOMParser;
  (globalThis as Record<string, unknown>).XMLSerializer =
    dom.window.XMLSerializer;
  // jsdom lacks TreeWalker usage guard, but createTreeWalker exists.
}

describe("optimizeSvg", () => {
  it("returns input unchanged for already-clean SVG (no removals)", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.removedCount).toBe(0);
    expect(result.removedTypes).toEqual([]);
    expect(result.svg).toContain("<rect");
  });

  it("removes XML comments", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><!-- designer comment --><rect width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).not.toContain("<!--");
    expect(result.svg).not.toContain("designer comment");
  });

  it("removes <metadata> blocks", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><metadata><rdf:RDF /></metadata><rect width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).not.toContain("<metadata");
    expect(result.svg).toContain("<rect");
  });

  it("removes empty groups but keeps groups with content", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><g></g><g><rect width="10" height="10"/></g></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).toContain("<rect");
    expect(result.svg).toContain("<g>");
    // exactly one <g> remains (the one with content)
    expect(result.svg.match(/<g[ >]/g)?.length).toBe(1);
  });

  it("removes editor-only attributes (inkscape, sodipodi, sketch, data-name)", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:sketch="https://www.sketch.com/sketch/svg"><rect inkscape:label="box" sodipodi:cx="5" sketch:id="x" data-name="Box" width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).not.toContain("inkscape:label");
    expect(result.svg).not.toContain("sodipodi:cx");
    expect(result.svg).not.toContain("sketch:id");
    expect(result.svg).not.toContain("data-name");
    expect(result.svg).toContain("<rect");
  });

  it("removes unused ids but keeps referenced ones", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad"><stop offset="0" stop-color="red"/></linearGradient></defs><rect id="used-rect" fill="url(#grad)" width="10" height="10"/><use href="#used-rect"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).toContain('id="grad"');
    expect(result.svg).toContain('id="used-rect"');
  });

  it("strips unreferenced ids not used by url() or href", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect id="random-shape-1" width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).not.toContain('id="random-shape-1"');
    expect(result.svg).toContain("<rect");
  });

  it("keeps ids referenced by href anchors", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><text id="label">A</text><use href="#label"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).toContain('id="label"');
  });

  it("keeps ids referenced by aria-labelledby", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" aria-labelledby="t1"><title id="t1">Icon</title><rect width="10" height="10"/></svg>`;
    const result = optimizeSvg(svg);
    expect(result.svg).toContain('id="t1"');
  });

  it("returns input unchanged for unparseable garbage", () => {
    const garbage = "this is not svg at all <<<>>>";
    const result = optimizeSvg(garbage);
    expect(result.svg).toBe(garbage);
    expect(result.removedCount).toBe(0);
  });

  it("reports a breakdown in removedTypes when changes occur", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="ns"><!-- c --><metadata><x/></metadata><g></g></svg>`;
    const result = optimizeSvg(svg);
    expect(result.removedCount).toBeGreaterThan(0);
    expect(result.removedTypes.length).toBeGreaterThan(0);
  });

  it("optimizes a messy Figma-style SVG end-to-end", () => {
    const fixturePath = path.join(__dirname, "fixtures", "figma-export.svg");
    const raw = readFileSync(fixturePath, "utf8");
    const result = optimizeSvg(raw);
    expect(result.removedCount).toBeGreaterThan(0);
    expect(result.svg).not.toContain("<!--");
    expect(result.svg).not.toContain("<metadata");
    expect(result.svg).not.toContain("data-name");
    // referenced gradient id must survive
    expect(result.svg).toContain('id="f-grad"');
    // unreferenced ids are removed
    expect(result.svg).not.toContain('id="Unused-Shape"');
    // visible content survives
    expect(result.svg).toContain("<rect");
  });
});
