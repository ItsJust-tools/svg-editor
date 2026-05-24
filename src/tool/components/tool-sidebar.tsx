"use client";

interface ToolSidebarProps {
  svgContent: string;
  fontSize?: number;
  onFontSizeChange?: (delta: number) => void;
}

export function ToolSidebar({
  svgContent,
  fontSize,
  onFontSizeChange,
}: ToolSidebarProps) {
  const elements = (svgContent.match(/<\w+/g) || []).length;
  const chars = svgContent.length;
  const lines = svgContent.split("\n").length;

  return (
    <div className="notepad-sidebar">
      <div className="sidebar-section">
        <h3>SVG Stats</h3>
        <dl className="stats-list">
          <div className="stat-row">
            <dt>Elements</dt>
            <dd>{elements.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Characters</dt>
            <dd>{chars.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Lines</dt>
            <dd>{lines.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {fontSize !== undefined && onFontSizeChange && (
        <div className="sidebar-section">
          <h3>Font Size</h3>
          <div className="sidebar-font-controls">
            <button
              type="button"
              className="font-btn"
              onClick={() => onFontSizeChange(-2)}
              aria-label="Decrease font size"
              title="Decrease font size"
            >
              A−
            </button>
            <span className="font-size-display" aria-live="polite">
              {fontSize}px
            </span>
            <button
              type="button"
              className="font-btn"
              onClick={() => onFontSizeChange(2)}
              aria-label="Increase font size"
              title="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
