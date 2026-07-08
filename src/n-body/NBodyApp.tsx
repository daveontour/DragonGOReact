import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampBodyCount,
  clampNBodyTimescale,
  createRandomNBodySystem,
  DEFAULT_BODIES,
  DEFAULT_TIMESCALE,
  drawNBodySimulation,
  MAX_BODIES,
  MAX_TIMESCALE,
  MIN_BODIES,
  MIN_TIMESCALE,
  NBodySimulation,
  NBodyTrailPoint,
  stepNBodySimulation,
  TRAIL_LENGTH,
} from "./nbody";

const BASE_TIME_STEP = 1 / 60;

export default function NBodyApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<NBodySimulation>(createRandomNBodySystem(DEFAULT_BODIES));
  const trailsRef = useRef<NBodyTrailPoint[][]>(
    createRandomNBodySystem(DEFAULT_BODIES).bodies.map(() => [])
  );
  const timescaleRef = useRef(DEFAULT_TIMESCALE);
  const runningRef = useRef(true);

  const [bodyCount, setBodyCount] = useState(DEFAULT_BODIES);
  const [timescale, setTimescale] = useState(DEFAULT_TIMESCALE);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ time: 0, bodies: DEFAULT_BODIES });

  useEffect(() => {
    timescaleRef.current = timescale;
  }, [timescale]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const resetSimulation = useCallback((count: number) => {
    simRef.current = createRandomNBodySystem(count);
    trailsRef.current = simRef.current.bodies.map(() => []);
    setStats({ time: 0, bodies: count });
  }, []);

  useEffect(() => {
    resetSimulation(bodyCount);
  }, [bodyCount, resetSimulation]);

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
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (runningRef.current) {
        stepNBodySimulation(simRef.current, BASE_TIME_STEP * timescaleRef.current);
        simRef.current.bodies.forEach((body, index) => {
          const trail = trailsRef.current[index];
          if (!trail) {
            return;
          }
          trail.push({ x: body.x, y: body.y });
          if (trail.length > TRAIL_LENGTH) {
            trail.shift();
          }
        });
        setStats({ time: simRef.current.time, bodies: simRef.current.bodies.length });
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawNBodySimulation(ctx, width, height, simRef.current, trailsRef.current);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar nbody-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">N-Body Gravity</h2>
            </div>
            <div className="dragon-sidebar-panel nbody-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="nbody-count">
                    Number of bodies
                  </FormLabel>
                  <FormControl
                    id="nbody-count"
                    type="range"
                    min={MIN_BODIES}
                    max={MAX_BODIES}
                    step={1}
                    value={bodyCount}
                    onChange={(e) =>
                      setBodyCount(clampBodyCount(Number(e.target.value)))
                    }
                  />
                  <div className="nbody-value-readout">{bodyCount}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="nbody-timescale">
                    Time scale
                  </FormLabel>
                  <FormControl
                    id="nbody-timescale"
                    type="range"
                    min={MIN_TIMESCALE}
                    max={MAX_TIMESCALE}
                    step={0.1}
                    value={timescale}
                    onChange={(e) =>
                      setTimescale(clampNBodyTimescale(Number(e.target.value)))
                    }
                  />
                  <div className="nbody-value-readout">{timescale.toFixed(1)}×</div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => resetSimulation(bodyCount)}
                  >
                    New random system
                  </Button>
                </Stack>

                <div className="nbody-results">
                  <div className="nbody-result-row">
                    <span className="nbody-result-label">Bodies</span>
                    <span className="nbody-result-value">{stats.bodies}</span>
                  </div>
                  <div className="nbody-result-row">
                    <span className="nbody-result-label">Elapsed time</span>
                    <span className="nbody-result-value">{stats.time.toFixed(1)} s</span>
                  </div>
                </div>

                <p className="nbody-hint">
                  Every body pulls on every other body with Newtonian gravity.
                  Small changes in starting velocity lead to wildly different,
                  chaotic trajectories over time.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="nbody-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="nbody-canvas"
            role="img"
            aria-label="N bodies orbiting under mutual gravity"
          />
        </div>
      </div>
    </>
  );
}
