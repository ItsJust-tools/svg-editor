"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatSvg, validateSvgSyntax } from "../svg-formatter";
import { DEFAULT_SVG } from "../constants";

interface ToolCanvasProps {
  svg: string;
  readOnly?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (svg: string) => void;
  /** Callback invoked when an error occurs (e.g. copy failure) */
  onError?: (message: string) => void;
  /** Callback to reset the SVG to the default value */
  onReset?: () => void;
}

/**
 * Resolves the effective background color for the preview iframe by reading
 * the computed `--preview-bg` CSS variable (or the element's own background).
 * Falls back to `#f8fafc` when the value cannot be determined.
 */
function getPreviewBackground(container: HTMLElement | null): string {
  if (!container) return "#f8fafc";
  const style = getComputedStyle(container);
  return style.getPropertyValue("--preview-bg").trim() || "#f8fafc";
}

/**
 * Builds an HTML document string wrapping the given SVG for display in
 * a sandboxed iframe preview pane.
 *
 * @param svg - The raw SVG markup to render.
 * @param bgColor - Background color to apply to the preview body.
 * @returns A complete HTML document string.
 */
function buildPreviewHtml(svg: string, bgColor: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:${bgColor};">
${svg}
</body></html>`;
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
  onError,
  onReset,
}: ToolCanvasProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [svgError, setSvgError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Clear error when SVG changes */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSvgError(null);
      onChange?.(e.target.value);
    },
    [onChange],
  );

  /**
   * Switch to the preview tab, validating the SVG syntax first.
   * Errors are shown inline in the preview pane header.
   */
  const handleTabChange = useCallback(
    (tab: "editor" | "preview") => {
      if (tab === "preview") {
        const syntaxError = validateSvgSyntax(svg);
        setSvgError(syntaxError);
        // Refresh preview HTML immediately so the user sees current SVG
        const bg = getPreviewBackground(previewContainerRef.current);
        setPreviewHtml(buildPreviewHtml(svg, bg));
      } else {
        setSvgError(null);
      }
      setActiveTab(tab);
    },
    [svg],
  );

  /**
   * Generates an HTML document wrapping the SVG for the iframe preview.
   * Reads the container's current effective background so dark mode and
   * high-contrast themes are accurately reflected.
   */
  const [previewHtml, setPreviewHtml] = useState(() =>
    buildPreviewHtml(svg, "#f8fafc"),
  );

  // Rebuild preview HTML only when preview is active and SVG changes,
  // using the current effective background. Avoids unnecessary work
  // when the user is editing code and hasn't switched to preview.
  useEffect(() => {
    if (activeTab !== "preview") return;
    const bg = getPreviewBackground(previewContainerRef.current);
    setPreviewHtml(buildPreviewHtml(svg, bg));
  }, [svg, activeTab]);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(svg);
    } catch {
      onError?.("Failed to copy SVG code to clipboard");
    }
  }, [svg, onError]);

  const handleDownloadSvg = useCallback(() => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  const handleFormatSvg = useCallback(() => {
    try {
      const formatted = formatSvg(svg);
      if (formatted !== svg) {
        onChange?.(formatted);
      }
    } catch {
      onError?.("Failed to format SVG. Check for syntax errors.");
    }
  }, [svg, onChange, onError]);

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
          onClick={() => handleTabChange("editor")}
        >
          Code Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          aria-controls="svg-preview-pane"
          className={`svg-editor-tab ${activeTab === "preview" ? "svg-editor-tab-active" : ""}`}
          onClick={() => handleTabChange("preview")}
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
              onClick={handleFormatSvg}
              title="Format/indent SVG code"
              aria-label="Format SVG code"
            >
              Format
            </button>
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
            {!readOnly && onReset && (
              <button
                type="button"
                className="svg-editor-mini-btn svg-editor-mini-btn-danger"
                onClick={onReset}
                title="Reset to default SVG"
                aria-label="Reset to default SVG"
              >
                Reset
              </button>
            )}
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
            <span className="svg-editor-preview-error" role="alert">
              {svgError}
            </span>
          )}
        </div>
        <div
          ref={previewContainerRef}
          className="svg-editor-preview-container"
          style={{ "--preview-bg": "var(--card)" } as React.CSSProperties}
        >
          {svg ? (
            <iframe
              ref={iframeRef}
              className="svg-editor-preview-iframe"
              srcDoc={previewHtml}
              title="SVG preview"
              sandbox="allow-scripts allow-same-origin"
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