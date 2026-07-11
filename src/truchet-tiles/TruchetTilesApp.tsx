import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampGridSize,
  clampLineWidth,
  DEFAULT_GRID_SIZE,
  DEFAULT_LINE_WIDTH,
  generateTruchetGrid,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  renderTruchetGrid,
  TileStyle,
  TruchetColorMode,
} from "./truchettiles";

const ANIMATE_TILES_PER_SECOND = 400;

export default function TruchetTilesApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [style, setStyle] = useState<TileStyle>("arcs");
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const [colorMode, setColorMode] = useState<TruchetColorMode>("mono");
  const [seed, setSeed] = useState(1);
  const [animate, setAnimate] = useState(false);

  const grid = useMemo(
    () => generateTruchetGrid(gridSize, gridSize, style, seed),
    [gridSize, style, seed]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
    canvas.width = displaySize;
    canvas.height = displaySize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const revealCount = animate ? Math.floor(revealRef.current) : grid.orientations.length;
    renderTruchetGrid(ctx, displaySize, grid, colorMode, lineWidth, revealCount);
  }, [grid, colorMode, lineWidth, animate]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => draw());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!animate) {
      return;
    }
    revealRef.current = 0;
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      revealRef.current += ANIMATE_TILES_PER_SECOND * dt;
      if (revealRef.current > grid.orientations.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, grid.orientations.length, draw]);

  const resetView = () => {
    setGridSize(DEFAULT_GRID_SIZE);
    setStyle("arcs");
    setLineWidth(DEFAULT_LINE_WIDTH);
    setColorMode("mono");
    setAnimate(false);
  };

  const reroll = () => setSeed((s) => s + 1);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `truchet-tiles.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar truchet-tiles-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Truchet Tiles</h2>
            </div>
            <div className="dragon-sidebar-panel truchet-tiles-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="truchet-grid-size">
                    Grid size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="truchet-grid-size"
                      type="range"
                      min={MIN_GRID_SIZE}
                      max={MAX_GRID_SIZE}
                      step={1}
                      value={gridSize}
                      onChange={(e) => setGridSize(clampGridSize(Number(e.target.value)))}
                    />
                    <div className="truchet-tiles-value-readout">{gridSize}×{gridSize}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="truchet-style">
                    Tile style
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="truchet-style"
                      as="select"
                      value={style}
                      onChange={(e) => setStyle(e.target.value as TileStyle)}
                    >
                      <option value="arcs">Quarter-circle arcs</option>
                      <option value="diagonal">Diagonal lines</option>
                      <option value="smith">Rotated corner motif</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="truchet-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="truchet-width"
                      type="range"
                      min={1}
                      max={8}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(clampLineWidth(Number(e.target.value)))}
                    />
                    <div className="truchet-tiles-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="truchet-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="truchet-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as TruchetColorMode)}
                    >
                      <option value="mono">Single color</option>
                      <option value="by-orientation">By orientation</option>
                      <option value="rainbow">Rainbow by tile index</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="truchet-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={reroll}>
                    Reroll
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="truchet-tiles-hint">
                  Truchet tiles are named for Sébastien Truchet, a French
                  Dominican friar and typographer who in 1704 studied how a
                  single square tile, split diagonally into two colors or
                  carved with a pair of quarter-circle arcs, could be
                  rotated at random and tiled edge-to-edge. No two adjacent
                  tiles need agree on anything, yet the arcs always meet
                  flush at the tile boundaries, so purely local randomness
                  at the tile level produces sweeping global structure —
                  looping paths, faux mazes, and moiré-like texture — with
                  no coordination between neighbors at all.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="truchet-tiles-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="truchet-tiles-canvas"
            role="img"
            aria-label="Truchet tile grid"
          />
        </div>
      </div>
    </>
  );
}
