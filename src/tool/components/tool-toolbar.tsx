"use client";

import Link from "next/link";

interface ToolToolbarProps {
  onInsertShape?: (shape: string) => void;
}

/**
 * Toolbar for the SVG Editor — provides shape insertion buttons and a help link.
 * All shape buttons are only rendered when onInsertShape is provided.
 */
export function ToolToolbar({ onInsertShape }: ToolToolbarProps = {}) {
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
            title="Insert rectangle"
            aria-label="Insert rectangle"
          >
            Rect
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("circle")}
            title="Insert circle"
            aria-label="Insert circle"
          >
            Circle
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("ellipse")}
            title="Insert ellipse"
            aria-label="Insert ellipse"
          >
            Ellipse
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("path")}
            title="Insert path"
            aria-label="Insert path"
          >
            Path
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("text")}
            title="Insert text"
            aria-label="Insert text"
          >
            Text
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onInsertShape("line")}
            title="Insert line"
            aria-label="Insert line"
          >
            Line
          </button>
        </>
      )}

      <div className="toolbar-separator" />

      <Link
        href="/help"
        className="toolbar-btn toolbar-help-link"
        aria-label="Open help page"
      >
        Help
      </Link>
    </div>
  );
}
