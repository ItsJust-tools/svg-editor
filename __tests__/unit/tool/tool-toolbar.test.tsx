import { describe, it, expect, vi, beforeAll } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderTool } from "@itsjust/core/testing";
import { ToolToolbar } from "@/tool/components/tool-toolbar";

describe("ToolToolbar", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  });

  it("renders shape insertion buttons and calls onInsertShape", () => {
    const onInsertShape = vi.fn();
    const { getByRole } = renderTool(
      <ToolToolbar onInsertShape={onInsertShape} />,
    );
    for (const shape of [
      "rectangle",
      "circle",
      "ellipse",
      "path",
      "text",
      "line",
    ]) {
      fireEvent.click(getByRole("button", { name: `Insert ${shape}` }));
      expect(onInsertShape).toHaveBeenCalledWith(
        shape === "rectangle" ? "rect" : shape,
      );
    }
    expect(onInsertShape).toHaveBeenCalledTimes(6);
  });

  it("calls onOptimize from the Optimize button", () => {
    const onOptimize = vi.fn();
    const { getByRole } = renderTool(
      <ToolToolbar onInsertShape={vi.fn()} onOptimize={onOptimize} />,
    );
    fireEvent.click(getByRole("button", { name: "Optimize and clean SVG" }));
    expect(onOptimize).toHaveBeenCalledOnce();
  });

  it("hides shape and optimize buttons when callbacks are omitted", () => {
    const { container } = renderTool(<ToolToolbar />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelector("a.toolbar-help-link")).not.toBeNull();
  });

  it("Alt+O triggers optimize; Alt+R inserts a rect", () => {
    const onInsertShape = vi.fn();
    const onOptimize = vi.fn();
    renderTool(
      <ToolToolbar onInsertShape={onInsertShape} onOptimize={onOptimize} />,
    );
    fireEvent.keyDown(document, { key: "o", altKey: true });
    fireEvent.keyDown(document, { key: "r", altKey: true });
    expect(onOptimize).toHaveBeenCalledOnce();
    expect(onInsertShape).toHaveBeenCalledWith("rect");
  });

  it("ignores shortcuts while typing in a textarea and ignores non-Alt keys", () => {
    const onInsertShape = vi.fn();
    renderTool(<ToolToolbar onInsertShape={onInsertShape} />);
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    fireEvent.keyDown(ta, { key: "r", altKey: true });
    fireEvent.keyDown(document, { key: "r" });
    fireEvent.keyDown(document, { key: "x", altKey: true });
    expect(onInsertShape).not.toHaveBeenCalled();
    ta.remove();
  });

  it("renders help link when present", () => {
    const { container } = renderTool(<ToolToolbar onInsertShape={vi.fn()} />);
    const link = container.querySelector("a");
    if (link) expect(link.getAttribute("href")).toBeTruthy();
  });
});
