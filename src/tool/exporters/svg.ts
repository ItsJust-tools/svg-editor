import type { Exporter } from "@itsjust/core";
import { sanitizeFilename } from "./utils";

/**
 * SVG exporter — serializes the SVG element on the canvas to a clean SVG file.
 * Adds XML declaration and ensures proper namespace handling.
 */
const svgExporter: Exporter = {
  format: "svg",
  export: async (element, options) => {
    const defaultName = `export-${Date.now()}.svg`;
    try {
      // Prefer an inline rendered <svg> element (preview-style canvases);
      // otherwise fall back to the editor textarea's raw SVG source, which is
      // the actual content on the editor tab.
      const svgElement = element.querySelector("svg");
      const textarea = element.querySelector("textarea");
      const source = svgElement
        ? null
        : textarea instanceof HTMLTextAreaElement
          ? textarea.value
          : null;
      if (!svgElement && !source) {
        return {
          success: false,
          data: null,
          filename: sanitizeFilename(
            options.filename ?? defaultName,
            defaultName,
          ),
          format: "svg",
          error: "No SVG element found in the canvas",
        };
      }

      let svgContent: string;
      if (svgElement) {
        const clone = svgElement.cloneNode(true) as SVGElement;

        // Ensure xmlns is set
        if (!clone.getAttribute("xmlns")) {
          clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }

        const serializer = new XMLSerializer();
        svgContent = serializer.serializeToString(clone);
      } else {
        svgContent = source ?? "";
      }

      // Add XML declaration and clean up whitespace
      const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
      const fullContent = `${declaration}\n${svgContent}`;

      // Use the exact bare MIME type — the download gate in the core export
      // engine compares blob.type verbatim against its allowlist.
      const blob = new Blob([fullContent], { type: "image/svg+xml" });

      return {
        success: true,
        data: blob,
        filename: sanitizeFilename(
          options.filename ?? defaultName,
          defaultName,
        ),
        format: "svg",
      };
    } catch (error) {
      const base = error instanceof Error ? error.message : "SVG export failed";
      return {
        success: false,
        data: null,
        filename: sanitizeFilename(
          options.filename ?? defaultName,
          defaultName,
        ),
        format: "svg",
        error: base,
      };
    }
  },
};

export default svgExporter;
