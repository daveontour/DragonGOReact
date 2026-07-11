import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampDamping,
  clampFrequency,
  clampPhase,
  DEFAULT_DAMPING,
  DEFAULT_F1,
  DEFAULT_F2,
  DEFAULT_F3,
  DEFAULT_F4,
  DEFAULT_P1,
  DEFAULT_P3,
  drawHarmonograph,
  generateHarmonographPoints,
  HarmonographColorMode,
  MAX_DAMPING,
  MAX_FREQUENCY,
  MAX_PHASE,
  MIN_DAMPING,
  MIN_FREQUENCY,
  MIN_PHASE,
  randomHarmonographParams,
} from "./harmonograph";

const ANIMATE_DURATION_SECONDS = 6;
const MAX_AMPLITUDE = 2.1;

export default function HarmonographApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [f1, setF1] = useState(DEFAULT_F1);
  const [f2, setF2] = useState(DEFAULT_F2);
  const [f3, setF3] = useState(DEFAULT_F3);
  const [f4, setF4] = useState(DEFAULT_F4);
  const [p1, setP1] = useState(DEFAULT_P1);
  const [p3, setP3] = useState(DEFAULT_P3);
  const [damping, setDamping] = useState(DEFAULT_DAMPING);
  const [lineWidth, setLineWidth] = useState(1);
  const [colorMode, setColorMode] = useState<HarmonographColorMode>("mono");
  const [animate, setAnimate] = useState(false);

  const points = useMemo(
    () => generateHarmonographPoints({ f1, p1, f2, f3, p3, f4, damping }),
    [f1, p1, f2, f3, p3, f4, damping]
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

    const scale = ((displaySize / 2) * 0.9) / MAX_AMPLITUDE;
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawHarmonograph(ctx, displaySize, points, scale, lineWidth, colorMode, revealCount);
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
    setF1(DEFAULT_F1);
    setF2(DEFAULT_F2);
    setF3(DEFAULT_F3);
    setF4(DEFAULT_F4);
    setP1(DEFAULT_P1);
    setP3(DEFAULT_P3);
    setDamping(DEFAULT_DAMPING);
    setLineWidth(1);
    setColorMode("mono");
    setAnimate(false);
  };

  const randomize = () => {
    const params = randomHarmonographParams();
    setF1(params.f1);
    setF2(params.f2);
    setF3(params.f3);
    setF4(params.f4);
    setP1(params.p1);
    setP3(params.p3);
    setDamping(params.damping);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `harmonograph.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar harmonograph-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Harmonograph</h2>
            </div>
            <div className="dragon-sidebar-panel harmonograph-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-f1">
                    Pendulum frequency f1 (x)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-f1"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={0.001}
                      value={f1}
                      onChange={(e) => setF1(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{f1.toFixed(3)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-f2">
                    Pendulum frequency f2 (x)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-f2"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={0.001}
                      value={f2}
                      onChange={(e) => setF2(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{f2.toFixed(3)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-f3">
                    Pendulum frequency f3 (y)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-f3"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={0.001}
                      value={f3}
                      onChange={(e) => setF3(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{f3.toFixed(3)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-f4">
                    Pendulum frequency f4 (y)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-f4"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={0.001}
                      value={f4}
                      onChange={(e) => setF4(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{f4.toFixed(3)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-p1">
                    Phase x
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-p1"
                      type="range"
                      min={MIN_PHASE}
                      max={MAX_PHASE}
                      step={0.01}
                      value={p1}
                      onChange={(e) => setP1(clampPhase(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{p1.toFixed(2)} rad</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-p3">
                    Phase y
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-p3"
                      type="range"
                      min={MIN_PHASE}
                      max={MAX_PHASE}
                      step={0.01}
                      value={p3}
                      onChange={(e) => setP3(clampPhase(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{p3.toFixed(2)} rad</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-damping">
                    Damping
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-damping"
                      type="range"
                      min={MIN_DAMPING}
                      max={MAX_DAMPING}
                      step={0.0001}
                      value={damping}
                      onChange={(e) => setDamping(clampDamping(Number(e.target.value)))}
                    />
                    <div className="harmonograph-value-readout">{damping.toFixed(4)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="harmonograph-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="harmonograph-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) =>
                        setColorMode(e.target.value as HarmonographColorMode)
                      }
                    >
                      <option value="mono">Single color</option>
                      <option value="rainbow">Rainbow along curve</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="harmonograph-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={randomize}>
                    Randomize
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="harmonograph-hint">
                  A real harmonograph suspends a pen and a drawing table from
                  separate pendulums, each swinging at its own frequency,
                  phase, and rate of decay; summing two damped sine waves per
                  axis reproduces the ink trace those pendulums leave as
                  their swings gradually die out. Small frequency mismatches
                  between the pendulum pairs are what generate the slow,
                  hypnotic drift between the loops.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="harmonograph-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="harmonograph-canvas"
            role="img"
            aria-label="Harmonograph curve from two decaying pendulum pairs"
          />
        </div>
      </div>
    </>
  );
}
