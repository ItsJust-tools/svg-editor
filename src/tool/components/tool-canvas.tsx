"use client";

import { useCallback, useMemo, useState } from "react";

interface ToolCanvasProps {
  svg: string;
  readOnly?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (svg: string) => void;
}

/**
 * Main SVG editor canvas with a code editor tab and a live preview tab.
 * Provides copy/download buttons for the SVG source and renders the
 * preview inside a sandboxed iframe.
 */
export function ToolCanvas({
  svg,
  readOnly = false,
  canvasRef,
  onChange,
}: ToolCanvasProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [svgError, setSvgError] = useState<string | null>(null);

  /** Clear error when SVG changes */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSvgError(null);
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const previewHtml = useMemo(() => {
    // Wrap SVG in an HTML document for the iframe preview
    // Use the system background color so dark mode is respected
    return `<!DOCTYPE html>
<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
${svg}
</body></html>`;
  }, [svg]);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(svg);
    } catch {
      // Fallback silently
    }
  }, [svg]);

  const handleDownloadSvg = useCallback(() => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  const handleIframeError = useCallback(() => {
    setSvgError("Failed to render SVG preview. Check your SVG syntax.");
  }, []);

  return (
    <div
      ref={canvasRef}
      className="svg-editor-canvas"
      role="application"
      aria-label="SVG Editor canvas"
    >
      {/* Tab switcher */}
      <div className="svg-editor-tabs" role="tablist" aria-label="Editor tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "editor"}
          aria-controls="svg-editor-pane"
          className={`svg-editor-tab ${activeTab === "editor" ? "svg-editor-tab-active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          Code Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          aria-controls="svg-preview-pane"
          className={`svg-editor-tab ${activeTab === "preview" ? "svg-editor-tab-active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </button>
      </div>

      {/* Code editor pane */}
      <div
        id="svg-editor-pane"
        role="tabpanel"
        hidden={activeTab !== "editor"}
        className="svg-editor-pane"
      >
        <div className="svg-editor-toolbar-mini">
          <span className="svg-editor-toolbar-label">SVG Code</span>
          <div className="svg-editor-toolbar-actions">
            <button
              type="button"
              className="svg-editor-mini-btn"
              onClick={handleCopySvg}
              title="Copy SVG code"
              aria-label="Copy SVG code"
            >
              Copy
            </button>
            <button
              type="button"
              className="svg-editor-mini-btn"
              onClick={handleDownloadSvg}
              title="Download SVG file"
              aria-label="Download SVG file"
            >
              Download
            </button>
          </div>
        </div>
        <textarea
          className="svg-editor-textarea"
          value={svg}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
          aria-label="SVG code editor"
          spellCheck={false}
          wrap="off"
        />
      </div>

      {/* Preview pane */}
      <div
        id="svg-preview-pane"
        role="tabpanel"
        hidden={activeTab !== "preview"}
        className="svg-editor-pane svg-editor-preview-pane"
      >
        <div className="svg-editor-toolbar-mini">
          <span className="svg-editor-toolbar-label">Live Preview</span>
          {svgError && (
            <span className="svg-editor-preview-error">{svgError}</span>
          )}
        </div>
        <div className="svg-editor-preview-container">
          {svg ? (
            <iframe
              className="svg-editor-preview-iframe"
              srcDoc={previewHtml}
              title="SVG preview"
              sandbox="allow-scripts allow-same-origin"
              onError={handleIframeError}
            />
          ) : (
            <div className="svg-editor-preview-empty">
              Enter SVG code to see a preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
