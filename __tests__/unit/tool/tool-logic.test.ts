import { describe, it, expect } from "vitest";
import { createMockToolState } from "@itsjust/core/testing";
import { toolDefinition } from "@/tool/tool-definition";
import type { SvgEditorState } from "@/tool/types";

describe("SVG Editor logic", () => {
  it("initializes with default state containing SVG", () => {
    const state = createMockToolState<SvgEditorState>({
      svg: "",
    });

    expect("svg" in state.data).toBe(true);
    expect(typeof state.data.svg).toBe("string");
  });

  it("updates SVG content", () => {
    const state = createMockToolState<SvgEditorState>({
      svg: "<svg></svg>",
    });

    state.setData((prev) => ({ ...prev, svg: "<svg><rect /></svg>" }));
    expect(state.data.svg).toBe("<svg><rect /></svg>");
  });

  it("supports undo/redo", () => {
    const state = createMockToolState<SvgEditorState>({
      svg: "<svg><circle /></svg>",
    });

    state.setData((prev) => ({ ...prev, svg: "<svg><rect /></svg>" }));
    expect(state.data.svg).toBe("<svg><rect /></svg>");
    expect(state.canUndo).toBe(true);

    state.undo();
    expect(state.data.svg).toBe("<svg><circle /></svg>");
    expect(state.canRedo).toBe(true);

    state.redo();
    expect(state.data.svg).toBe("<svg><rect /></svg>");
  });
});

describe("SVG Editor deserialize", () => {
  it("accepts valid SVG editor state object", () => {
    const result = toolDefinition.deserialize({
      svg: "<svg><rect /></svg>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.svg).toBe("<svg><rect /></svg>");
    }
  });

  it("rejects null data", () => {
    const result = toolDefinition.deserialize(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects non-object data", () => {
    const result = toolDefinition.deserialize("string");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects object without svg", () => {
    const result = toolDefinition.deserialize({ count: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("rejects object with non-string svg", () => {
    const result = toolDefinition.deserialize({ svg: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid data");
    }
  });

  it("serializes state to JSON string", () => {
    const json = toolDefinition.serialize({
      svg: "<svg><rect /></svg>",
    });
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual({ svg: "<svg><rect /></svg>" });
  });

  it("accepts state with optional title", () => {
    const result = toolDefinition.deserialize({
      svg: "<svg></svg>",
      title: "My SVG",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.svg).toBe("<svg></svg>");
      expect(result.data.title).toBe("My SVG");
    }
  });
});
