import { describe, it, expect } from "vitest";
import { createMockToolState } from "@itsjust/core/testing";
import { svgEditorTool } from "@/tool/tool-definition";
import type { SvgEditorState } from "@/tool/types";

describe("SvgEditor logic", () => {
  it("initializes with default state", () => {
    const state = createMockToolState<SvgEditorState>({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"></svg>',
      zoom: 1,
      viewBox: "0 0 800 600",
    });

    expect(state.data.svgContent).toContain("<svg");
    expect(state.data.zoom).toBe(1);
  });

  it("updates svg content", () => {
    const state = createMockToolState<SvgEditorState>({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"></svg>',
      zoom: 1,
      viewBox: "0 0 800 600",
    });

    state.setData((prev) => ({ ...prev, svgContent: '<circle cx="400" cy="300" r="100" fill="red"/>' }));
    expect(state.data.svgContent).toContain("circle");
  });

  it("supports undo/redo", () => {
    const state = createMockToolState<SvgEditorState>({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      zoom: 1,
      viewBox: "0 0 800 600",
    });

    state.setData((prev) => ({ ...prev, zoom: 2 }));
    expect(state.data.zoom).toBe(2);
    expect(state.canUndo).toBe(true);

    state.undo();
    expect(state.data.zoom).toBe(1);
    expect(state.canRedo).toBe(true);

    state.redo();
    expect(state.data.zoom).toBe(2);
  });
});

describe("SvgEditor deserialize", () => {
  it("accepts valid svg editor state object", () => {
    const result = svgEditorTool.deserialize({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      zoom: 1,
      viewBox: "0 0 800 600",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.svgContent).toContain("<svg");
    }
  });

  it("rejects null data", () => {
    const result = svgEditorTool.deserialize(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects non-object data", () => {
    const result = svgEditorTool.deserialize("string");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects object without svgContent", () => {
    const result = svgEditorTool.deserialize({ zoom: 2, viewBox: "0 0 800 600" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects object with non-string svgContent", () => {
    const result = svgEditorTool.deserialize({ svgContent: 123, zoom: 1, viewBox: "0 0 800 600" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("serializes state to JSON string", () => {
    const json = svgEditorTool.serialize({
      svgContent: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      zoom: 1,
      viewBox: "0 0 800 600",
    });
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toMatchObject({
      svgContent: expect.stringContaining("<svg"),
    });
  });
});
