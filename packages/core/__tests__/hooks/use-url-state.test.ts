import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUrlState } from "../../src/hooks/use-url-state";

describe("useUrlState", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;
  const originalReplaceState = window.history.replaceState;

  const showToast = vi.fn();

  const defaultOptions = {
    toolId: "test-tool",
    serialize: () => JSON.stringify({ title: "Hello" }),
    deserialize: (data: unknown) => {
      if (typeof data === "object" && data !== null && "title" in data) {
        return {
          success: true as const,
          data: { title: String((data as Record<string, unknown>).title) },
        };
      }
      return { success: false as const, error: "Invalid data" };
    },
    onStateLoaded: vi.fn(),
    showToast,
  };

  beforeEach(() => {
    showToast.mockClear();
    window.history.replaceState = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      value: originalShare,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
    window.history.replaceState = originalReplaceState;
  });

  it("suppresses AbortError from user cancelling the share dialog", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Share canceled"), { name: "AbortError" }),
        ),
      configurable: true,
    });

    const { result } = renderHook(() => useUrlState(defaultOptions));

    let shareUrl: string | null = null;
    await act(async () => {
      shareUrl = await result.current.createShareUrl("My Tool");
    });

    // AbortError is suppressed: no error toast, share URL still returned
    expect(shareUrl).toContain("state=");
    expect(showToast).not.toHaveBeenCalledWith(
      expect.stringContaining("Abort"),
      "error",
    );
    expect(showToast).not.toHaveBeenCalledWith(expect.any(String), "error");
    expect(result.current.isSharing).toBe(false);
  });

  it("reports unexpected sharing errors to the user", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("Share failed")),
      configurable: true,
    });

    const { result } = renderHook(() => useUrlState(defaultOptions));

    let shareUrl: string | null = null;
    await act(async () => {
      shareUrl = await result.current.createShareUrl("My Tool");
    });

    expect(shareUrl).toBeNull();
    expect(showToast).toHaveBeenCalledWith("Share failed", "error");
    expect(result.current.isSharing).toBe(false);
  });

  it("falls back to clipboard when navigator.share is unavailable", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");

    const { result } = renderHook(() => useUrlState(defaultOptions));

    let shareUrl: string | null = null;
    await act(async () => {
      shareUrl = await result.current.createShareUrl("My Tool");
    });

    expect(shareUrl).toContain("state=");
    expect(writeTextSpy).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "Share URL copied to clipboard",
      "success",
    );

    writeTextSpy.mockRestore();
  });
});
