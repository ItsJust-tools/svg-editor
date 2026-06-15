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
        {
          keys: "Alt+Shift+F",
          label: "Format",
          description: "format/indent SVG code",
        },
        {
          keys: "Tab",
          label: "Indent",
          description: "insert 2-space indent in code editor",
        },
        {
          keys: "Shift+Tab",
          label: "Outdent",
          description: "remove indent in code editor",
        },
      ],
    },
    {
      title: "Insert Shapes",
      shortcuts: [
        {
          keys: "Alt+R",
          label: "Insert rect",
          description: "insert a rectangle shape",
        },
        {
          keys: "Alt+C",
          label: "Insert circle",
          description: "insert a circle shape",
        },
        {
          keys: "Alt+E",
          label: "Insert ellipse",
          description: "insert an ellipse shape",
        },
        {
          keys: "Alt+P",
          label: "Insert path",
          description: "insert a path element",
        },
        {
          keys: "Alt+T",
          label: "Insert text",
          description: "insert a text element",
        },
        {
          keys: "Alt+L",
          label: "Insert line",
          description: "insert a line element",
        },
      ],
    },
  ],
} satisfies ToolConfig;

export default toolConfig;
