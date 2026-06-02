import type { Tool } from "@itsjust/core";
import toolConfig from "./tool.config";
import type { SvgEditorState } from "./types";

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect x="50" y="50" width="100" height="100" rx="8" fill="#3b82f6" />
  <circle cx="100" cy="100" r="40" fill="#fbbf24" />
</svg>`;

function isSvgEditorState(value: unknown): value is SvgEditorState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { svg?: unknown; title?: unknown };
  return (
    typeof v.svg === "string" &&
    (v.title === undefined || typeof v.title === "string")
  );
}

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
