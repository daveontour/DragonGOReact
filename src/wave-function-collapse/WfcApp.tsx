import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampWfcGridSize,
  collapseStep,
  createSeededRandom,
  createWfcState,
  DEFAULT_WFC_GRID_SIZE,
  drawWfcGrid,
  isFullyResolved,
  MAX_RESTARTS,
  MAX_WFC_GRID_SIZE,
  MIN_WFC_GRID_SIZE,
  runWfc,
  WfcState,
} from "./wavefunctioncollapse";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function WfcApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [gridSize, setGridSize] = useState(DEFAULT_WFC_GRID_SIZE);
  const [seed, setSeed] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [restarts, setRestarts] = useState(0);
  const [running, setRunning] = useState(false);

  const stateRef = useRef<WfcState>(createWfcState(DEFAULT_WFC_GRID_SIZE, DEFAULT_WFC_GRID_SIZE));

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
    drawWfcGrid(ctx, displaySize, stateRef.current);
  }, []);

  const regenerate = useCallback(() => {
    if (animate) {
      stateRef.current = createWfcState(gridSize, gridSize);
      setRestarts(0);
      setRunning(true);
    } else {
      const { state, restarts: r } = runWfc(gridSize, gridSize, seed);
      stateRef.current = state;
      setRestarts(r);
      setRunning(false);
    }
  }, [gridSize, seed, animate]);

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize, seed, animate]);

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
    if (!running) {
      return;
    }
    let frameId = 0;
    let attempt = 0;
    let rng = createSeededRandom(seed);
    const loop = () => {
      if (!isFullyResolved(stateRef.current)) {
        const stepsThisFrame = Math.max(1, Math.floor((gridSize * gridSize) / 60));
        for (let i = 0; i < stepsThisFrame && !isFullyResolved(stateRef.current); i++) {
          const ok = collapseStep(stateRef.current, rng);
          if (!ok) {
            attempt++;
            if (attempt > MAX_RESTARTS) {
              setRunning(false);
              return;
            }
            stateRef.current = createWfcState(gridSize, gridSize);
            rng = createSeededRandom(seed + attempt * 7919);
            setRestarts(attempt);
            break;
          }
        }
        draw();
        frameId = requestAnimationFrame(loop);
      } else {
        setRunning(false);
        draw();
      }
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [running, gridSize, seed, draw]);

  const resetView = () => {
    setGridSize(DEFAULT_WFC_GRID_SIZE);
    setSeed(1);
    setAnimate(false);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `wave-function-collapse.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar wave-function-collapse-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Wave Function Collapse</h2>
            </div>
            <div className="dragon-sidebar-panel wave-function-collapse-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="wfc-size"
                  >
                    Grid size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="wfc-size"
                      type="range"
                      min={MIN_WFC_GRID_SIZE}
                      max={MAX_WFC_GRID_SIZE}
                      step={1}
                      value={gridSize}
                      onChange={(e) => setGridSize(clampWfcGridSize(Number(e.target.value)))}
                    />
                    <div className="wave-function-collapse-value-readout">
                      {gridSize}×{gridSize}
                    </div>
                  </div>
                </div>

                <FormCheck
                  id="wfc-animate"
                  type="checkbox"
                  label="Animate collapse"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <div className="wave-function-collapse-results">
                  <div className="wave-function-collapse-result-row">
                    <span className="wave-function-collapse-result-label">Restarts</span>
                    <span className="wave-function-collapse-result-value">{restarts}</span>
                  </div>
                  <div className="wave-function-collapse-result-row">
                    <span className="wave-function-collapse-result-label">Status</span>
                    <span className="wave-function-collapse-result-value">
                      {running ? "Collapsing…" : "Resolved"}
                    </span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
                    Regenerate
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="wave-function-collapse-hint">
                  Maxim Gumin's 2016 Wave Function Collapse algorithm
                  treats image generation as a constraint-satisfaction
                  problem: each cell starts able to hold any tile from a
                  small hand-authored set (here, pipe segments — straight,
                  corner, T-junction, cross — each edge tagged with a
                  'socket' that must match its neighbor's touching edge).
                  Repeatedly, the cell with the fewest remaining
                  possibilities is collapsed to one weighted-random
                  choice, then that constraint is propagated outward — a
                  neighbor's possibilities are filtered to only those with
                  a matching socket, and if that neighbor's set shrinks,
                  its neighbors are re-checked in turn, exactly like
                  arc-consistency propagation in classical constraint
                  satisfaction. If a cell is ever left with zero
                  possibilities, the whole grid restarts with a new seed
                  rather than backtracking.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="wave-function-collapse-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="wave-function-collapse-canvas"
            role="img"
            aria-label="Wave Function Collapse pipe tiling"
          />
        </div>
      </div>
    </>
  );
}
