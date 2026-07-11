# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc`) then production build (`vite build`); a broken import or type error fails this immediately since there are no path aliases to mask a bad path
- `npm run lint` — ESLint over `**/*.{ts,tsx}` with `--max-warnings 0` (warnings fail the run, not just errors)
- `npm test` / `npx vitest run` — run the full test suite (Vitest, `environment: "node"`, no explicit `include` glob, so it auto-discovers every `*.test.ts` under `src/` regardless of folder)
- `npx vitest run <path>` — run a single test file, e.g. `npx vitest run src/mandelbrot/mandelbrot.test.ts`
- `npx tsc --noEmit` — fast typecheck without a full build; use this for quick iteration when moving/renaming files
- `npm run preview` — preview the production build

## Architecture

This is a single-page "MathArt" gallery app (Vite + React + TypeScript) that bundles to one inlined HTML file via `vite-plugin-singlefile`. It hosts 36 independent, self-contained mathematical/generative-art visualizations behind a shared home screen.

### Visualization registry and app shell

- `src/registry.ts` is the single source of truth: a `VisualizationId` union type and a `VISUALIZATIONS: VisualizationMeta[]` array (`{ id, title, description }`). Adding a visualization means adding an entry here.
- `src/pages/HomePage.tsx` renders the gallery grid purely from `VISUALIZATIONS` — each card's preview art comes from a CSS class named `mathart-viz-card-preview--<id>` in `museum-theme.css`, not from a live-rendered thumbnail.
- `src/App.tsx` is the router: it holds `view: "home" | VisualizationId` and a `mountedViz: Set<VisualizationId>` (visualizations are lazily mounted on first visit, then kept alive and just hidden via `display: none` on subsequent visits — so switching back to one doesn't reset its state). Each visualization is wired in as one explicit `{mountedViz.has("<id>") ? <div className="viz-shell" style={{display: ...}}><XApp onHome={...} /></div> : null}` block — this is intentionally repetitive/data-independent rather than generated from the registry array.

### One folder per visualization

Every visualization lives in its own top-level `src/<id>/` folder, where `<id>` matches its registry `VisualizationId` (kebab-case). For the 34 uniform visualizations (all but `dragon-curves` and `vivus-text`, see below) the shape is small and consistent:

```
src/mandelbrot/
  MandelbrotApp.tsx     — the React component (sidebar controls + canvas), imports VisualizationTopBar and its own logic file
  mandelbrot.ts         — pure, framework-free logic (math, simulation step functions, renderers)
  mandelbrot.test.ts     — Vitest unit tests for the logic file
```

All imports between a visualization's own files are relative (`./mandelbrot`), and there are no path aliases anywhere in the project (no `paths`/`baseUrl` in `tsconfig.json`, no `resolve.alias` in `vite.config.ts`). Visualizations do not import from each other — each is fully independent except for the shared pieces listed below. Where a logic file needs randomness (most do), it duplicates its own small mulberry32-style `createSeededRandom(seed)` rather than importing one — this is a deliberate convention, not an oversight; do not "deduplicate" it into a shared util.

The typical component shape (worth knowing before building a new one): a two-pane layout — a `dragon-sidebar` panel of `react-bootstrap` form controls on the left (sliders/selects each wrapped in the shared two-column `.viz-control-row`/`.viz-control-row-label`/`.viz-control-row-control` CSS layout, a small stats/results readout block, and usually a "Download PNG" button wired to `downloadCanvasPng` from `src/downloadViz.ts`), and a `<canvas>` on the right where the actual rendering happens, sized via a `ResizeObserver` on the wrapping div. Animated visualizations (`n-body`, `strange-attractors`, `game-of-life`, `reaction-diffusion`, `flow-fields`, `langtons-ant`, `diffusion-limited-aggregation`, `abelian-sandpile`) drive a `requestAnimationFrame` loop that mutates a ref-held simulation object and redraws each frame, usually with a "steps/topples/particles per frame" slider bounding how much work happens per tick; static/parametric ones (`mandelbrot`, `newton-fractal`, `bifurcation`, `l-systems`, `penrose-tiling`, `spirograph`, `lissajous`, `chaos-game`, `superformula`, etc.) just recompute and redraw on prop/state change. Several static ones additionally offer an opt-in "Animate drawing" checkbox (`op-art`, `phyllotaxis`, `spirograph`, `lissajous`, `rose-curves`, `superformula`, `euler-spiral`, `curve-stitching`) — a second, independent `requestAnimationFrame` effect layered on top of the static render that progressively reveals the already-computed points/lines, rather than a full rewrite into the animated-template shape.

**`dragon-curves` and `vivus-text` are the two exceptions** to the uniform pattern above.

`dragon-curves` is the oldest and largest visualization, a whole sub-application with 30+ files:

```
src/dragon-curves/
  DragonCurvesApp.tsx, Contexts.tsx, types.ts, randomiserSchemes.tsx, randomiserUtils.tsx,
  buildRequestConfig.ts, downloadUtils.tsx, pathAnimation.ts(+.test.ts), savedConfig.ts(+.test.ts)
  layout/    — BodyLayout, ControlLayout, ControlLayoutButtons, FullScreenLayout, ImageLayout(+.css)
  widgets/   — the three tile-color/style config popovers (Cell/Grouting/Path ConfigWidget)
  dialogs/   — the nine modal dialogs (save/load, stats, tile inspect, help text, etc.)
  engine/    — common.tsx + svg.tsx: the actual dragon-curve cell/turn calculation and SVG generation, with its own Vitest snapshot test (engine/svg.test.ts + engine/__snapshots__/)
```
Internally these files import each other extensively (e.g. `layout/ControlLayout.tsx` alone pulls from `widgets/`, `dialogs/`, `engine/`, and the root-level `Contexts`/`types`/`downloadUtils`/etc.) — treat this folder as one connected unit, not independent pieces, when changing it.

`vivus-text` is the only **SVG-based** (not canvas-based) visualization — it converts typed text into animated stroke-drawn letterforms:

```
src/vivus-text/
  VivusTextApp.tsx, vivusText.ts(+.test.ts)
  fonts/   — bundled .ttf files (Oswald, Pacifico, Roboto, Source Serif 4)
```
`vivusText.ts` uses the `opentype.js` package to parse a bundled `.ttf` and convert each glyph into an SVG path `d` string, then builds a literal `<svg>...<path .../>...</svg>` markup string. `VivusTextApp.tsx` injects that markup into a plain `<div>` via `innerHTML`, then hands the resulting live `<svg>` DOM node to the `vivus` npm package to animate the stroke draw-in. Because there's no backing `<canvas>`, its download button uses `downloadSvgAsPng` (rasterizes the live SVG onto an offscreen canvas first) rather than `downloadCanvasPng`.

### Shared/cross-cutting pieces (outside any single visualization folder)

- `src/Layouts/VisualizationTopBar.tsx` — the only genuinely shared component; every visualization's `*App.tsx` imports it for the top nav bar (a "← MathArt" home link plus a version/about tooltip).
- `src/downloadViz.ts` — shared download helpers imported by nearly every visualization (`downloadCanvasPng`, `downloadSvgAsPng`, `downloadSvgElement`, and the underlying `triggerDownload`). This is the one place genuine shared *logic* (not just a component) lives outside a visualization folder — everything else follows the "duplicate small helpers per folder" convention above.
- `src/museum-theme.css` — one global stylesheet (~4200 lines) imported once in `main.tsx`. Contains shared shell rules (`.dragon-app`, `.main-content`, `.dragon-sidebar*`, `.mathart-viz-card*`, and the shared `.viz-control-row`/`.viz-control-row-label`/`.viz-control-row-control` two-column layout used by nearly every visualization's slider/select rows) plus one CSS block per visualization, conventionally prefixed by a short slug (`.mandelbrot-canvas`, `.life-canvas`, `.attractor-sidebar`, etc.) and a `.mathart-viz-card-preview--<id>` block for its home-page thumbnail. This file is not split per-visualization — new visualization styles get appended here, in the same slug-prefixed-block convention.
- `src/App.css` / `src/index.css` — minimal, not meaningful.

### Adding a new visualization

1. Create `src/<id>/` with `<Name>App.tsx` + a pure logic module (+ its `.test.ts`), following the pattern above — use `.viz-control-row` for slider/select rows and wire a "Download PNG" button to `downloadCanvasPng` (from `src/downloadViz.ts`) to match the established convention.
2. Add the `id` to `VisualizationId` and a `{ id, title, description }` entry to `VISUALIZATIONS` in `src/registry.ts`.
3. Import the component in `src/App.tsx` and add its `mountedViz`/`view` conditional block (copy an existing one).
4. Append a CSS block to `museum-theme.css`: sidebar/canvas rules under `.dragon-app .<slug>-*`, plus a `.mathart-viz-card-preview--<id>` block for the home page thumbnail.
