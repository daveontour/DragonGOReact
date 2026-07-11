import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampFrequency,
  clampPhase,
  DEFAULT_FREQ_A,
  DEFAULT_FREQ_B,
  DEFAULT_PHASE,
  drawLissajous,
  generateLissajousPoints,
  LissajousColorMode,
  MAX_FREQUENCY,
  MAX_PHASE,
  MIN_FREQUENCY,
  MIN_PHASE,
} from "./lissajous";

const ANIMATE_DURATION_SECONDS = 4;

export default function LissajousApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [freqA, setFreqA] = useState(DEFAULT_FREQ_A);
  const [freqB, setFreqB] = useState(DEFAULT_FREQ_B);
  const [phase, setPhase] = useState(DEFAULT_PHASE);
  const [lineWidth, setLineWidth] = useState(2);
  const [colorMode, setColorMode] = useState<LissajousColorMode>("mono");
  const [animate, setAnimate] = useState(false);

  const points = useMemo(
    () => generateLissajousPoints(freqA, freqB, phase),
    [freqA, freqB, phase]
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

    const scale = (displaySize / 2) * 0.85;
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawLissajous(ctx, displaySize, points, scale, lineWidth, colorMode, revealCount);
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
    setFreqA(DEFAULT_FREQ_A);
    setFreqB(DEFAULT_FREQ_B);
    setPhase(DEFAULT_PHASE);
    setLineWidth(2);
    setColorMode("mono");
    setAnimate(false);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `lissajous.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar lissajous-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Lissajous Curves</h2>
            </div>
            <div className="dragon-sidebar-panel lissajous-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lissajous-freq-a">
                    Frequency a (x)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lissajous-freq-a"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={1}
                      value={freqA}
                      onChange={(e) => setFreqA(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="lissajous-value-readout">{freqA}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lissajous-freq-b">
                    Frequency b (y)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lissajous-freq-b"
                      type="range"
                      min={MIN_FREQUENCY}
                      max={MAX_FREQUENCY}
                      step={1}
                      value={freqB}
                      onChange={(e) => setFreqB(clampFrequency(Number(e.target.value)))}
                    />
                    <div className="lissajous-value-readout">{freqB}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lissajous-phase">
                    Phase δ
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lissajous-phase"
                      type="range"
                      min={MIN_PHASE}
                      max={MAX_PHASE}
                      step={0.01}
                      value={phase}
                      onChange={(e) => setPhase(clampPhase(Number(e.target.value)))}
                    />
                    <div className="lissajous-value-readout">{phase.toFixed(2)} rad</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lissajous-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lissajous-width"
                      type="range"
                      min={0.5}
                      max={4}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                    />
                    <div className="lissajous-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lissajous-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lissajous-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as LissajousColorMode)}
                    >
                      <option value="mono">Single color</option>
                      <option value="rainbow">Rainbow along curve</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="lissajous-animate"
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


                <p className="lissajous-hint">
                  Independently oscillating the x and y coordinates as sine
                  waves — x = sin(a·t + δ), y = sin(b·t) — traces a Lissajous
                  figure, the pattern you'd see feeding two audio tones into
                  an oscilloscope's horizontal and vertical inputs. Simple
                  whole-number frequency ratios a:b produce closed loops with
                  a·b crossing points; the pattern always closes within one
                  full turn of t.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="lissajous-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="lissajous-canvas"
            role="img"
            aria-label="Lissajous figure traced from two sine oscillations"
          />
        </div>
      </div>
    </>
  );
}
