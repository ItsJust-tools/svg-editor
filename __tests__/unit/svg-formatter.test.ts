import { describe, it, expect } from "vitest";
import { formatSvg, validateSvgSyntax } from "@/tool/svg-formatter";

describe("formatSvg", () => {
  it("formats a simple SVG with proper indentation", () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="red"/></svg>`;
    const result = formatSvg(input);
    expect(result).toBe(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <rect x="10" y="10" width="80" height="80" fill="red"/>\n</svg>`,
    );
  });

  it("formats deeply nested SVG elements", () => {
    const input = "<svg><g><rect /><circle /></g></svg>";
    const result = formatSvg(input);
    expect(result).toBe(
      "<svg>\n  <g>\n    <rect />\n    <circle />\n  </g>\n</svg>",
    );
  });

  it("handles self-closing tags without increasing indent", () => {
    const input =
      '<svg><rect x="0" y="0" width="10" height="10"/><circle cx="5" cy="5" r="3"/></svg>';
    const result = formatSvg(input);
    expect(result).toBe(
      '<svg>\n  <rect x="0" y="0" width="10" height="10"/>\n  <circle cx="5" cy="5" r="3"/>\n</svg>',
    );
  });

  it("preserves text content between tags", () => {
    const input = "<svg><text>Hello World</text></svg>";
    const result = formatSvg(input);
    expect(result).toBe("<svg>\n  <text>\nHello World\n  </text>\n</svg>");
  });

  it("handles comments", () => {
    const input = "<svg><!-- this is a comment --><rect/></svg>";
    const result = formatSvg(input);
    expect(result).toBe(
      "<svg>\n  <!-- this is a comment -->\n  <rect/>\n</svg>",
    );
  });

  it("handles XML declarations", () => {
    const input =
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const result = formatSvg(input);
    expect(result).toBe(
      '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">\n  <rect/>\n</svg>',
    );
  });

  it("uses custom indent size", () => {
    const input = "<svg><g><rect/></g></svg>";
    const result = formatSvg(input, 4);
    expect(result).toBe("<svg>\n    <g>\n        <rect/>\n    </g>\n</svg>");
  });

  it("handles malformed input (missing closing >) gracefully", () => {
    const input = "<svg><rect";
    const result = formatSvg(input);
    // Should not throw — dumps rest as-is
    expect(result).toContain("<svg>");
    expect(result).toContain("<rect");
  });

  it("handles empty string", () => {
    expect(formatSvg("")).toBe("");
  });

  it("handles tags with attributes containing > inside strings", () => {
    // Note: the simple formatter doesn't handle this edge case but shouldn't crash
    const input = '<svg><rect data-foo="a>b"/></svg>';
    const result = formatSvg(input);
    expect(result).toContain("<svg>");
    expect(result).toContain("<rect");
  });

  it("handles multiple sibling elements at same level", () => {
    const input = "<svg><rect/><circle/><ellipse/></svg>";
    const result = formatSvg(input);
    expect(result).toBe("<svg>\n  <rect/>\n  <circle/>\n  <ellipse/>\n</svg>");
  });

  it("handles elements with text content and nested children", () => {
    const input = '<svg><g><text>hi</text><circle r="5"/></g></svg>';
    const result = formatSvg(input);
    expect(result).toBe(
      '<svg>\n  <g>\n    <text>\nhi\n    </text>\n    <circle r="5"/>\n  </g>\n</svg>',
    );
  });
});

describe("validateSvgSyntax", () => {
  it("returns null for well-formed SVG", () => {
    expect(
      validateSvgSyntax(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
      ),
    ).toBeNull();
  });

  it("returns null for well-formed SVG with nesting", () => {
    expect(validateSvgSyntax("<svg><g><rect/><circle/></g></svg>")).toBeNull();
  });

  it("detects mismatched closing tags", () => {
    const result = validateSvgSyntax("<svg><rect></circle></svg>");
    expect(result).not.toBeNull();
    expect(result).toContain("Mismatched");
    expect(result).toContain("rect");
    expect(result).toContain("circle");
  });

  it("detects unclosed tags", () => {
    const result = validateSvgSyntax("<svg><rect/><circle></svg>");
    expect(result).not.toBeNull();
    // The validator catches this as mismatched tags (</svg> when expecting </circle>)
    expect(result).toContain("Mismatched");
    expect(result).toContain("circle");
  });

  it("reports missing root SVG element", () => {
    const result = validateSvgSyntax("<rect/><circle/>");
    expect(result).not.toBeNull();
    expect(result).toContain("Missing");
    expect(result).toContain("svg");
  });

  it("returns null for empty string (no content to validate)", () => {
    expect(validateSvgSyntax("")).toBeNull();
  });

  it("returns null for whitespace-only strings", () => {
    expect(validateSvgSyntax("   ")).toBeNull();
  });

  it("handles self-closing tags correctly (not flagged as unclosed)", () => {
    const result = validateSvgSyntax(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect/><circle/><ellipse/></svg>',
    );
    expect(result).toBeNull();
  });

  it("detects deeply nested unclosed tags", () => {
    const result = validateSvgSyntax("<svg><g><g><rect/></svg>");
    expect(result).not.toBeNull();
    // The validator catches </svg> as mismatched vs expected </g>
    expect(result).toContain("Mismatched");
    expect(result).toContain("g");
  });

  it("handles complex SVG with mixed self-closing and paired tags", () => {
    const result = validateSvgSyntax(
      "<svg><rect/><g><circle/><text>Hello</text></g></svg>",
    );
    expect(result).toBeNull();
  });

  it("catches mismatch with expected tag in error message", () => {
    const result = validateSvgSyntax("<svg><g></rect></svg>");
    expect(result).toContain("</rect>");
    expect(result).toContain("</g>");
  });
});
