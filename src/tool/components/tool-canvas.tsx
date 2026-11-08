"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatSvg, validateSvgSyntax } from "../svg-formatter";
import { DEFAULT_SVG } from "../constants";
import { copyToClipboard } from "@/lib/clipboard";

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
/** Minimum and maximum zoom scale for the preview canvas. */
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 20;

/** Clamp a zoom scale to the supported range. */
export function clampZoom(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale));
}

/**
 * Script injected into the preview iframe document. Implements interactive
 * mouse-wheel zoom, click-and-drag panning, and viewBox auto-fit so complex
 * SVGs can be inspected on small viewports. Reports zoom changes to the host
 * page via postMessage and listens for zoom control commands.
 */
const PREVIEW_INTERACT_SCRIPT = `
(function () {
  var svg = document.querySelector('svg');
  if (!svg) return;
  svg.style.cursor = 'grab';
  svg.style.userSelect = 'none';
  svg.style.pointerEvents = 'none';

  var baseW = 0, baseH = 0, scale = 1, tx = 0, ty = 0;

  function contentBounds() {
    try {
      var vb = svg.viewBox && svg.viewBox.baseVal;
      if (vb && vb.width > 0 && vb.height > 0) {
        return { w: vb.width, h: vb.height };
      }
      var b = svg.getBBox();
      if (b.width > 0 && b.height > 0) return { w: b.width, h: b.height };
    } catch (e) {}
    return { w: svg.clientWidth || 100, h: svg.clientHeight || 100 };
  }

  function fit() {
    var b = contentBounds();
    var fs = Math.min(window.innerWidth / b.w, window.innerHeight / b.h);
    baseW = b.w * fs;
    baseH = b.h * fs;
    scale = 1; tx = 0; ty = 0;
    apply();
  }

  function apply() {
    svg.style.width = baseW * scale + 'px';
    svg.style.height = baseH * scale + 'px';
    svg.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
    svg.style.transformOrigin = '0 0';
    try {
      parent.postMessage({ type: 'svg-zoom-report', zoom: scale }, '*');
    } catch (e) {}
  }

  function zoomTo(factor, cx, cy) {
    var next = Math.min(20, Math.max(0.1, scale * factor));
    if (next === scale) return;
    var k = next / scale;
    if (typeof cx === 'number') {
      tx = (cx - (cx - tx) * k);
      ty = (cy - (cy - ty) * k);
    }
    scale = next;
    apply();
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type !== 'svg-zoom-cmd') return;
    if (d.action === 'in') zoomTo(1.2);
    else if (d.action === 'out') zoomTo(1 / 1.2);
    else if (d.action === 'fit') fit();
  });

  window.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomTo(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY);
  }, { passive: false });

  var panning = false, px = 0, py = 0;
  window.addEventListener('pointerdown', function (e) {
    panning = true; px = e.clientX; py = e.clientY;
    document.body.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', function (e) {
    if (!panning) return;
    tx += e.clientX - px;
    ty += e.clientY - py;
    px = e.clientX; py = e.clientY;
    apply();
  });
  window.addEventListener('pointerup', function () {
    panning = false;
    document.body.style.cursor = '';
  });

  window.addEventListener('resize', function () { fit(); });

  if (document.readyState === 'complete') fit();
  else window.addEventListener('load', fit);
})();
`;

function buildPreviewHtml(svg: string, bgColor: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:${bgColor};overflow:hidden;">
${svg}
<script>${PREVIEW_INTERACT_SCRIPT}<${"/script>"}
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
  const [zoomPercent, setZoomPercent] = useState(100);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Send a zoom command to the interactive preview iframe. */
  const sendZoomCommand = useCallback((action: "in" | "out" | "fit") => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "svg-zoom-cmd", action },
      "*",
    );
  }, []);

  /**
   * Receive zoom reports from the preview iframe so the control UI can show
   * the current zoom percentage. Rebuilding `previewHtml` remounts the iframe
   * and re-runs auto-fit, which reports a zoom of 100%.
   */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; zoom?: unknown } | null;
      if (data?.type !== "svg-zoom-report") return;
      const zoom = typeof data.zoom === "number" ? data.zoom : NaN;
      setZoomPercent(Math.round(clampZoom(zoom) * 100));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const [previewHtml, setPreviewHtml] = useState(() =>
    buildPreviewHtml(svg, "#f8fafc"),
  );

  /** Clear error when SVG changes */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSvgError(null);
      onChange?.(e.target.value);
    },
    [onChange],
  );

  /**
   * Handle Tab key in the code editor to insert spaces instead of
   * losing focus. Uses a ref to check the active textarea element
   * and modify its selection range directly.
   */
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;
      e.preventDefault();

      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      const value = textarea.value;

      if (!e.shiftKey) {
        // Insert 2-space indent at cursor
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const newValue = before + "  " + after;
        onChange?.(newValue);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        });
      } else {
        // Shift+Tab: remove up to 2 spaces at the start of the current line
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const spacesBefore = value.slice(lineStart, selectionStart);
        const indent = spacesBefore.match(/^ {1,2}/);
        const removeCount = indent ? indent[0].length : 0;
        if (removeCount > 0) {
          const before =
            value.slice(0, lineStart) +
            value.slice(lineStart + removeCount, selectionStart);
          const after = value.slice(selectionEnd);
          const newValue = before + after;
          onChange?.(newValue);
          requestAnimationFrame(() => {
            const newPos = Math.max(lineStart, selectionStart - removeCount);
            textarea.selectionStart = textarea.selectionEnd = newPos;
          });
        }
      }
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
    [svg, setPreviewHtml],
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
    const ok = await copyToClipboard(svg);
    if (!ok) {
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
          ref={textareaRef}
          className="svg-editor-textarea"
          value={svg}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
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
          <div
            className="svg-editor-toolbar-actions svg-editor-zoom-controls"
            role="group"
            aria-label="Preview zoom controls"
          >
            <span className="svg-editor-zoom-label" aria-live="polite">
              {zoomPercent}%
            </span>
            <button
              type="button"
              className="svg-editor-mini-btn"
              onClick={() => sendZoomCommand("out")}
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="svg-editor-mini-btn"
              onClick={() => sendZoomCommand("in")}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="svg-editor-mini-btn"
              onClick={() => sendZoomCommand("fit")}
              title="Fit to screen / reset zoom (auto-fits the viewBox)"
              aria-label="Fit to screen and reset zoom"
            >
              Fit
            </button>
          </div>
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
