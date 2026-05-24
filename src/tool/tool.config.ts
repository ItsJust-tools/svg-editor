import type { ToolConfig } from "@itsjust/core";
import packageJson from "../../package.json";

export const templateBaseVersion = packageJson.version;

const toolConfig = {
  id: "svg-editor",
  name: "SVG Editor",
  description:
    "Full visual SVG editor with shape tools, text support, and bi-directional code sync. Edit on canvas or in code, export clean SVG.",
  version: "1.0.0",
  exportFormats: ["json", "svg", "png", "pdf"],
  features: {
    export: true,
    autoSave: false,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: "#3b82f6",
    accentHover: "#2563eb",
    accentSubtle: "rgba(59, 130, 246, 0.08)",
    brand: "SVG Editor",
    icon: "\u{1F50E}",
  },
  shortcuts: [
    {
      title: "SVG Editor",
      shortcuts: [
        {
          keys: "Ctrl+Shift+E",
          label: "Export",
          description: "export current SVG design",
        },
        { keys: "Ctrl+Z", label: "Undo", description: "undo last action" },
        {
          keys: "Ctrl+Y",
          label: "Redo",
          description: "redo last undone action",
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
