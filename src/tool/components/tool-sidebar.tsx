'use client';

interface ToolSidebarProps {
  text: string;
  fontSize?: number;
  onFontSizeChange?: (delta: number) => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function countChars(text: string): number {
  return text.length;
}

function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

export function ToolSidebar({ text, fontSize, onFontSizeChange }: ToolSidebarProps) {
  const words = countWords(text);
  const chars = countChars(text);
  const lines = countLines(text);
  const charsNoSpaces = text.replace(/\s/g, '').length;

  return (
    <div className="notepad-sidebar">
      <div className="sidebar-section">
        <h3>Document Stats</h3>
        <dl className="stats-list">
          <div className="stat-row">
            <dt>Words</dt>
            <dd>{words.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Characters</dt>
            <dd>{chars.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Characters (no spaces)</dt>
            <dd>{charsNoSpaces.toLocaleString()}</dd>
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
