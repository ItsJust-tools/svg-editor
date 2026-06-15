# SVG Editor

[![CI](https://github.com/ItsJust-tools/svg-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsJust-tools/svg-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full visual SVG editor built with Next.js. Write and preview SVG code side-by-side, insert shapes with one click, format/indent your code, and export clean SVG files — all in the browser, no server required.

**Live site:** [svg-editor.itsjust.tools](https://svg-editor.itsjust.tools)

## Features

- **Code Editor** — Write SVG markup in a dedicated code editor with syntax-friendly monospace font
- **Code Formatting** — Auto-indent and pretty-print your SVG with one click using the **Format** button
- **Live Preview** — See your SVG rendered in real time via an iframe preview pane
- **Shape Insertion** — One-click buttons to insert rectangles, circles, ellipses, lines, paths, and text elements
- **Bi-directional Export** — Download as SVG, PNG, JPEG, WebP, or PDF
- **Import** — Import SVG files or `.itsjust.json` share files
- **Undo/Redo** — Full undo/redo support for all edits
- **SVG Info Sidebar** — View code size, element count, canvas dimensions (from viewBox), color usage (including inline `style` fills/strokes), and element breakdown
- **Syntax Validation** — Automatically checks for mismatched or unclosed tags when switching to preview
- **Dark/Light Mode** — With system preference detection
- **High Contrast Mode** — With manual toggle and system preference support
- **Shareable URLs** — Share your SVG designs via compressed URL state
- **Keyboard Shortcuts** — Shape insertion, formatting, undo/redo, and export — all at your fingertips
- **Privacy-first** — All processing happens in your browser; nothing is sent to any server

## Compatibility

| Requirement | Version   |
| ----------- | --------- |
| Node.js     | >= 22.0.0 |
| npm         | >= 10.0.0 |
| pnpm        | >= 9.0.0  |
| yarn        | >= 1.22.0 |

## Quick Start

```bash
git clone https://github.com/ItsJust-tools/svg-editor.git
cd svg-editor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start editing SVGs.

## Keyboard Shortcuts

| Shortcut               | Action                               |
| ---------------------- | ------------------------------------ |
| `Alt` + `R`            | Insert rectangle                     |
| `Alt` + `C`            | Insert circle                        |
| `Alt` + `E`            | Insert ellipse                       |
| `Alt` + `P`            | Insert path                          |
| `Alt` + `T`            | Insert text                          |
| `Alt` + `L`            | Insert line                          |
| `Alt` + `Shift` + `F`  | Format/indent SVG code               |
| `Tab`                  | Insert 2-space indent in code editor |
| `Shift` + `Tab`        | Remove indent in code editor         |
| `Ctrl` + `Z`           | Undo                                 |
| `Ctrl` + `Y`           | Redo                                 |
| `Ctrl` + `Shift` + `E` | Export current SVG                   |

> **Note:** Shape insertion shortcuts (`Alt+…`) only work when the focus is outside of text inputs or textareas (e.g., when the code editor is not focused). Format shortcut (`Alt+Shift+F`) works anywhere in the editor.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx             # Main tool page
│   ├── tool-client.tsx      # Client tool logic (state, share, shape insert)
│   └── ...
├── tool/                # SVG Editor specific code
│   ├── tool.config.ts       # Tool metadata and config
│   ├── tool-definition.ts   # Tool state, serialize, deserialize
│   ├── svg-formatter.ts     # SVG pretty-print formatter & syntax checker
│   ├── template-metadata.ts # PWA metadata
│   ├── types.ts             # TypeScript types (SvgEditorState)
│   ├── components/
│   │   ├── tool-canvas.tsx  # SVG code editor + preview tabs + Format button
│   │   ├── tool-toolbar.tsx # Shape insertion buttons + help link
│   │   └── tool-sidebar.tsx # SVG info panel (elements, colors, viewBox)
│   └── exporters/           # Lazy-loaded exporters
└── lib/                 # Utility functions

packages/core/           # @itsjust/core — shared infrastructure

__tests__/
├── unit/                # Vitest unit tests
└── e2e/                 # Playwright E2E tests
```

## Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start dev server (Turbopack)   |
| `npm run build`        | Build core package + Next.js   |
| `npm run test`         | Run Vitest unit tests          |
| `npm run lint`         | Run ESLint                     |
| `npm run format`       | Format with Prettier           |
| `npm run format:check` | Check formatting with Prettier |

## Troubleshooting

```text
Problem: npm install fails
Check:  Node version >= 22? (node -v)
Fix:    Use nvm or upgrade Node

Problem: Tests fail with "localStorage is not defined"
Check:  Are you running in Node without jsdom?
Fix:    Tests run with jsdom by default. Don't change test environment.

Problem: Export produces blank image
Check:  Is canvasRef attached to the visible element?
Fix:    Ensure the element has a measurable offsetWidth. The exporter temporarily moves the element off-screen to capture full content.

Problem: Hydration mismatch
Check:  Are you reading window/localStorage during render?
Fix:    Use useEffect or lazy initializer pattern.

Problem: Build fails with "Cannot find module '@itsjust/core'"
Check:  Did you build the core package first?
Fix:    Run npm run build -w @itsjust/core
```

## Release Checklist

Before tagging a release, verify:

- [ ] `npm run lint` passes with zero errors
- [ ] `npm test` passes with zero failures
- [ ] `npm run build` succeeds
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Version bumped in `package.json`
- [ ] No console errors or warnings in production build
- [ ] E2E tests pass (`npm run test:e2e`)

## License

MIT
