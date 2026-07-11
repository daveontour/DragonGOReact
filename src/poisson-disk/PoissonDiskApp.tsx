import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampRadius,
  clampStepsPerFrame,
  createPoissonDiskState,
  DEFAULT_RADIUS,
  DEFAULT_STEPS_PER_FRAME,
  drawPoissonSamples,
  MAX_RADIUS,
  MAX_STEPS_PER_FRAME,
  MIN_RADIUS,
  MIN_STEPS_PER_FRAME,
  PoissonDiskState,
  runPoissonSteps,
  runPoissonToCompletion,
} from "./poissondisk";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function PoissonDiskApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [seed, setSeed] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [stepsPerFrame, setStepsPerFrame] = useState(DEFAULT_STEPS_PER_FRAME);
  const [sampleCount, setSampleCount] = useState(0);

  const stateRef = useRef<PoissonDiskState | null>(null);
  const animateRef = useRef(false);
  const stepsPerFrameRef = useRef(DEFAULT_STEPS_PER_FRAME);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);
  useEffect(() => {
    stepsPerFrameRef.current = stepsPerFrame;
  }, [stepsPerFrame]);

  const regenerate = useCallback(() => {
    const wrap = wrapRef.current;
    const width = wrap ? Math.max(1, wrap.clientWidth) : 640;
    const height = wrap ? Math.max(1, wrap.clientHeight) : 480;
    const state = createPoissonDiskState(width, height, radius, seed);
    if (!animate) {
      runPoissonToCompletion(state);
    }
    stateRef.current = state;
    setSampleCount(state.samples.length);
  }, [radius, seed, animate]);

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, seed]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const state = stateRef.current;
    if (!canvas || !wrap || !state) {
      return;
    }
    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    drawPoissonSamples(ctx, displayWidth, displayHeight, state, Math.max(2, radius * 0.12));
  }, [radius]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => {
      regenerate();
      draw();
    });
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!animate) {
      return;
    }
    let frameId = 0;
    const loop = () => {
      const state = stateRef.current;
      if (state && !state.done) {
        runPoissonSteps(state, stepsPerFrameRef.current);
        setSampleCount(state.samples.length);
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, draw]);

  const resetView = () => {
    setRadius(DEFAULT_RADIUS);
    setSeed(1);
    setAnimate(false);
    setStepsPerFrame(DEFAULT_STEPS_PER_FRAME);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `poisson-disk.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar poisson-disk-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Poisson Disk Sampling</h2>
            </div>
            <div className="dragon-sidebar-panel poisson-disk-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="poisson-radius">
                    Minimum distance
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="poisson-radius"
                      type="range"
                      min={MIN_RADIUS}
                      max={MAX_RADIUS}
                      step={1}
                      value={radius}
                      onChange={(e) => setRadius(clampRadius(Number(e.target.value)))}
                    />
                    <div className="poisson-disk-value-readout">{radius}px</div>
                  </div>
                </div>

                <FormCheck
                  id="poisson-animate"
                  type="checkbox"
                  label="Animate growth"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                {animate ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="poisson-speed">
                      Steps per frame
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="poisson-speed"
                        type="range"
                        min={MIN_STEPS_PER_FRAME}
                        max={MAX_STEPS_PER_FRAME}
                        step={1}
                        value={stepsPerFrame}
                        onChange={(e) => setStepsPerFrame(clampStepsPerFrame(Number(e.target.value)))}
                      />
                      <div className="poisson-disk-value-readout">{stepsPerFrame}</div>
                    </div>
                  </div>
                ) : null}

                <div className="poisson-disk-results">
                  <div className="poisson-disk-result-row">
                    <span className="poisson-disk-result-label">Samples</span>
                    <span className="poisson-disk-result-value">{sampleCount}</span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={() => setSeed(randomSeed())}>
                    New seed
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="poisson-disk-hint">
                  Robert Bridson's 2007 algorithm produces 'blue noise' —
                  points with no two closer than a minimum distance r, but
                  without the visible regularity of a grid. A background
                  grid sized r/√2 gives O(1) neighbor lookups, so instead
                  of the naive O(n²) dart-throwing this replaced, new
                  candidates are generated only in the annulus between r
                  and 2r of an existing point and checked against a small
                  neighborhood of grid cells — an expected O(n) algorithm.
                  This exact technique is used for object scattering,
                  stippling, and sampling patterns in procedural graphics.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="poisson-disk-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="poisson-disk-canvas"
            role="img"
            aria-label="Poisson disk blue-noise point sampling"
          />
        </div>
      </div>
    </>
  );
}
