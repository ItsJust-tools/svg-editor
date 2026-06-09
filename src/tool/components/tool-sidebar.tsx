"use client";

import { useMemo } from "react";

interface ToolSidebarProps {
  svg: string;
}

/**
 * Extracts viewBox values from an SVG string, returning width/height or null.
 */
function parseViewBox(svg: string): { width: number; height: number } | null {
  const match = svg.match(/viewBox=["']([^"']+)["']/);
  if (!match) return null;
  const parts = match[1]!.split(/\s+/).map(Number);
  if (parts.length === 4 && !parts.some(isNaN)) {
    return { width: parts[2]!, height: parts[3]! };
  }
  return null;
}

/**
 * Counts element tags in the SVG to give a rough complexity metric.
 */
function countElements(svg: string): Record<string, number> {
  const counts: Record<string, number> = {};
  // Match opening tags: <tagName ...>
  const tagRegex = /<\s*([a-zA-Z][a-zA-Z0-9]*)[\s>]/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(svg)) !== null) {
    const tag = match[1]!.toLowerCase();
    // Skip structural/root elements
    if (["svg", "defs", "g", "metadata"].includes(tag)) continue;
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

/**
 * Extracts color values from an SVG `style` attribute string (e.g. "fill:red;stroke:blue").
 */
function extractColorsFromStyle(
  styleAttr: string,
): { fills: string[]; strokes: string[] } {
  const fills: string[] = [];
  const strokes: string[] = [];

  // Match fill: <color> (also handles fill: <color> !important)
  const fillMatch = styleAttr.match(/(?:^|[;])\s*fill\s*:\s*([^;!]+)/i);
  if (fillMatch) fills.push(fillMatch[1]!.trim());

  // Match stroke: <color>
  const strokeMatch = styleAttr.match(/(?:^|[;])\s*stroke\s*:\s*([^;!]+)/i);
  if (strokeMatch) strokes.push(strokeMatch[1]!.trim());

  // Match background-color or other color properties that affect appearance
  const bgMatch = styleAttr.match(
    /(?:^|[;])\s*(?:background-color|background)\s*:\s*([^;!]+)/i,
  );
  if (bgMatch) fills.push(bgMatch[1]!.trim());

  return { fills, strokes };
}

/**
 * Counts unique fill and stroke colors used in the SVG.
 * Checks both dedicated attributes (fill="...", stroke="...") and inline style attributes.
 */
function countColors(svg: string): {
  fills: Set<string>;
  strokes: Set<string>;
} {
  const fills = new Set<string>();
  const strokes = new Set<string>();

  // Check dedicated attributes
  const fillRegex = /fill=["']([^"']+)["']/g;
  const strokeRegex = /stroke=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = fillRegex.exec(svg)) !== null) {
    fills.add(match[1]!);
  }
  while ((match = strokeRegex.exec(svg)) !== null) {
    strokes.add(match[1]!);
  }

  // Also check inline style attributes for fill/stroke declarations
  const styleRegex = /style=["']([^"']+)["']/g;
  while ((match = styleRegex.exec(svg)) !== null) {
    const { fills: styleFills, strokes: styleStrokes } =
      extractColorsFromStyle(match[1]!);
    for (const c of styleFills) fills.add(c);
    for (const c of styleStrokes) strokes.add(c);
  }

  return { fills, strokes };
}

/**
 * A set of well-known SVG color names for display in color analysis.
 */
const WELL_KNOWN_COLORS = new Set([
  "currentColor",
  "inherit",
  "transparent",
  "none",
]);

/**
 * Sidebar panel displaying SVG metadata: viewBox dimensions, element counts,
 * unique color palette for fills and strokes. Handles empty SVGs gracefully
 * by showing zeroed-out stats.
 */
export function ToolSidebar({ svg }: ToolSidebarProps) {
  const viewBox = useMemo(() => parseViewBox(svg), [svg]);
  const elements = useMemo(() => (svg.trim() ? countElements(svg) : {}), [svg]);
  const { fills, strokes } = useMemo(
    () =>
      svg.trim()
        ? countColors(svg)
        : { fills: new Set<string>(), strokes: new Set<string>() },
    [svg],
  );

  const totalElements = useMemo(
    () => Object.values(elements).reduce((sum, c) => sum + c, 0),
    [elements],
  );

  const elementEntries = useMemo(
    () => Object.entries(elements).sort((a, b) => b[1] - a[1]),
    [elements],
  );

  return (
    <div className="tool-sidebar">
      <div className="sidebar-section">
        <h3>SVG Info</h3>
        <dl className="stats-list">
          <div className="stat-row">
            <dt>Code Size</dt>
            <dd>{svg.length.toLocaleString()} chars</dd>
          </div>
          <div className="stat-row">
            <dt>Elements</dt>
            <dd>{totalElements.toLocaleString()}</dd>
          </div>
          {viewBox && (
            <>
              <div className="stat-row">
                <dt>Width</dt>
                <dd>{viewBox.width.toLocaleString()}px</dd>
              </div>
              <div className="stat-row">
                <dt>Height</dt>
                <dd>{viewBox.height.toLocaleString()}px</dd>
              </div>
            </>
          )}
          <div className="stat-row">
            <dt>Colors (fill)</dt>
            <dd>{fills.size.toLocaleString()}</dd>
          </div>
          <div className="stat-row">
            <dt>Colors (stroke)</dt>
            <dd>{strokes.size.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {elementEntries.length > 0 && (
        <div className="sidebar-section">
          <h3>Element Breakdown</h3>
          <dl className="stats-list">
            {elementEntries.map(([tag, count]) => (
              <div className="stat-row" key={tag}>
                <dt>&lt;{tag}&gt;</dt>
                <dd>{count.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(fills.size > 0 || strokes.size > 0) && (
        <div className="sidebar-section">
          <h3>Colors Used</h3>
          <div className="sidebar-colors-list">
            {fills.size > 0 && (
              <div className="sidebar-color-group">
                <span className="sidebar-color-label">Fills</span>
                <div className="sidebar-colors-grid">
                  {[...fills].slice(0, 12).map((color) => (
                    <span
                      key={`fill-${color}`}
                      className="color-swatch-item"
                      title={color}
                    >
                      <span
                        className={`color-swatch ${WELL_KNOWN_COLORS.has(color) ? "color-swatch-semantic" : ""}`}
                        style={{
                          backgroundColor: WELL_KNOWN_COLORS.has(color)
                            ? "transparent"
                            : color,
                        }}
                      />
                      <span className="color-swatch-label">{color}</span>
                    </span>
                  ))}
                  {fills.size > 12 && (
                    <span className="color-more">+{fills.size - 12} more</span>
                  )}
                </div>
              </div>
            )}
            {strokes.size > 0 && (
              <div className="sidebar-color-group">
                <span className="sidebar-color-label">Strokes</span>
                <div className="sidebar-colors-grid">
                  {[...strokes].slice(0, 12).map((color) => (
                    <span
                      key={`stroke-${color}`}
                      className="color-swatch-item"
                      title={color}
                    >
                      <span
                        className={`color-swatch ${WELL_KNOWN_COLORS.has(color) ? "color-swatch-semantic" : ""}`}
                        style={{
                          backgroundColor: WELL_KNOWN_COLORS.has(color)
                            ? "transparent"
                            : color,
                        }}
                      />
                      <span className="color-swatch-label">{color}</span>
                    </span>
                  ))}
                  {strokes.size > 12 && (
                    <span className="color-more">+{strokes.size - 12} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}