import { useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampAttemptsPerFrame,
  clampStickiness,
  createDLAState,
  createSeededRandom,
  DEFAULT_ATTEMPTS_PER_FRAME,
  DEFAULT_KILL_RADIUS_MULTIPLIER,
  DEFAULT_LAUNCH_MARGIN,
  DEFAULT_STICKINESS,
  DLAColorMode,
  DLAState,
  GRID_SIZE,
  MAX_ATTEMPTS_PER_FRAME,
  MAX_STICKINESS,
  MIN_ATTEMPTS_PER_FRAME,
  MIN_STICKINESS,
  renderDLA,
  runDLAParticleAttempts,
} from "./dla";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function DLAApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<DLAState>(createDLAState(GRID_SIZE));
  const rngRef = useRef(createSeededRandom(randomSeed()));
  const runningRef = useRef(true);
  const stickinessRef = useRef(DEFAULT_STICKINESS);
  const attemptsPerFrameRef = useRef(DEFAULT_ATTEMPTS_PER_FRAME);
  const colorModeRef = useRef<DLAColorMode>("age");

  const [stickiness, setStickiness] = useState(DEFAULT_STICKINESS);
  const [attemptsPerFrame, setAttemptsPerFrame] = useState(DEFAULT_ATTEMPTS_PER_FRAME);
  const [colorMode, setColorMode] = useState<DLAColorMode>("age");
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ particles: 1 });

  useEffect(() => {
    stickinessRef.current = stickiness;
  }, [stickiness]);
  useEffect(() => {
    attemptsPerFrameRef.current = attemptsPerFrame;
  }, [attemptsPerFrame]);
  useEffect(() => {
    colorModeRef.current = colorMode;
  }, [colorMode]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== GRID_SIZE || canvas.height !== GRID_SIZE) {
        canvas.width = GRID_SIZE;
        canvas.height = GRID_SIZE;
      }
      const displaySize = Math.max(
        1,
        Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight))
      );
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;

      if (runningRef.current) {
        runDLAParticleAttempts(
          stateRef.current,
          rngRef.current,
          attemptsPerFrameRef.current,
          DEFAULT_LAUNCH_MARGIN,
          DEFAULT_KILL_RADIUS_MULTIPLIER,
          stickinessRef.current
        );
        setStats({ particles: stateRef.current.stuckCount });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
        renderDLA(imageData, stateRef.current, colorModeRef.current);
        ctx.putImageData(imageData, 0, 0);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const reseed = () => {
    stateRef.current = createDLAState(GRID_SIZE);
    rngRef.current = createSeededRandom(randomSeed());
    setStats({ particles: 1 });
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `diffusion-limited-aggregation.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar diffusion-limited-aggregation-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Diffusion-Limited Aggregation</h2>
            </div>
            <div className="dragon-sidebar-panel diffusion-limited-aggregation-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="dla-stickiness"
                  >
                    Stickiness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="dla-stickiness"
                      type="range"
                      min={MIN_STICKINESS}
                      max={MAX_STICKINESS}
                      step={0.01}
                      value={stickiness}
                      onChange={(e) =>
                        setStickiness(clampStickiness(Number(e.target.value)))
                      }
                    />
                    <div className="diffusion-limited-aggregation-value-readout">
                      {stickiness.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="dla-attempts"
                  >
                    Growth speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="dla-attempts"
                      type="range"
                      min={MIN_ATTEMPTS_PER_FRAME}
                      max={MAX_ATTEMPTS_PER_FRAME}
                      step={1}
                      value={attemptsPerFrame}
                      onChange={(e) =>
                        setAttemptsPerFrame(clampAttemptsPerFrame(Number(e.target.value)))
                      }
                    />
                    <div className="diffusion-limited-aggregation-value-readout">
                      {attemptsPerFrame} particles/frame
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="dla-color"
                  >
                    Color mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="dla-color"
                      as="select"
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as DLAColorMode)}
                    >
                      <option value="age">Rainbow by growth order</option>
                      <option value="mono">Single color</option>
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
                  <Button variant="outline-light" onClick={reseed}>
                    New random seed
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="diffusion-limited-aggregation-results">
                  <div className="diffusion-limited-aggregation-result-row">
                    <span className="diffusion-limited-aggregation-result-label">
                      Particles stuck
                    </span>
                    <span className="diffusion-limited-aggregation-result-value">
                      {stats.particles}
                    </span>
                  </div>
                </div>

                <p className="diffusion-limited-aggregation-hint">
                  Particles are released one at a time and wander in a
                  random walk until they bump into the growing structure,
                  where they stick permanently. Repeating this thousands of
                  times builds the same kind of branching, fractal dendrite
                  seen in frost on a window, mineral deposits, and
                  electrical discharge patterns — because it's the same
                  underlying process: growth is fastest at the tips that
                  reach furthest into empty space, so branches beget more
                  branches.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="diffusion-limited-aggregation-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="diffusion-limited-aggregation-canvas"
            role="img"
            aria-label="Diffusion-limited aggregation growth simulation"
          />
        </div>
      </div>
    </>
  );
}
