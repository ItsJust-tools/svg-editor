"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, useTool, ImportExport } from "@itsjust/core";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import {
  toolConfig,
  templateBaseVersion,
  toolDefinition,
  ToolCanvas,
  ToolToolbar,
  ToolSidebar,
} from "@/tool";

export default function ToolClient() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const tool = useTool(toolDefinition, canvasRef);
  const setToolData = tool.state.setData;
  const showToast = tool.toast;
  const [isSharing, setIsSharing] = useState(false);
  const hasLoadedSharedState = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth > 768 &&
      toolConfig.features.sidebar,
  );
  const title = tool.state.data.title?.trim() || toolConfig.name;
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [editValue, setEditValue] = useState(title);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const handleSvgChange = useCallback(
    (svg: string) => {
      setToolData((prev) => ({ ...prev, svg }));
    },
    [setToolData],
  );

  const handleInsertShape = useCallback(
    (shape: string) => {
      const svg = tool.state.data.svg;
      // Find the closing tag of the root SVG element
      const svgCloseMatch = svg.lastIndexOf("</svg>");
      if (svgCloseMatch === -1) return;

      let shapeSvg = "";
      const id = `shape-${Date.now()}`;
      switch (shape) {
        case "rect":
          shapeSvg = `  <rect id="${id}" x="10" y="10" width="80" height="60" rx="4" fill="#3b82f6" />\n`;
          break;
        case "circle":
          shapeSvg = `  <circle id="${id}" cx="50" cy="50" r="40" fill="#ef4444" />\n`;
          break;
        case "ellipse":
          shapeSvg = `  <ellipse id="${id}" cx="50" cy="50" rx="60" ry="30" fill="#8b5cf6" />\n`;
          break;
        case "path":
          shapeSvg = `  <path id="${id}" d="M10 80 Q 52.5 10, 95 80 T 180 80" fill="none" stroke="#10b981" stroke-width="3" />\n`;
          break;
        case "text":
          shapeSvg = `  <text id="${id}" x="40" y="55" font-family="sans-serif" font-size="16" fill="#1f2937">Hello</text>\n`;
          break;
        case "line":
          shapeSvg = `  <line id="${id}" x1="10" y1="10" x2="90" y2="90" stroke="#f59e0b" stroke-width="3" />\n`;
          break;
        default:
          return;
      }

      const newSvg =
        svg.slice(0, svgCloseMatch) + shapeSvg + svg.slice(svgCloseMatch);
      setToolData((prev) => ({ ...prev, svg: newSvg }));
      showToast(`Inserted ${shape}`, "success");
    },
    [tool.state.data.svg, setToolData, showToast],
  );

  useEffect(() => {
    if (hasLoadedSharedState.current) return;
    hasLoadedSharedState.current = true;
    const params = new URLSearchParams(window.location.search);
    const encodedState = params.get("state");
    if (!encodedState) return;
    try {
      const serialized = decompressFromEncodedURIComponent(encodedState);
      if (!serialized) throw new Error("Invalid shared URL");
      const parsed: unknown = JSON.parse(serialized);
      const deserialized = toolDefinition.deserialize(parsed);
      if (!deserialized.success) throw new Error(deserialized.error);
      setToolData(deserialized.data);
      showToast("Loaded state from shared URL", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load shared URL";
      showToast(message, "error");
    }
  }, [setToolData, showToast]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const serialized = toolDefinition.serialize(tool.state.data);
      const encodedState = compressToEncodedURIComponent(serialized);
      if (!encodedState) throw new Error("Failed to encode state for URL");
      const url = new URL(window.location.href);
      url.searchParams.set("state", encodedState);
      url.searchParams.set("tool", toolConfig.id);
      window.history.replaceState(null, "", url.toString());

      const shareUrl = url.toString();
      if (navigator.share) {
        try {
          await navigator.share({ title, url: shareUrl });
          showToast("Shared URL ready", "success");
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast("Share URL copied to clipboard", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create share URL";
      showToast(message, "error");
    } finally {
      setIsSharing(false);
    }
  }, [showToast, tool.state.data, title]);

  const toolbarActions = useMemo(
    () => ({
      ...tool.toolbarActions,
      onBrandClick: () => {
        setEditValue(title);
        setIsEditingBrand(true);
      },
      isBrandEditing: isEditingBrand,
      brandValue: isEditingBrand ? editValue : title,
      onBrandChange: (value: string) => setEditValue(value),
      onBrandCommit: () => {
        const trimmed = editValue.trim();
        setToolData((prev) => ({ ...prev, title: trimmed || undefined }));
        setIsEditingBrand(false);
      },
      onBrandCancel: () => {
        setEditValue(title);
        setIsEditingBrand(false);
      },
    }),
    [tool.toolbarActions, isEditingBrand, editValue, title, setToolData],
  );

  const toolbarContent = (
    <>
      <ToolToolbar onInsertShape={handleInsertShape} />
      <ImportExport
        formats={tool.supportedFormats}
        onExport={tool.handleExport}
        onImport={tool.importFromFile}
        isImporting={tool.isImporting}
        onShare={handleShare}
        isSharing={isSharing}
      />
    </>
  );

  const sidebarContent = <ToolSidebar svg={tool.state.data.svg} />;

  const canvasContent = (
    <ToolCanvas
      canvasRef={canvasRef}
      svg={tool.state.data.svg}
      onChange={handleSvgChange}
    />
  );

  const statusBarContent = (
    <>
      <span
        className={`status-slot status-slot-state ${tool.state.isDirty ? "status-unsaved" : "status-saved"}`}
      >
        {tool.state.isDirty ? (
          <>
            <span className="status-saving-dot" />
            Unsaved
          </>
        ) : tool.state.lastSaved ? (
          <>Saved {tool.state.lastSaved}</>
        ) : (
          "Ready"
        )}
      </span>
      <span className="status-slot status-slot-svg-size">
        {tool.state.data.svg.length.toLocaleString()} chars
      </span>
      <span className="status-slot status-slot-tool-version">
        Tool v{toolConfig.version}
      </span>
      <span className="status-slot status-slot-template-version">
        Template v{templateBaseVersion}
      </span>
    </>
  );

  return (
    <ToolShell
      config={toolConfig}
      actions={toolbarActions}
      sidebarOpen={sidebarOpen}
      onSidebarChange={setSidebarOpen}
      toolbar={toolbarContent}
      sidebar={sidebarContent}
      canvas={canvasContent}
      statusBar={statusBarContent}
    />
  );
}
