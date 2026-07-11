import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  circleMultiplicationChords,
  clampMultiplierK,
  clampStitchN,
  DEFAULT_MULTIPLIER_K,
  DEFAULT_STITCH_N,
  drawCurveStitching,
  maxMultiplierFor,
  MIN_MULTIPLIER_K,
  MAX_STITCH_N,
  MIN_STITCH_N,
  parabolaChords,
  StitchColorMode,
  StitchPattern,
} from "./curve-stitching";

const ANIMATE_DURATION_SECONDS = 4;

export default function CurveStitchingApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [pattern, setPattern] = useState<StitchPattern>("circle-multiplication");
  const [n, setN] = useState(DEFAULT_STITCH_N);
  const [k, setK] = useState(DEFAULT_MULTIPLIER_K);
  const [lineWidth, setLineWidth] = useState(1);
  const [lineAlpha, setLineAlpha] = useState(0.18);
  const [colorMode, setColorMode] = useState<StitchColorMode>("mono");
  const [animate, setAnimate] = useState(false);

  const chords = useMemo(
    () =>
      pattern === "circle-multiplication"
        ? circleMultiplicationChords(n, k)
        : parabolaChords(n),
    [pattern, n, k]
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

    const isCircle = pattern === "circle-multiplication";
    const scale = (displaySize / 2) * 0.85;
    const offsetX = isCircle ? 0 : -0.5;
    const offsetY = isCircle ? 0 : -0.5;
    const revealCount = animate ? Math.floor(revealRef.current) : chords.length;

    drawCurveStitching(
      ctx,
      displaySize,
      pattern,
      n,
      chords,
      scale,
      lineWidth,
      lineAlpha,
      colorMode,
      revealCount,
      offsetX,
      offsetY
    );
  }, [pattern, n, chords, lineWidth, lineAlpha, colorMode, animate]);

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
      const perSecond = Math.max(1, chords.length) / ANIMATE_DURATION_SECONDS;
      revealRef.current += perSecond * dt;
      if (revealRef.current > chords.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, chords.length, draw]);

  const resetView = () => {
    setPattern("circle-multiplication");
    setN(DEFAULT_STITCH_N);
    setK(DEFAULT_MULTIPLIER_K);
    setLineWidth(1);
    setLineAlpha(0.18);
    setColorMode("mono");
    setAnimate(false);
  };

  const isCircle = pattern === "circle-multiplication";


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `curve-stitching.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar curve-stitching-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Curve Stitching</h2>
            </div>
            <div className="dragon-sidebar-panel curve-stitching-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-pattern">
                    Pattern
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="curve-stitching-pattern"
                      as="select"
                      value={pattern}
                      onChange={(e) => {
                      const nextPattern = e.target.value as StitchPattern;
                      setPattern(nextPattern);
                      setK((current) => clampMultiplierK(current, n));
                      }}
                    >
                      <option value="circle-multiplication">
                      Circle multiplication (times tables)
                    </option>
                      <option value="two-ray-parabola">Two-ray parabola</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-n">
                    Points (n)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="curve-stitching-n"
                      type="range"
                      min={MIN_STITCH_N}
                      max={MAX_STITCH_N}
                      step={1}
                      value={n}
                      onChange={(e) => {
                      const nextN = clampStitchN(Number(e.target.value));
                      setN(nextN);
                      setK((current) => clampMultiplierK(current, nextN));
                      }}
                    />
                    <div className="curve-stitching-value-readout">{n}</div>
                  </div>
                </div>

                {isCircle ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-k">
                      Multiplier (k)
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="curve-stitching-k"
                        type="range"
                        min={MIN_MULTIPLIER_K}
                        max={maxMultiplierFor(n)}
                        step={0.1}
                        value={k}
                        onChange={(e) =>
                          setK(clampMultiplierK(Number(e.target.value), n))
                        }
                      />
                      <div className="curve-stitching-value-readout">{k.toFixed(1)}</div>
                    </div>
                  </div>
                ) : null}

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="curve-stitching-width"
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                    />
                    <div className="curve-stitching-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-alpha">
                    Thread opacity
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="curve-stitching-alpha"
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.01}
                      value={lineAlpha}
                      onChange={(e) => setLineAlpha(Number(e.target.value))}
                    />
                    <div className="curve-stitching-value-readout">
                      {lineAlpha.toFixed(2)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="curve-stitching-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="curve-stitching-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as StitchColorMode)}
                    >
                      <option value="mono">Single color</option>
                      <option value="rainbow">Rainbow by line index</option>
                    </FormControl>
                  </div>
                </div>

                <FormCheck
                  id="curve-stitching-animate"
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


                <p className="curve-stitching-hint">
                  No curve is actually drawn — only straight lines.
                  Connecting point i on one line (or on a circle) to a
                  related point elsewhere leaves a smooth-looking curve in
                  the space the lines never cross: the envelope of the line
                  family. Two rows of pins connected end-to-end trace a
                  parabola; points evenly spaced around a circle and
                  connected to i×k (the 'times table' construction) trace
                  cardioids, nephroids, and other looping envelopes
                  depending on the multiplier k.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="curve-stitching-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="curve-stitching-canvas"
            role="img"
            aria-label="Curve stitching envelope of straight lines"
          />
        </div>
      </div>
    </>
  );
}
