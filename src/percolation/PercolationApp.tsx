import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampGridSize,
  clampP,
  CRITICAL_P,
  DEFAULT_GRID_SIZE,
  DEFAULT_P,
  generateUniformField,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  renderPercolation,
  runPercolation,
  runSweep,
  SweepPoint,
} from "./percolation";

type PercolationMode = "static" | "sweep";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function PercolationApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [p, setP] = useState(DEFAULT_P);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<PercolationMode>("static");
  const [computing, setComputing] = useState(false);

  const field = useMemo(() => generateUniformField(gridSize, seed), [gridSize, seed]);
  const result = useMemo(() => runPercolation(gridSize, field, p), [gridSize, field, p]);
  const sweepPoints = useMemo<SweepPoint[] | null>(
    () => (mode === "sweep" ? runSweep(gridSize, seed) : null),
    [mode, gridSize, seed]
  );

  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = gridSize;
    canvas.height = gridSize;
    canvas.style.width = "";
    canvas.style.height = "";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const imageData = ctx.createImageData(gridSize, gridSize);
    renderPercolation(imageData, result, field, p);
    ctx.putImageData(imageData, 0, 0);
  }, [gridSize, result, field, p]);

  const drawSweep = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !sweepPoints) {
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

    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, displaySize, displaySize);

    const margin = displaySize * 0.08;
    const plotSize = displaySize - margin * 2;
    const toX = (pVal: number) => margin + pVal * plotSize;
    const toY = (fraction: number) => margin + (1 - fraction) * plotSize;

    // axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, margin + plotSize);
    ctx.lineTo(margin + plotSize, margin + plotSize);
    ctx.stroke();

    // critical-p marker
    ctx.strokeStyle = "rgba(230, 168, 68, 0.6)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(CRITICAL_P), margin);
    ctx.lineTo(toX(CRITICAL_P), margin + plotSize);
    ctx.stroke();
    ctx.setLineDash([]);

    // sweep curve
    ctx.strokeStyle = "#7fd4ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    sweepPoints.forEach((point, i) => {
      const x = toX(point.p);
      const y = toY(point.fraction);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [sweepPoints]);

  useEffect(() => {
    setComputing(true);
    const id = window.setTimeout(() => {
      if (mode === "static") {
        drawStatic();
      } else {
        drawSweep();
      }
      setComputing(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [mode, drawStatic, drawSweep]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || mode !== "sweep") {
      return;
    }
    const observer = new ResizeObserver(() => drawSweep());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [mode, drawSweep]);

  const newSeed = () => setSeed(randomSeed());

  const resetView = () => {
    setGridSize(DEFAULT_GRID_SIZE);
    setP(DEFAULT_P);
    setMode("static");
    setSeed(1);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `percolation.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar percolation-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Percolation Theory</h2>
            </div>
            <div className="dragon-sidebar-panel percolation-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="percolation-mode">
                    Mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="percolation-mode"
                      as="select"
                      value={mode}
                      onChange={(e) => setMode(e.target.value as PercolationMode)}
                    >
                      <option value="static">Fixed p (clusters)</option>
                      <option value="sweep">Sweep p (threshold)</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="percolation-size">
                    Grid size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="percolation-size"
                      type="range"
                      min={MIN_GRID_SIZE}
                      max={MAX_GRID_SIZE}
                      step={1}
                      value={gridSize}
                      onChange={(e) => setGridSize(clampGridSize(Number(e.target.value)))}
                    />
                    <div className="percolation-value-readout">
                      {gridSize}×{gridSize}
                    </div>
                  </div>
                </div>

                {mode === "static" ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="percolation-p">
                      p (open probability)
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="percolation-p"
                        type="range"
                        min={0}
                        max={1}
                        step={0.005}
                        value={p}
                        onChange={(e) => setP(clampP(Number(e.target.value)))}
                      />
                      <div className="percolation-value-readout">{p.toFixed(3)}</div>
                    </div>
                  </div>
                ) : null}

                {mode === "static" ? (
                  <div className="percolation-results">
                    <div className="percolation-result-row">
                      <span className="percolation-result-label">Percolates</span>
                      <span className="percolation-result-value">{result.percolates ? "Yes" : "No"}</span>
                    </div>
                    <div className="percolation-result-row">
                      <span className="percolation-result-label">Open cells</span>
                      <span className="percolation-result-value">
                        {result.openCount} / {gridSize * gridSize}
                      </span>
                    </div>
                  </div>
                ) : null}

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={newSeed}>
                    New seed
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                {computing ? <p className="percolation-hint">Computing…</p> : null}

                <p className="percolation-hint">
                  Each cell is independently open with probability p (site
                  percolation on the square lattice). Union-Find with path
                  compression tracks which open cells are connected; a
                  virtual top-row and bottom-row node let us test whether
                  any cluster spans the grid in O(α(n)) amortized time. As
                  p crosses the critical threshold p_c ≈ 0.592746 (a
                  rigorously studied constant for 2D square-lattice site
                  percolation), the probability of a spanning cluster jumps
                  sharply from near 0 to near 1 — a textbook second-order
                  phase transition.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="percolation-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="percolation-canvas"
            role="img"
            aria-label="Percolation grid or p-sweep chart"
          />
        </div>
      </div>
    </>
  );
}
