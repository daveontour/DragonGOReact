import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampMaxDepth,
  clampMinRadiusFraction,
  DEFAULT_MAX_DEPTH,
  DEFAULT_RADIUS_FRACTION,
  GasketColorMode,
  generateGasket,
  MAX_MAX_DEPTH,
  MAX_RADIUS_FRACTION,
  MIN_MAX_DEPTH,
  MIN_RADIUS_FRACTION,
  renderGasket,
} from "./apolloniangasket";

const OUTER_RADIUS = 1;

export default function ApollonianGasketApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [minRadiusFraction, setMinRadiusFraction] = useState(DEFAULT_RADIUS_FRACTION);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
  const [lineWidth, setLineWidth] = useState(1.5);
  const [colorMode, setColorMode] = useState<GasketColorMode>("generation");

  const circles = useMemo(
    () => generateGasket(OUTER_RADIUS, minRadiusFraction, maxDepth),
    [minRadiusFraction, maxDepth]
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

    const scale = ((displaySize / 2) * 0.94) / OUTER_RADIUS;
    renderGasket(ctx, displaySize, circles, OUTER_RADIUS, scale, lineWidth, colorMode);
  }, [circles, lineWidth, colorMode]);

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

  const resetView = () => {
    setMinRadiusFraction(DEFAULT_RADIUS_FRACTION);
    setMaxDepth(DEFAULT_MAX_DEPTH);
    setLineWidth(1.5);
    setColorMode("generation");
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `apollonian-gasket.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar apollonian-gasket-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Apollonian Gasket</h2>
            </div>
            <div className="dragon-sidebar-panel apollonian-gasket-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="gasket-min-radius">
                    Detail (min circle size)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gasket-min-radius"
                      type="range"
                      min={MIN_RADIUS_FRACTION}
                      max={MAX_RADIUS_FRACTION}
                      step={0.0005}
                      value={minRadiusFraction}
                      onChange={(e) =>
                        setMinRadiusFraction(clampMinRadiusFraction(Number(e.target.value)))
                      }
                    />
                    <div className="apollonian-gasket-value-readout">
                      {(minRadiusFraction * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="gasket-max-depth">
                    Max depth (safety cap)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gasket-max-depth"
                      type="range"
                      min={MIN_MAX_DEPTH}
                      max={MAX_MAX_DEPTH}
                      step={1}
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(clampMaxDepth(Number(e.target.value)))}
                    />
                    <div className="apollonian-gasket-value-readout">{maxDepth}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="gasket-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gasket-width"
                      type="range"
                      min={0.5}
                      max={4}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                    />
                    <div className="apollonian-gasket-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="gasket-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="gasket-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as GasketColorMode)}
                    >
                      <option value="generation">By generation</option>
                      <option value="size">By size</option>
                    </FormControl>
                  </div>
                </div>

                <div className="apollonian-gasket-results">
                  <div className="apollonian-gasket-result-row">
                    <span className="apollonian-gasket-result-label">Circles</span>
                    <span className="apollonian-gasket-result-value">{circles.length}</span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="apollonian-gasket-hint">
                  Descartes worked out in 1643 that for any four mutually
                  tangent circles, their curvatures — one over each radius,
                  negative for a circle that curves the 'wrong way' around
                  the others, as an enclosing boundary does — satisfy a
                  fixed algebraic relationship, letting you compute a
                  fourth tangent circle's exact size and position from any
                  three. Applying that formula recursively, filling every
                  gap left behind with its own inscribed tangent circle,
                  and filling the gaps those leave in turn, produces the
                  Apollonian gasket: infinitely many circles of every
                  shrinking scale, packed with zero gaps between them, in a
                  self-similar carpet whose set of curvatures — remarkably
                  — often works out to whole numbers.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="apollonian-gasket-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="apollonian-gasket-canvas"
            role="img"
            aria-label="Apollonian gasket circle packing"
          />
        </div>
      </div>
    </>
  );
}
