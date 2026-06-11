import type { Tool } from "@itsjust/core";
import toolConfig from "./tool.config";
import { DEFAULT_SVG } from "./constants";
import type { SvgEditorState } from "./types";

/**
 * Type guard that checks whether an unknown value is a valid SvgEditorState.
 */
function isSvgEditorState(value: unknown): value is SvgEditorState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { svg?: unknown; title?: unknown };
  return (
    typeof v.svg === "string" &&
    (v.title === undefined || typeof v.title === "string")
  );
}

/**
 * Tool definition for the SVG Editor — wires up state management, serialization,
 * and lazy-loaded exporters for SVG, PNG, JPEG, WebP, and PDF formats.
 */
export const toolDefinition: Tool<SvgEditorState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    svg: DEFAULT_SVG,
  },
  serialize: (state) => JSON.stringify(state, null, 2),
  deserialize: (data) => {
    if (isSvgEditorState(data)) {
      return { success: true, data: { svg: data.svg, title: data.title } };
    }
    return {
      success: false,
      error: "Invalid data format: expected { svg: string, title?: string }",
    };
  },
  exporters: [
    { format: "svg", loader: () => import("./exporters/svg") },
    { format: "png", loader: () => import("./exporters/png") },
    { format: "jpeg", loader: () => import("./exporters/jpeg") },
    { format: "webp", loader: () => import("./exporters/webp") },
    { format: "pdf", loader: () => import("./exporters/pdf") },
  ],
};
