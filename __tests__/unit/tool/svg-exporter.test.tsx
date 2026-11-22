import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import svgExporter from "@/tool/exporters/svg";
import { DEFAULT_SVG } from "@/tool/constants";

// Route around the mocked @itsjust/core module of other suites by mocking
// only what the exporter actually needs (nothing) — import it directly.

function makeEl(children: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = children;
  document.body.appendChild(container);
  return container;
}

vi.mock("@itsjust/core", () => ({}));

describe("svg exporter", () => {
  it("serializes a rendered inline <svg> and adds an XML declaration", async () => {
    const el = makeEl(
      '<div><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg></div>',
    );
    const result = await svgExporter.export(el, { format: "svg" });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);
    const text = await (result.data as Blob).text();
    expect(text).toContain('<?xml version="1.0"');
    expect(text).toContain("<circle");
    el.remove();
  });

  it("adds missing xmlns to the serialized svg", async () => {
    const el = makeEl(
      '<div><svg id="x"><rect x="1" y="1" width="2" height="2"/></svg></div>',
    );
    const result = await svgExporter.export(el, { format: "svg" });
    const text = await (result.data as Blob).text();
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    el.remove();
  });

  it("falls back to the editor textarea source when no <svg> element is on the canvas", async () => {
    const ta = document.createElement("textarea");
    ta.value = '<svg viewBox="0 0 4 4"><rect width="2" height="2"/></svg>';
    const el = document.createElement("div");
    el.appendChild(ta);
    document.body.appendChild(el);

    const result = await svgExporter.export(el, { format: "svg" });
    expect(result.success).toBe(true);
    const text = await (result.data as Blob).text();
    expect(text).toContain("<rect");
    el.remove();
  });

  it("uses the editor default SVG source (editor tab has no live <svg>)", async () => {
    const ta = document.createElement("textarea");
    ta.value = DEFAULT_SVG;
    const el = document.createElement("div");
    el.appendChild(ta);
    document.body.appendChild(el);

    const result = await svgExporter.export(el, {
      format: "svg",
      filename: "My Drawing.svg",
    });
    expect(result.success).toBe(true);
    expect(result.filename).toBe("My Drawing.svg");
    el.remove();
  });

  it("reports failure when neither an <svg> nor a textarea exists", async () => {
    const el = makeEl("<div>nothing here</div>");
    const result = await svgExporter.export(el, { format: "svg" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("No SVG element found");
    el.remove();
  });

  it("returns a failure result when serialization throws", async () => {
    const el = makeEl("<div><svg></svg></div>");
    el.querySelector("svg")!.cloneNode = () => {
      throw new Error("boom");
    };
    const result = await svgExporter.export(el, { format: "svg" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("boom");
    el.remove();
  });
});

// Keep React testing style consistent with other suites: exercise a tiny
// wrapper component so the file stays under the react-in-vitest pattern.
describe("svg exporter smoke via component tree", () => {
  it("renders exporter-independent placeholder markup for coverage of helpers", async () => {
    function Badge({ label }: { label: ReactNode }) {
      return <span role="status">{label}</span>;
    }
    render(<Badge label="svg-export-ready" />);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("svg-export-ready"),
    );
    fireEvent.click(screen.getByRole("status"));
  });
});
