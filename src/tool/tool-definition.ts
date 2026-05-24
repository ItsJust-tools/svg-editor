import type { Tool } from "@itsjust/core";
import toolConfig from "./tool.config";
import type { SvgEditorState } from "./types";

function isSvgEditorState(value: unknown): value is SvgEditorState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.svgContent === "string" &&
    (v.selectedElementId === undefined || typeof v.selectedElementId === "string") &&
    typeof v.zoom === "number" &&
    typeof v.viewBox === "string"
  );
}

export const svgEditorTool: Tool<SvgEditorState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"></svg>',
    zoom: 1,
    viewBox: "0 0 800 600",
  },
  serialize: (state) => JSON.stringify(state, null, 2),
  deserialize: (data) => {
    if (isSvgEditorState(data)) {
      return {
        success: true,
        data: {
          svgContent: data.svgContent,
          selectedElementId: data.selectedElementId,
          zoom: data.zoom,
          viewBox: data.viewBox,
        },
      };
    }
    return {
      success: false,
      error:
        "Invalid data format: expected { svgContent: string, zoom: number, viewBox: string }",
    };
  },
  exporters: [
    { format: "png", loader: () => import("./exporters/png") },
    { format: "jpeg", loader: () => import("./exporters/jpeg") },
    { format: "webp", loader: () => import("./exporters/webp") },
    { format: "pdf", loader: () => import("./exporters/pdf") },
  ],
};
