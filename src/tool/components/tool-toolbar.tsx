"use client";

import { useCallback, useEffect } from "react";

interface ToolToolbarProps {
  onInsertShape?: (shape: string) => void;
  onOptimize?: () => void;
}

/**
 * Shape-to-key mapping for keyboard shortcut hints.
 */
const SHAPE_SHORTCUTS: Record<string, string> = {
  rect: "R",
  circle: "C",
  ellipse: "E",
  path: "P",
  text: "T",
  line: "L",
};

/**
 * Toolbar for the SVG Editor — provides shape insertion buttons and a help link.
 * All shape buttons are only rendered when `onInsertShape` is provided.
 *
 * @param props.onInsertShape - Callback invoked with the shape name when a
 *   shape button is clicked. When omitted, shape insertion buttons are hidden.
 * @param props.onOptimize - Callback invoked when the Optimize button is
 *   clicked. When omitted, the optimize button is hidden.
 */
export function ToolToolbar({ onInsertShape, onOptimize }: ToolToolbarProps) {
  // Keyboard shortcuts for shape insertion
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!onInsertShape) return;
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase() || "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      // Alt+key shortcuts
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "o" && onOptimize) {
        e.preventDefault();
        onOptimize();
        return;
      }
      for (const [shape, shortcut] of Object.entries(SHAPE_SHORTCUTS)) {
        if (key === shortcut.toLowerCase()) {
          e.preventDefault();
          onInsertShape(shape);
          return;
        }
      }
    },
    [onInsertShape, onOptimize],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="svg-editor-toolbar-items">
      <span className="toolbar-hint">SVG Code Editor</span>

      {onInsertShape && (
        <>
          <div className="toolbar-separator" />
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("rect")}
            title="Insert rectangle (Alt+R)"
            aria-label="Insert rectangle"
          >
            Rect
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("circle")}
            title="Insert circle (Alt+C)"
            aria-label="Insert circle"
          >
            Circle
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("ellipse")}
            title="Insert ellipse (Alt+E)"
            aria-label="Insert ellipse"
          >
            Ellipse
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("path")}
            title="Insert path (Alt+P)"
            aria-label="Insert path"
          >
            Path
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("text")}
            title="Insert text (Alt+T)"
            aria-label="Insert text"
          >
            Text
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("line")}
            title="Insert line (Alt+L)"
            aria-label="Insert line"
          >
            Line
          </button>
        </>
      )}

      <div className="toolbar-separator" />

      {onOptimize && (
        <button
          type="button"
          className="toolbar-btn"
          onClick={onOptimize}
          title="Optimize / Clean SVG: strip metadata, comments, empty groups and unused ids (Alt+O)"
          aria-label="Optimize and clean SVG"
        >
          Optimize
        </button>
      )}

      <div className="toolbar-separator" />

      <a
        href="/help"
        className="toolbar-btn toolbar-help-link"
        aria-label="Open help page"
      >
        Help
      </a>
    </div>
  );
}
