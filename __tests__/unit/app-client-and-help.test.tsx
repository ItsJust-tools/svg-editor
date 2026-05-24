import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import ToolClient from "@/app/tool-client";
import ToolClientWrapper from "@/app/tool-client-wrapper";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => (
    <div data-testid="dynamic-tool-client">dynamic-tool-client</div>
  ),
}));

const mockSetData = vi.fn();
const mockToast = vi.fn();
const mockHandleExport = vi.fn();
const mockImport = vi.fn();
const mockToolbarActions = {
  canUndo: true,
  canRedo: true,
  onUndo: vi.fn(),
  onRedo: vi.fn(),
};

vi.mock("@itsjust/core", () => ({
  ToolShell: ({
    toolbar,
    sidebar,
    canvas,
    statusBar,
  }: Record<string, unknown>) => (
    <div>
      <div>{toolbar as ReactNode}</div>
      <div>{sidebar as ReactNode}</div>
      <div>{canvas as ReactNode}</div>
      <div>{statusBar as ReactNode}</div>
    </div>
  ),
  ImportExport: ({ onShare }: { onShare?: () => void }) => (
    <button type="button" onClick={onShare}>
      trigger-share
    </button>
  ),
  useTool: () => ({
    state: {
      data: {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"></svg>',
        zoom: 1,
        viewBox: "0 0 800 600",
      },
      setData: mockSetData,
      isDirty: false,
      lastSaved: "just now",
    },
    toast: mockToast,
    supportedFormats: ["json", "svg"],
    handleExport: mockHandleExport,
    importFromFile: mockImport,
    isImporting: false,
    toolbarActions: mockToolbarActions,
  }),
}));

vi.mock("@/tool", () => ({
  toolConfig: {
    id: "svg-editor",
    name: "SVG Editor",
    version: "1.0.0",
    features: { sidebar: true },
    theme: { brand: "SVG Editor" },
  },
  templateBaseVersion: "1.4.0",
  svgEditorTool: {
    serialize: (state: unknown) => JSON.stringify(state),
    deserialize: () => ({
      success: true,
      data: {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        zoom: 1,
        viewBox: "0 0 800 600",
      },
    }),
  },
  ToolCanvas: ({ svgContent }: { svgContent: string }) => (
    <div>canvas:{svgContent?.substring(0, 40)}...</div>
  ),
  ToolToolbar: () => <div>toolbar</div>,
  ToolSidebar: ({
    svgContent,
  }: {
    svgContent: string;
  }) => <div>sidebar:{svgContent?.substring(0, 20)}...</div>,
}));

describe("app client and help page", () => {
  beforeEach(() => {
    mockSetData.mockReset();
    mockToast.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(navigator, "share", {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    window.history.replaceState(
      null,
      "",
      "http://localhost:3000/?state=e30%3D",
    );
  });

  it("renders dynamic tool client wrapper", () => {
    render(<ToolClientWrapper />);
    expect(screen.getByTestId("dynamic-tool-client")).toBeInTheDocument();
  });

  it("handles share flow in tool client", async () => {
    render(<ToolClient />);

    expect(screen.getByText("toolbar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("trigger-share"));

    expect(mockToast).toHaveBeenCalled();
  });
});
