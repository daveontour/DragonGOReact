import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampDriftSpeed,
  clampNoiseScale,
  clampParticleCount,
  clampSpeed,
  clampTrailAlpha,
  clampTurbulence,
  createFlowField,
  DEFAULT_DRIFT_SPEED,
  DEFAULT_NOISE_SCALE,
  DEFAULT_PARTICLES,
  DEFAULT_SPEED,
  DEFAULT_TRAIL_ALPHA,
  DEFAULT_TURBULENCE,
  drawFlowFieldFrame,
  fillFlowFieldBackground,
  FlowFieldColorMode,
  FlowFieldState,
  MAX_DRIFT_SPEED,
  MAX_NOISE_SCALE,
  MAX_PARTICLES,
  MAX_SPEED,
  MAX_TRAIL_ALPHA,
  MAX_TURBULENCE,
  MIN_DRIFT_SPEED,
  MIN_NOISE_SCALE,
  MIN_PARTICLES,
  MIN_SPEED,
  MIN_TRAIL_ALPHA,
  MIN_TURBULENCE,
  stepFlowField,
} from "./flowfields";

const BASE_TIME_STEP = 1;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function FlowFieldsApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<FlowFieldState | null>(null);
  const seedRef = useRef(randomSeed());
  const runningRef = useRef(true);
  const needsReseedRef = useRef(true);
  const particleCountRef = useRef(DEFAULT_PARTICLES);
  const trailAlphaRef = useRef(DEFAULT_TRAIL_ALPHA);
  const colorModeRef = useRef<FlowFieldColorMode>("ink");
  const paramsRef = useRef({
    noiseScale: DEFAULT_NOISE_SCALE,
    angleMultiplier: DEFAULT_TURBULENCE,
    speed: DEFAULT_SPEED,
    driftSpeed: DEFAULT_DRIFT_SPEED,
  });

  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES);
  const [noiseScale, setNoiseScale] = useState(DEFAULT_NOISE_SCALE);
  const [turbulence, setTurbulence] = useState(DEFAULT_TURBULENCE);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [driftSpeed, setDriftSpeed] = useState(DEFAULT_DRIFT_SPEED);
  const [trailAlpha, setTrailAlpha] = useState(DEFAULT_TRAIL_ALPHA);
  const [colorMode, setColorMode] = useState<FlowFieldColorMode>("ink");
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ time: 0, particles: DEFAULT_PARTICLES });

  useEffect(() => {
    paramsRef.current = {
      noiseScale,
      angleMultiplier: turbulence,
      speed,
      driftSpeed,
    };
  }, [noiseScale, turbulence, speed, driftSpeed]);
  useEffect(() => {
    trailAlphaRef.current = trailAlpha;
  }, [trailAlpha]);
  useEffect(() => {
    colorModeRef.current = colorMode;
    needsReseedRef.current = true;
  }, [colorMode]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    particleCountRef.current = particleCount;
    needsReseedRef.current = true;
  }, [particleCount]);

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      const width = Math.max(1, wrap.clientWidth);
      const height = Math.max(1, wrap.clientHeight);
      const sizeChanged = canvas.width !== width || canvas.height !== height;

      if (sizeChanged) {
        // Reassigning the backing store always wipes canvas content, so a
        // detected resize is treated the same as a reset (refill background
        // + reseed particles) rather than trying to preserve trails across it.
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");

      if ((sizeChanged || needsReseedRef.current) && ctx) {
        needsReseedRef.current = false;
        stateRef.current = createFlowField(
          width,
          height,
          particleCountRef.current,
          seedRef.current
        );
        fillFlowFieldBackground(ctx, width, height, colorModeRef.current);
        setStats({ time: 0, particles: particleCountRef.current });
      }

      const state = stateRef.current;
      if (state && ctx) {
        if (runningRef.current) {
          stepFlowField(state, paramsRef.current, BASE_TIME_STEP);
          setStats({ time: state.time, particles: state.particles.length });
        }
        drawFlowFieldFrame(ctx, state, colorModeRef.current, trailAlphaRef.current);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const regenerate = () => {
    seedRef.current = randomSeed();
    needsReseedRef.current = true;
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `flow-fields.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar flow-fields-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Flow Fields</h2>
            </div>
            <div className="dragon-sidebar-panel flow-fields-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-count">
                    Particle count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-count"
                      type="range"
                      min={MIN_PARTICLES}
                      max={MAX_PARTICLES}
                      step={100}
                      value={particleCount}
                      onChange={(e) =>
                        setParticleCount(clampParticleCount(Number(e.target.value)))
                      }
                    />
                    <div className="flow-fields-value-readout">{particleCount}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-scale">
                    Noise scale
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-scale"
                      type="range"
                      min={MIN_NOISE_SCALE}
                      max={MAX_NOISE_SCALE}
                      step={0.001}
                      value={noiseScale}
                      onChange={(e) =>
                        setNoiseScale(clampNoiseScale(Number(e.target.value)))
                      }
                    />
                    <div className="flow-fields-value-readout">
                      {noiseScale.toFixed(3)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="flow-fields-turbulence">
                    Turbulence
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-turbulence"
                      type="range"
                      min={MIN_TURBULENCE}
                      max={MAX_TURBULENCE}
                      step={0.5}
                      value={turbulence}
                      onChange={(e) =>
                        setTurbulence(clampTurbulence(Number(e.target.value)))
                      }
                    />
                    <div className="flow-fields-value-readout">
                      {turbulence.toFixed(1)}×π
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-speed">
                    Speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-speed"
                      type="range"
                      min={MIN_SPEED}
                      max={MAX_SPEED}
                      step={0.1}
                      value={speed}
                      onChange={(e) => setSpeed(clampSpeed(Number(e.target.value)))}
                    />
                    <div className="flow-fields-value-readout">{speed.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-drift">
                    Drift speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-drift"
                      type="range"
                      min={MIN_DRIFT_SPEED}
                      max={MAX_DRIFT_SPEED}
                      step={0.05}
                      value={driftSpeed}
                      onChange={(e) =>
                        setDriftSpeed(clampDriftSpeed(Number(e.target.value)))
                      }
                    />
                    <div className="flow-fields-value-readout">
                      {driftSpeed.toFixed(2)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-trail">
                    Trail opacity
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-trail"
                      type="range"
                      min={MIN_TRAIL_ALPHA}
                      max={MAX_TRAIL_ALPHA}
                      step={0.01}
                      value={trailAlpha}
                      onChange={(e) =>
                        setTrailAlpha(clampTrailAlpha(Number(e.target.value)))
                      }
                    />
                    <div className="flow-fields-value-readout">
                      {trailAlpha.toFixed(2)}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="flow-fields-color">
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="flow-fields-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) =>
                        setColorMode(e.target.value as FlowFieldColorMode)
                      }
                    >
                      <option value="ink">Ink on paper</option>
                      <option value="angle-hue">Hue by flow angle</option>
                    </FormControl>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={regenerate}>
                    New random field
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="flow-fields-results">
                  <div className="flow-fields-result-row">
                    <span className="flow-fields-result-label">Particles</span>
                    <span className="flow-fields-result-value">
                      {stats.particles}
                    </span>
                  </div>
                  <div className="flow-fields-result-row">
                    <span className="flow-fields-result-label">Elapsed time</span>
                    <span className="flow-fields-result-value">
                      {stats.time.toFixed(1)} s
                    </span>
                  </div>
                </div>

                <p className="flow-fields-hint">
                  Each particle follows the local direction of a small,
                  hand-written Perlin-noise vector field (no external
                  library). Trails accumulate frame over frame rather than
                  being redrawn from scratch, so the composition slowly
                  builds up the longer it runs.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="flow-fields-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="flow-fields-canvas"
            role="img"
            aria-label="Particles drifting along a Perlin-noise flow field, accumulating trails"
          />
        </div>
      </div>
    </>
  );
}
