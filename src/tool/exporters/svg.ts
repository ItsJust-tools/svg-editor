import type { Exporter } from "@itsjust/core";

/**
 * SVG exporter — serializes the SVG element on the canvas to a clean SVG file.
 * Adds XML declaration and ensures proper namespace handling.
 */
const svgExporter: Exporter = {
  format: "svg",
  export: async (element, options) => {
    try {
      const svgElement = element.querySelector("svg");
      if (!svgElement) {
        return {
          success: false,
          data: null,
          filename: options.filename ?? `export-${Date.now()}.svg`,
          format: "svg",
          error: "No SVG element found in the canvas",
        };
      }

      const clone = svgElement.cloneNode(true) as SVGElement;

      // Ensure xmlns is set
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }

      const serializer = new XMLSerializer();
      const svgContent = serializer.serializeToString(clone);

      // Add XML declaration and clean up whitespace
      const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
      const fullContent = `${declaration}\n${svgContent}`;

      const blob = new Blob([fullContent], {
        type: "image/svg+xml;charset=utf-8",
      });

      return {
        success: true,
        data: blob,
        filename: options.filename ?? `export-${Date.now()}.svg`,
        format: "svg",
      };
    } catch (error) {
      const base = error instanceof Error ? error.message : "SVG export failed";
      return {
        success: false,
        data: null,
        filename: options.filename ?? `export-${Date.now()}.svg`,
        format: "svg",
        error: base,
      };
    }
  },
};

export default svgExporter;
