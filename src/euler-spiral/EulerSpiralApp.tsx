import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampTMax,
  DEFAULT_T_MAX,
  drawEulerSpiral,
  EulerSpiralColorMode,
  generateEulerSpiralPoints,
  MAX_T_MAX,
  MIN_T_MAX,
} from "./euler-spiral";

const ANIMATE_DURATION_SECONDS = 5;

export default function EulerSpiralApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [tMax, setTMax] = useState(DEFAULT_T_MAX);
  const [lineWidth, setLineWidth] = useState(2);
  const [colorMode, setColorMode] = useState<EulerSpiralColorMode>("rainbow");
  const [animate, setAnimate] = useState(false);

  const points = useMemo(() => generateEulerSpiralPoints(tMax), [tMax]);

  const maxExtent = useMemo(
    () =>
      Math.max(
        1e-6,
        ...points.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))
      ),
    [points]
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

    const scale = ((displaySize / 2) * 0.85) / maxExtent;
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawEulerSpiral(ctx, displaySize, points, scale, lineWidth, colorMode, revealCount);
  }, [points, maxExtent, lineWidth, colorMode, animate]);

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
    setTMax(DEFAULT_T_MAX);
    setLineWidth(2);
    setColorMode("rainbow");
    setAnimate(false);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar euler-spiral-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Euler Spiral</h2>
            </div>
            <div className="dragon-sidebar-panel euler-spiral-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="euler-spiral-tmax">
                    Spiral turns
                  </FormLabel>
                  <FormControl
                    id="euler-spiral-tmax"
                    type="range"
                    min={MIN_T_MAX}
                    max={MAX_T_MAX}
                    step={0.1}
                    value={tMax}
                    onChange={(e) => setTMax(clampTMax(Number(e.target.value)))}
                  />
                  <div className="euler-spiral-value-readout">{tMax.toFixed(1)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="euler-spiral-width">
                    Line thickness
                  </FormLabel>
                  <FormControl
                    id="euler-spiral-width"
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.5}
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                  />
                  <div className="euler-spiral-value-readout">{lineWidth}px</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="euler-spiral-color">
                    Color mode
                  </FormLabel>
                  <FormControl
                    id="euler-spiral-color"
                    as="select"
                    value={colorMode}
                    onChange={(e) =>
                      setColorMode(e.target.value as EulerSpiralColorMode)
                    }
                  >
                    <option value="rainbow">Rainbow by arc length</option>
                    <option value="mono">Single color</option>
                  </FormControl>
                </div>

                <FormCheck
                  id="euler-spiral-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="euler-spiral-hint">
                  Also called a clothoid or Cornu spiral, this is the curve
                  whose curvature increases exactly linearly with distance
                  traveled along it — which is why road and rollercoaster
                  designers use it to transition from a straight section
                  into a circular curve without a jarring jolt in steering
                  angle. It has no closed-form (x, y) equation; each point
                  is the running total of the Fresnel integrals
                  ∫cos(πt²⁄2)dt and ∫sin(πt²⁄2)dt, computed here by
                  numerically summing many small steps.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="euler-spiral-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="euler-spiral-canvas"
            role="img"
            aria-label="Euler spiral (Cornu spiral / clothoid)"
          />
        </div>
      </div>
    </>
  );
}
