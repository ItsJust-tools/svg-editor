# itsjust — Single-Purpose Tool Template

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea043?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ItsJust-tools/template/generate)

A Next.js template for building specialized single-purpose web tools. Each tool does ONE thing well — no bloat, no signups, no confusing menus.

**Live example:** [itsjust.tools](https://itsjust.tools)

## Why?

Multi-purpose tools (UML generators, diagram apps, paint programs) are bloated and confusing. itsjust tools do one thing and do it well. Want a UML activity diagram maker? It makes UML activity diagrams. Nothing else. Want a pixel art editor? It edits pixels. Clean, focused, fast.

## Compatibility

| Requirement | Version   | CI Verified |
| ----------- | --------- | ----------- |
| Node.js     | >= 22.0.0 | ✅          |
| npm         | >= 10.0.0 | ✅          |
| pnpm        | >= 9.0.0  | ✅          |
| yarn        | >= 1.22.0 | ✅          |

## Quick Start

Click **"Use this template"** above, or:

```bash
git clone https://github.com/ItsJust-tools/template.git my-tool
cd my-tool
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the example notepad tool.

## Project Structure

```text
src/
├── app/              # Next.js App Router pages & metadata
│   ├── page.tsx          # Tool main page (Server Component + SEO)
│   ├── tool-client.tsx   # Tool client logic
│   ├── sitemap.ts        # Auto-generated sitemap
│   ├── robots.ts         # robots.txt
│   ├── manifest.ts       # PWA manifest
│   └── not-found.tsx     # Custom 404
├── tool/             # Tool-specific code (customize this!)
│   ├── tool.config.ts    # Tool metadata, features, export formats
│   ├── tool-definition.ts # Tool contract (state, serialize, deserialize)
│   ├── template-metadata.ts # Single source of truth for URL, locale, PWA
│   ├── types.ts          # Your tool's TypeScript types
│   ├── components/       # Canvas, Toolbar, Sidebar
│   └── exporters/        # Optional lazy-loaded exporters (png, pdf, ...)
├── lib/
│   ├── seo.ts            # Metadata, OG tags, JSON-LD generators
│   └── utils.ts          # Utilities (cn())

packages/core/        # @itsjust/core — shared infrastructure
├── src/
│   ├── types/            # ToolConfig, ExportFormat, ShareData, etc.
│   ├── components/       # ToolShell, ThemeProvider, ToastProvider
│   ├── hooks/            # useTool, useToolState, useExport, useShare
│   ├── engines/          # ExportEngine, StorageManager
│   └── testing/          # renderTool(), createMockToolState()
└── __tests__/            # Core package unit tests

__tests__/
├── unit/            # Vitest unit tests
└── e2e/             # Playwright E2E tests
```

## Creating a New Tool (< 5 Minutes)

### Bootstrap Checklist

Follow these steps in order. Do not skip.

- [ ] **1. Click "Use this template"** on GitHub to create your repo
- [ ] **2. Edit `src/tool/tool.config.ts`** — set `id`, `name`, `description`, `version`, `exportFormats`, `features`, `theme`
- [ ] **3. Edit `src/tool/tool-definition.ts`** — define `ToolState`, `initialState`, `serialize`, `deserialize`, register exporters
- [ ] **4. Edit `src/tool/template-metadata.ts`** — set `htmlLang`, `locale`, `appName` (defaults to tool config)
- [ ] **5. Replace `src/tool/components/`** — `tool-canvas.tsx`, `tool-toolbar.tsx`, `tool-sidebar.tsx`
- [ ] **6. Update `src/lib/seo.ts`** — adjust keywords if needed (most data comes from tool config automatically)
- [ ] **7. Replace `public/og.svg`** — your tool's Open Graph image (1200x630)
- [ ] **8. Run preflight check:** `node scripts/preflight.mjs`
- [ ] **9. Verify everything works:** `npm run lint && npm test && npm run build`
- [ ] **10. Deploy to Vercel** — set `NEXT_PUBLIC_URL` in environment variables

### Example: Markdown Editor

1. **Click "Use this template"** on GitHub to create your repo
2. Edit `src/tool/tool.config.ts`:
   ```ts
   const toolConfig: ToolConfig = {
     id: 'markdown-editor',
     name: 'Markdown Editor',
     description: 'A minimal markdown editor with live preview',
     version: '1.0.0',
     exportFormats: ['json', 'png'],
     features: {
       export: true,
       autoSave: true,
       undoRedo: true,
       sidebar: true,
       statusBar: true,
       darkMode: true,
     },
     theme: {
       accent: '#10b981',
       accentHover: '#059669',
       accentSubtle: 'rgba(16, 185, 129, 0.08)',
       brand: 'Markdown Editor',
       icon: '📝',
     },
     shortcuts: [],
   };
   ```
3. Replace `src/tool/tool-definition.ts`:

   ```ts
   interface ToolState {
     markdown: string;
   }

   export const myTool: Tool<ToolState> = {
     id: toolConfig.id,
     name: toolConfig.name,
     version: toolConfig.version,
     config: toolConfig,
     initialState: { markdown: '# Hello World' },
     serialize: (state) => JSON.stringify(state, null, 2),
     deserialize: (data) => {
       if (typeof data !== 'object' || data === null) {
         return { success: false, error: 'Invalid data format' };
       }
       const record = data as Record<string, unknown>;
       if (typeof record.markdown !== 'string') {
         return { success: false, error: 'Missing markdown field' };
       }
       return { success: true, data: { markdown: record.markdown } };
     },
     exporters: [{ format: 'png', loader: () => import('./exporters/png') }],
   };
   ```

4. Replace components in `src/tool/components/`:
   - `tool-canvas.tsx` — your editor UI (textarea + preview)
   - `tool-toolbar.tsx` — formatting buttons (bold, italic, heading)
   - `tool-sidebar.tsx` — settings (word count, theme toggle)
5. Update `src/app/tool-client.tsx` — wire your components:
   ```tsx
   <ToolShell
     config={toolConfig}
     actions={tool.toolbarActions}
     toolbar={
       <>
         <ToolToolbar state={tool.state.data} />
         <ImportExport
           formats={tool.supportedFormats}
           onExport={tool.handleExport}
           onImport={tool.importFromFile}
         />
       </>
     }
     sidebar={<ToolSidebar state={tool.state.data} />}
     canvas={
       <ToolCanvas
         canvasRef={canvasRef}
         state={tool.state.data}
         onChange={(md) => tool.state.setData((prev) => ({ ...prev, markdown: md }))}
       />
     }
     statusBar={<span>{tool.state.data.markdown.length} chars</span>}
   />
   ```
6. Update `src/tool/template-metadata.ts` — set locale and language:
   ```ts
   export const templateMetadata = {
     htmlLang: 'en',
     locale: 'en_US',
     appName: toolConfig.name,
     shortName: toolConfig.name,
     appDescription: toolConfig.description,
     iconPath: '/icon.svg',
   };
   ```
7. Replace `public/og.svg` — your tool's Open Graph image.
8. Run `node scripts/preflight.mjs` to validate.

### Files to Change

| File                                   | What to do                                 |
| -------------------------------------- | ------------------------------------------ |
| `src/tool/tool.config.ts`              | Set id, name, description, features        |
| `src/tool/tool-definition.ts`          | Define state shape, serialize, deserialize |
| `src/tool/types.ts`                    | TypeScript types for your tool state       |
| `src/tool/template-metadata.ts`        | Locale, language, PWA metadata             |
| `src/tool/components/tool-canvas.tsx`  | Main tool UI                               |
| `src/tool/components/tool-toolbar.tsx` | Toolbar buttons                            |
| `src/tool/components/tool-sidebar.tsx` | Sidebar options                            |
| `src/app/tool-client.tsx`              | Wire everything together                   |
| `src/app/page.tsx`                     | SEO metadata (usually auto-derived)        |
| `public/og.svg`                        | Open Graph image                           |

See [GUIDE.md](./GUIDE.md) for the full walkthrough.

## Features

- **SEO** — Metadata, Open Graph, Twitter Cards, JSON-LD, sitemap, robots.txt, canonical URLs
- **Undo/Redo** via `useToolState` hook (max 50 entries)
- **Auto-Save** to localStorage with debounce
- **Export** to PNG, JPEG, WebP, PDF, JSON (100% client-side, lazy-loaded)
- **Import** from JSON and `.itsjust.json` share files (100% client-side)
- **Share** via file download, Web Share API, or clipboard — no server required
- **Shareable URL state** — creates URLs that carry the full tool state for collaborative handoff
- **Privacy-first local processing** — user input, import/export, and share-file generation stay in-browser
- **Dark/Light mode** with system preference detection
- **High-contrast mode** with manual toggle plus system contrast preference support
- **PWA-ready** — Web App Manifest included
- **Full-space responsive canvas** — uses available viewport space instead of fixed A4-like sizing
- **Editable toolbar brand name** — click the tool name to rename; persists in state and syncs to the browser tab title

Accessibility is mandatory in this template, not optional. New UI changes must keep keyboard navigation, visible focus states, semantic structure, and screen-reader support intact.

## Import/Export/Share Contracts

This section is the **canonical source of truth** for data contracts. All documentation and code must match this.

### `.itsjust.json` Share Format

```json
{
  "$schema": "itsjust-tool",
  "toolId": "simple-notepad",
  "version": "1.0",
  "content": { "text": "...", "title": "My Note" },
  "createdAt": "2026-04-22T...",
  "metadata": { "schemaVersion": "1.0" }
}
```

| Field       | Type     | Required | Description                                   |
| ----------- | -------- | -------- | --------------------------------------------- |
| `$schema`   | `string` | Yes      | Always `"itsjust-tool"`                       |
| `toolId`    | `string` | Yes      | Tool identifier (matches `toolConfig.id`)     |
| `version`   | `string` | Yes      | Schema version                                |
| `content`   | `object` | Yes      | Tool-specific state (passed to `deserialize`) |
| `createdAt` | `string` | Yes      | ISO 8601 timestamp                            |
| `metadata`  | `object` | No       | Optional additional metadata                  |

### Export Formats

| Format | How it works                      | Requires canvas ref |
| ------ | --------------------------------- | ------------------- |
| `json` | `serialize(state)` → `.json` file | No                  |
| `png`  | `html-to-image` → `.png` blob     | Yes                 |
| `jpeg` | `html-to-image` → `.jpeg` blob    | Yes                 |
| `webp` | `html-to-image` → `.webp` blob    | Yes                 |
| `pdf`  | `@media print` iframe → `.pdf`    | Yes                 |

Exporters are lazy-loaded. Register them in `src/tool/tool-definition.ts`:

```ts
exporters: [
  { format: 'png', loader: () => import('./exporters/png') },
  { format: 'pdf', loader: () => import('./exporters/pdf') },
],
```

### Import Result Type

```ts
type ImportResult =
  | { success: true; data: unknown; isItsJustFile: boolean }
  | { success: false; error: string; isItsJustFile: boolean };
```

`tool.deserialize(data)` receives the parsed `content` object and must return:

```ts
type DeserializeResult<T> = { success: true; data: T } | { success: false; error: string };
```

## Scripts

| Command                      | Description                          |
| ---------------------------- | ------------------------------------ |
| `npm run dev`                | Start dev server (Turbopack)         |
| `npm run build`              | Build core package + Next.js         |
| `npm test`                   | Run Vitest unit tests                |
| `npm run test:e2e`           | Run Playwright E2E tests             |
| `npm run test:e2e:dev`       | Run Playwright with UI for debugging |
| `npm run lint`               | Run ESLint                           |
| `npm run format`             | Format with Prettier                 |
| `node scripts/preflight.mjs` | Validate template readiness          |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable          | Description                                      | Required                                 |
| ----------------- | ------------------------------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_URL` | Public URL (e.g. `https://your-tool.vercel.app`) | No (defaults to `http://localhost:3000`) |

> **Note:** All features work 100% client-side without any environment variables.

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub, then:
npx vercel
# Or connect repo in Vercel dashboard
```

Set `NEXT_PUBLIC_URL` in your Vercel project settings.

### Local/Static Export

If you need static HTML (not Vercel), uncomment in `next.config.ts`:

```ts
output: 'export',
images: { unoptimized: true },
```

Then run `npm run build` and serve the `out/` directory.

## Troubleshooting

```text
Problem: npm install fails
Check:  Node version >= 22? (node -v)
Fix:   Use nvm or upgrade Node

Problem: Tests fail with "localStorage is not defined"
Check:  Are you running in Node without jsdom?
Fix:   Tests run with jsdom by default. Don't change test environment.

Problem: Export produces blank image
Check:  Is canvasRef attached to the visible element?
Fix:   Ensure the element has a measurable offsetWidth. The exporter temporarily moves the element off-screen to capture full content, so visibility is not required.

Problem: Hydration mismatch
Check:  Are you reading window/localStorage during render?
Fix:   Use useEffect or lazy initializer pattern (see ThemeProvider)

Problem: Build fails with "Cannot find module '@itsjust/core'"
Check:  Did you build the core package first?
Fix:   Run npm run build -w @itsjust/core

Problem: E2E tests timeout
Check:  Is the dev server running?
Fix:   Playwright starts its own server, but verify port 3000 is free

Problem: Type error in tool-definition.ts
Check:  Does deserialize return { success, data } or { success, error }?
Fix:   Update deserialize to return DeserializeResult<ToolState>

Problem: Preflight script reports stale references
Check:  Did you update template-metadata.ts and tool.config.ts?
Fix:   Rename all default template values (My Tool, template-tool, etc.)
```

## Release Checklist

Before tagging a release, verify:

- [ ] `node scripts/preflight.mjs` passes
- [ ] `npm run lint` passes with zero errors
- [ ] `npm test` passes with zero failures
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Version bumped in `package.json`
- [ ] SEO metadata verified (title, description, OG image, canonical)
- [ ] PWA manifest points to correct name and icons
- [ ] No hardcoded `itsjust.tools` references remain (except intentional)
- [ ] README quick-start commands work on a fresh clone

## Definition of Done

A tool created from this template is **done** when:

1. All [Release Checklist](#release-checklist) items pass
2. A new user can clone, install, and run the tool in < 5 minutes
3. The tool works without any environment variables
4. Undo/redo, auto-save, export, and import all function correctly
5. The tool is accessible via keyboard and screen reader
6. Dark mode and mobile viewport work correctly
7. The PWA manifest and SEO metadata are customized
8. No console errors or warnings in production build

## License

MIT
