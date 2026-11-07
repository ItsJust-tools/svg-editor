import type { Tool } from "@itsjust/core";
import toolConfig from "./tool.config";
import { DEFAULT_SVG } from "./constants";
import type { SvgEditorState } from "./types";

/** Mirrors the framework's DeserializeResult contract for tool state. */
type DeserializeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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
 * Defensive deserialization: never throws, even on corrupted or malformed input.
 * Accepts a parsed state object or a JSON string (e.g. from share files).
 */
function safeDeserialize(data: unknown): DeserializeResult<SvgEditorState> {
  try {
    let candidate = data;
    if (typeof data === "string") {
      candidate = JSON.parse(data);
    }
    if (!isSvgEditorState(candidate)) {
      return {
        success: false,
        error: "Invalid data format: expected { svg: string, title?: string }",
      };
    }
    return {
      success: true,
      data: { svg: candidate.svg, title: candidate.title },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to deserialize SVG editor state: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
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
  deserialize: (data) => safeDeserialize(data),
  exporters: [
    { format: "svg", loader: () => import("./exporters/svg") },
    { format: "png", loader: () => import("./exporters/png") },
    { format: "jpeg", loader: () => import("./exporters/jpeg") },
    { format: "webp", loader: () => import("./exporters/webp") },
    { format: "pdf", loader: () => import("./exporters/pdf") },
  ],
};
