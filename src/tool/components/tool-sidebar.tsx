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
 * Counts unique fill and stroke colors used in the SVG.
 */
function countColors(svg: string): {
  fills: Set<string>;
  strokes: Set<string>;
} {
  const fills = new Set<string>();
  const strokes = new Set<string>();
  const fillRegex = /fill=["']([^"']+)["']/g;
  const strokeRegex = /stroke=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = fillRegex.exec(svg)) !== null) {
    fills.add(match[1]!);
  }
  while ((match = strokeRegex.exec(svg)) !== null) {
    strokes.add(match[1]!);
  }
  return { fills, strokes };
}

/**
 * Sidebar panel displaying SVG metadata: viewBox dimensions, element counts,
 * unique color palette for fills and strokes. Handles empty SVGs gracefully
 * by showing zeroed-out stats.
 */
export function ToolSidebar({ svg }: ToolSidebarProps) {
  const viewBox = useMemo(() => parseViewBox(svg), [svg]);
  const elements = useMemo(() => (svg.trim() ? countElements(svg) : {}), [svg]);
  const { fills, strokes } = useMemo(
    () => (svg.trim() ? countColors(svg) : { fills: new Set<string>(), strokes: new Set<string>() }),
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
          <dl className="stats-list">
            {fills.size > 0 && (
              <div className="sidebar-colors">
                <dt>Fills</dt>
                {[...fills].slice(0, 8).map((color) => (
                  <div className="color-swatch-row" key={color}>
                    <span
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="color-swatch-label">{color}</span>
                  </div>
                ))}
                {fills.size > 8 && (
                  <dd className="color-more">+{fills.size - 8} more</dd>
                )}
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
