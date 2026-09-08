import type { Exporter } from "../../types";
import { sanitizeFilename } from "./sanitize";

const jsonExporter: Exporter = {
  format: "json",
  export: async (_element, options, stateSerializer) => {
    const defaultName = `export-${Date.now()}.json`;
    try {
      const jsonString = stateSerializer?.() ?? "{}";
      return {
        success: true,
        data: jsonString,
        filename: sanitizeFilename(
          options.filename ?? defaultName,
          defaultName,
        ),
        format: "json",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        filename: sanitizeFilename(
          options.filename ?? defaultName,
          defaultName,
        ),
        format: "json",
        error: error instanceof Error ? error.message : "JSON export failed",
      };
    }
  },
};

export default jsonExporter;
