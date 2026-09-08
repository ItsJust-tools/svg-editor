import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { copyToClipboard } from "@/lib/clipboard";

describe("copyToClipboard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    // jsdom does not implement execCommand; define a stub so it can be spied on.
    if (!("execCommand" in document)) {
      Object.defineProperty(document, "execCommand", {
        configurable: true,
        writable: true,
        value: () => false as boolean,
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard.writeText when available and resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const result = await copyToClipboard("hello");
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand when navigator.clipboard.writeText rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const createElement = vi.spyOn(document, "createElement");

    const result = await copyToClipboard("fallback text");
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("fallback text");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(createElement).toHaveBeenCalledWith("textarea");
    // The temporary textarea should have been cleaned up.
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("uses fallback when navigator.clipboard is undefined", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);

    const result = await copyToClipboard("no api");
    expect(result).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when both methods fail", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    vi.spyOn(document, "execCommand").mockReturnValue(false);

    const result = await copyToClipboard("all fail");
    expect(result).toBe(false);
  });
});
