import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampRoseD,
  clampRoseN,
  DEFAULT_ROSE_D,
  DEFAULT_ROSE_N,
  drawRoseCurve,
  generateRosePoints,
  MAX_ROSE_D,
  MAX_ROSE_N,
  MIN_ROSE_D,
  MIN_ROSE_N,
  RoseColorMode,
  rosePetalCount,
} from "./rose-curves";

const ANIMATE_DURATION_SECONDS = 4;

export default function RoseCurvesApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [n, setN] = useState(DEFAULT_ROSE_N);
  const [d, setD] = useState(DEFAULT_ROSE_D);
  const [lineWidth, setLineWidth] = useState(2);
  const [colorMode, setColorMode] = useState<RoseColorMode>("mono");
  const [animate, setAnimate] = useState(false);

  const points = useMemo(() => generateRosePoints(n, d), [n, d]);
  const petalCount = useMemo(() => rosePetalCount(n, d), [n, d]);

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

    const scale = (displaySize / 2) * 0.85;
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawRoseCurve(ctx, displaySize, points, scale, lineWidth, colorMode, revealCount);
  }, [points, lineWidth, colorMode, animate]);

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
      const perSecond = points.length / ANIMATE_DURATION_SECONDS;
      revealRef.current += perSecond * dt;
      if (revealRef.current > points.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, points.length, draw]);

  const resetView = () => {
    setN(DEFAULT_ROSE_N);
    setD(DEFAULT_ROSE_D);
    setLineWidth(2);
    setColorMode("mono");
    setAnimate(false);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `rose-curves.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar rose-curves-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Rose Curves</h2>
            </div>
            <div className="dragon-sidebar-panel rose-curves-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="rose-curves-n">
                    Numerator (n)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="rose-curves-n"
                      type="range"
                      min={MIN_ROSE_N}
                      max={MAX_ROSE_N}
                      step={1}
                      value={n}
                      onChange={(e) => setN(clampRoseN(Number(e.target.value)))}
                    />
                    <div className="rose-curves-value-readout">{n}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="rose-curves-d">
                    Denominator (d)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="rose-curves-d"
                      type="range"
                      min={MIN_ROSE_D}
                      max={MAX_ROSE_D}
                      step={1}
                      value={d}
                      onChange={(e) => setD(clampRoseD(Number(e.target.value)))}
                    />
                    <div className="rose-curves-value-readout">{d}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="rose-curves-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="rose-curves-width"
                      type="range"
                      min={0.5}
                      max={4}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                    />
                    <div className="rose-curves-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="rose-curves-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="rose-curves-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as RoseColorMode)}
                    >
                      <option value="mono">Single color</option>
                      <option value="rainbow">Rainbow along curve</option>
                    </FormControl>
                  </div>
                </div>

                <div className="rose-curves-results">
                  <div className="rose-curves-result-row">
                    <span className="rose-curves-result-label">k = n⁄d</span>
                    <span className="rose-curves-result-value">
                      {n}⁄{d} = {(n / d).toFixed(3)}
                    </span>
                  </div>
                  <div className="rose-curves-result-row">
                    <span className="rose-curves-result-label">Petals</span>
                    <span className="rose-curves-result-value">{petalCount}</span>
                  </div>
                </div>

                <FormCheck
                  id="rose-curves-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                  Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                  Download PNG
                  </Button>
                </Stack>


                <p className="rose-curves-hint">
                  In polar coordinates, r = cos(k·θ) sweeps out looping
                  petals as θ turns. For a rational k = n/d in lowest terms,
                  an odd integer k draws k petals, an even integer k draws
                  2k petals, and other rational values interleave into
                  denser rose patterns — the curve is fully drawn once θ has
                  swept exactly far enough to retrace its starting point.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="rose-curves-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="rose-curves-canvas"
            role="img"
            aria-label="Polar rose curve with looping petals"
          />
        </div>
      </div>
    </>
  );
}
