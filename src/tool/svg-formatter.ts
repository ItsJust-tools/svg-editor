/**
 * Minimal SVG formatter that pretty-prints SVG markup with consistent indentation.
 * Handles self-closing tags, nested elements, and preserves text content.
 *
 * @param svg - Raw SVG string to format.
 * @param indentSize - Number of spaces per indent level (default 2).
 * @returns Formatted SVG string with proper indentation.
 */
export function formatSvg(svg: string, indentSize = 2): string {
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  let depth = 0;
  let i = 0;

  while (i < svg.length) {
    // Find the next tag boundary
    const tagStart = svg.indexOf("<", i);
    if (tagStart === -1) {
      // Remaining text content
      const text = svg.slice(i).trim();
      if (text) lines.push(text);
      break;
    }

    // Emit any text before the tag
    if (tagStart > i) {
      const text = svg.slice(i, tagStart).trim();
      if (text) lines.push(text);
    }

    // Find the end of this tag
    const tagEnd = svg.indexOf(">", tagStart);
    if (tagEnd === -1) {
      // Malformed — dump rest as-is
      lines.push(svg.slice(tagStart));
      break;
    }

    const tag = svg.slice(tagStart, tagEnd + 1);

    // Detect type of tag
    const isClosing = tag.startsWith("</");
    const isSelfClosing = tag.endsWith("/>");
    const isComment = tag.startsWith("<!--");
    const isDeclaration = tag.startsWith("<?");

    if (isComment || isDeclaration) {
      lines.push(tag);
    } else if (isClosing) {
      depth = Math.max(0, depth - 1);
      lines.push(indent.repeat(depth) + tag);
    } else if (isSelfClosing) {
      lines.push(indent.repeat(depth) + tag);
      // Don't increase depth for self-closing
    } else {
      lines.push(indent.repeat(depth) + tag);
      depth++;
    }

    i = tagEnd + 1;
  }

  return lines.join("\n");
}

/**
 * Detects whether an SVG string contains well-formed XML.
 * A basic check — does not fully validate but catches common issues.
 *
 * @param svg - The SVG string to check.
 * @returns An error message string if invalid, or null if it looks OK.
 */
export function validateSvgSyntax(svg: string): string | null {
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(svg)) !== null) {
    const fullTag = match[0];
    const tagName = match[1]!;

    if (fullTag.startsWith("</")) {
      // Closing tag
      const lastOpen = openTags.pop();
      if (lastOpen !== tagName) {
        return `Mismatched tags: expected </${lastOpen ?? "?"}> but found </${tagName}>`;
      }
    } else if (!fullTag.endsWith("/>")) {
      // Opening tag (not self-closing)
      openTags.push(tagName);
    }
  }

  if (openTags.length > 0) {
    return `Unclosed tags: <${openTags.join(">, <")}>`;
  }

  // Check for root svg element
  if (!svg.includes("<svg") && svg.trim().length > 0) {
    return "Missing root <svg> element";
  }

  return null;
}