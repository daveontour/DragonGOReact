import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  BobState,
  clampDamping,
  clampMagnetCount,
  clampStrength,
  DEFAULT_BASIN_RESOLUTION,
  DEFAULT_DAMPING,
  DEFAULT_MAGNET_COUNT,
  DEFAULT_STRENGTH,
  defaultMagnets,
  drawTrajectory,
  Magnet,
  MAX_BASIN_RESOLUTION,
  MAX_DAMPING,
  MAX_STEPS_PER_PIXEL,
  MAX_STRENGTH,
  MIN_BASIN_RESOLUTION,
  MIN_DAMPING,
  MIN_STRENGTH,
  PENDULUM_HEIGHT,
  PendulumParams,
  renderBasinMap,
  SIMULATION_DT,
  SPRING_K,
  stepMagneticPendulum,
} from "./magneticpendulum";

type RenderMode = "trajectory" | "basin";

const WORLD_EXTENT = 1.0;
const TRAJECTORY_TRAIL_LENGTH = 800;
const TRAJECTORY_STEPS_PER_FRAME = 3;

export default function MagneticPendulumApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [magnetCount, setMagnetCount] = useState<3 | 4 | 5>(DEFAULT_MAGNET_COUNT as 3 | 4 | 5);
  const [damping, setDamping] = useState(DEFAULT_DAMPING);
  const [strength, setStrength] = useState(DEFAULT_STRENGTH);
  const [renderMode, setRenderMode] = useState<RenderMode>("trajectory");
  const [basinResolution, setBasinResolution] = useState(DEFAULT_BASIN_RESOLUTION);
  const [rendering, setRendering] = useState(false);

  const magnets = useMemo<Magnet[]>(() => defaultMagnets(magnetCount), [magnetCount]);
  const params = useMemo<PendulumParams>(
    () => ({ damping, springK: SPRING_K, strength, height: PENDULUM_HEIGHT, dt: SIMULATION_DT }),
    [damping, strength]
  );

  const magnetsRef = useRef<Magnet[]>(magnets);
  const paramsRef = useRef<PendulumParams>(params);
  const bobRef = useRef<BobState>({ x: 0.35, y: 0.55, vx: 0, vy: 0 });
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    magnetsRef.current = magnets;
  }, [magnets]);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // --- Trajectory mode: RAF loop with refs ---
  useEffect(() => {
    if (renderMode !== "trajectory") {
      return;
    }
    let frameId = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
        if (canvas.width !== displaySize || canvas.height !== displaySize) {
          canvas.width = displaySize;
          canvas.height = displaySize;
          canvas.style.width = `${displaySize}px`;
          canvas.style.height = `${displaySize}px`;
        }

        for (let i = 0; i < TRAJECTORY_STEPS_PER_FRAME; i++) {
          stepMagneticPendulum(bobRef.current, magnetsRef.current, paramsRef.current);
        }
        trailRef.current.push({ x: bobRef.current.x, y: bobRef.current.y });
        if (trailRef.current.length > TRAJECTORY_TRAIL_LENGTH) {
          trailRef.current.shift();
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0a0d18";
          ctx.fillRect(0, 0, displaySize, displaySize);
          const scale = ((displaySize / 2) * 0.85) / WORLD_EXTENT;
          drawTrajectory(ctx, displaySize, displaySize, bobRef.current, trailRef.current, magnetsRef.current, scale);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [renderMode]);

  // --- Basin map mode: static per-pixel render ---
  const drawBasin = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || renderMode !== "basin") {
      return;
    }
    canvas.width = basinResolution;
    canvas.height = basinResolution;
    canvas.style.width = "";
    canvas.style.height = "";

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    setRendering(true);
    const imageData = ctx.createImageData(basinResolution, basinResolution);
    renderBasinMap(imageData, magnets, params, WORLD_EXTENT, MAX_STEPS_PER_PIXEL);
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [renderMode, basinResolution, magnets, params]);

  useEffect(() => {
    if (renderMode === "basin") {
      // Defer to let the mode-switch render commit first, so the
      // "Rendering..." indicator has a chance to paint before the
      // synchronous per-pixel compute blocks the thread.
      const id = window.setTimeout(drawBasin, 0);
      return () => window.clearTimeout(id);
    }
  }, [renderMode, drawBasin]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (renderMode !== "trajectory") {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const displaySize = rect.width;
    const scale = ((displaySize / 2) * 0.85) / WORLD_EXTENT;
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const worldX = (pixelX - displaySize / 2) / scale;
    const worldY = (displaySize / 2 - pixelY) / scale;
    bobRef.current = { x: worldX, y: worldY, vx: 0, vy: 0 };
    trailRef.current = [];
  };

  const resetView = () => {
    setMagnetCount(DEFAULT_MAGNET_COUNT as 3 | 4 | 5);
    setDamping(DEFAULT_DAMPING);
    setStrength(DEFAULT_STRENGTH);
    setBasinResolution(DEFAULT_BASIN_RESOLUTION);
    bobRef.current = { x: 0.35, y: 0.55, vx: 0, vy: 0 };
    trailRef.current = [];
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `magnetic-pendulum.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar magnetic-pendulum-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Magnetic Pendulum</h2>
            </div>
            <div className="dragon-sidebar-panel magnetic-pendulum-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="magnetic-pendulum-mode">
                    Render mode
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="magnetic-pendulum-mode"
                      as="select"
                      value={renderMode}
                      onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                    >
                      <option value="trajectory">Single trajectory</option>
                      <option value="basin">Basin-of-attraction map</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="magnetic-pendulum-count">
                    Number of magnets
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="magnetic-pendulum-count"
                      as="select"
                      value={magnetCount}
                      onChange={(e) => setMagnetCount(clampMagnetCount(Number(e.target.value)))}
                    >
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="magnetic-pendulum-damping">
                    Damping
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="magnetic-pendulum-damping"
                      type="range"
                      min={MIN_DAMPING}
                      max={MAX_DAMPING}
                      step={0.01}
                      value={damping}
                      onChange={(e) => setDamping(clampDamping(Number(e.target.value)))}
                    />
                    <div className="magnetic-pendulum-value-readout">{damping.toFixed(2)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="magnetic-pendulum-strength">
                    Magnet strength
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="magnetic-pendulum-strength"
                      type="range"
                      min={MIN_STRENGTH}
                      max={MAX_STRENGTH}
                      step={0.1}
                      value={strength}
                      onChange={(e) => setStrength(clampStrength(Number(e.target.value)))}
                    />
                    <div className="magnetic-pendulum-value-readout">{strength.toFixed(1)}</div>
                  </div>
                </div>

                {renderMode === "basin" ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="magnetic-pendulum-quality">
                      Map quality
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="magnetic-pendulum-quality"
                        type="range"
                        min={MIN_BASIN_RESOLUTION}
                        max={MAX_BASIN_RESOLUTION}
                        step={20}
                        value={basinResolution}
                        onChange={(e) => setBasinResolution(Number(e.target.value))}
                      />
                      <div className="magnetic-pendulum-value-readout">
                        {basinResolution}×{basinResolution}
                      </div>
                    </div>
                  </div>
                ) : null}

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                {renderMode === "basin" && rendering ? (
                  <p className="magnetic-pendulum-hint">Rendering…</p>
                ) : null}

                <p className="magnetic-pendulum-hint">
                  Hang a pendulum with a small magnet on its bob over three
                  fixed magnets embedded in a table, give it a push, and
                  friction will eventually pull it to rest hovering over
                  whichever magnet 'wins' — but which one wins depends on
                  the starting position with such extreme, fractal
                  sensitivity that moving the release point by a fraction
                  of a millimeter can flip the outcome. This model
                  simplifies the real 3D swinging pendulum into a damped 2D
                  oscillator pulled back toward center by a spring-like
                  restoring force and toward each magnet by an
                  inverse-cube attraction — the same simplification used in
                  the classic version of this desktop toy — then, for the
                  full map, tests every possible starting point across the
                  plane and colors it by which magnet its pendulum
                  eventually settles nearest, revealing basins of
                  attraction with fractal boundaries where the tiniest
                  nudge changes the destination.
                </p>
                {renderMode === "trajectory" ? (
                  <p className="magnetic-pendulum-hint">
                    Click the canvas to release the pendulum from a new
                    starting point.
                  </p>
                ) : null}
              </Stack>
            </div>
          </div>
        </div>

        <div className="magnetic-pendulum-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="magnetic-pendulum-canvas"
            role="img"
            aria-label="Magnetic pendulum trajectory or basin-of-attraction map"
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </>
  );
}
