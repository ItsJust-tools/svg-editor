# SVG Editor

[![CI](https://github.com/ItsJust-tools/svg-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsJust-tools/svg-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full visual SVG editor built with Next.js. Draw shapes, add text, edit directly in code mode, and export clean SVG files — all in the browser, no server required.

**Live site:** [svg-editor.itsjust.tools](https://svg-editor.itsjust.tools)

## Features

- **Canvas Editing** — Draw rectangles, ellipses, lines, polygons, and freeform paths
- **Text Tool** — Add and edit text elements with font, size, and color controls
- **Bi-directional Code Sync** — Edit the SVG code directly and see changes reflected on the canvas in real time
- **Undo/Redo** — Full undo/redo support for canvas operations
- **Export** — Export as SVG, PNG, PDF, or JSON
- **Import** — Import SVG files or `.itsjust.json` share files
- **Dark/Light Mode** — With system preference detection
- **High Contrast Mode** — With manual toggle and system preference support
- **Keyboard Shortcuts** — Quick access to undo, redo, and export

## Quick Start

```bash
git clone https://github.com/ItsJust-tools/svg-editor.git
cd svg-editor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start editing SVGs.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx             # Main tool page
│   ├── tool-client.tsx      # Tool client wrapper
│   └── ...
├── tool/                # SVG Editor specific code
│   ├── tool.config.ts       # Tool metadata and config
│   ├── tool-definition.ts   # Tool state, serialize, deserialize
│   ├── template-metadata.ts # PWA metadata
│   ├── types.ts             # TypeScript types
│   ├── components/
│   │   ├── tool-canvas.tsx  # SVG canvas editor component
│   │   ├── tool-toolbar.tsx # Toolbar with drawing tools
│   │   └── tool-sidebar.tsx # Sidebar with properties panel
│   └── exporters/           # Lazy-loaded exporters
└── lib/                 # Utility functions
```

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start dev server (Turbopack)   |
| `npm run build`      | Build core package + Next.js   |
| `npm test`           | Run Vitest unit tests          |
| `npm run lint`       | Run ESLint                     |
| `npm run format`     | Format with Prettier           |

## License

MIT
