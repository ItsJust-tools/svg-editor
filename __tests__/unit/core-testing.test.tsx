import { describe, it, expect, beforeAll } from "vitest";
import { renderTool, createMockToolState } from "@itsjust/core/testing";
import { testConfig } from "@itsjust/core/testing";

describe("core testing helpers", () => {
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

  it("testConfig exposes a json-only test tool configuration", () => {
    expect(testConfig.id).toBe("test-tool");
    expect(testConfig.exportFormats).toEqual(["json"]);
  });

  it("renders UI inside mock providers via renderTool", () => {
    const { getByRole } = renderTool(<button type="button">click-me</button>);
    expect(getByRole("button").textContent).toBe("click-me");
  });

  it("createMockToolState applies plain and updater values", async () => {
    type S = { value: string };
    const state = createMockToolState<S>({ value: "a" });
    expect(state.data.value).toBe("a");
    state.setData({ value: "b" });
    expect(state.data.value).toBe("b");
    state.setData((prev) => ({ value: `${prev.value}!` }));
    expect(state.data.value).toBe("b!");
    expect(state.canUndo).toBe(true);
    state.undo();
    expect(state.data.value).toBe("b");
    state.redo();
    expect(state.data.value).toBe("b!");
    state.clearHistory();
    expect(state.canUndo).toBe(false);
    await expect(state.saveNow()).resolves.toBeUndefined();
  });
});
