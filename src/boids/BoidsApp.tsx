import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  Boid,
  BoidParams,
  clampBoidCount,
  clampMaxForce,
  clampMaxSpeed,
  clampPerceptionRadius,
  clampWeight,
  createRandomBoids,
  DEFAULT_ALIGNMENT_WEIGHT,
  DEFAULT_BOID_COUNT,
  DEFAULT_COHESION_WEIGHT,
  DEFAULT_MAX_FORCE,
  DEFAULT_MAX_SPEED,
  DEFAULT_PERCEPTION_RADIUS,
  DEFAULT_SEPARATION_WEIGHT,
  drawBoids,
  MAX_BOID_COUNT,
  MAX_MAX_FORCE,
  MAX_MAX_SPEED,
  MAX_PERCEPTION_RADIUS,
  MAX_WEIGHT,
  MIN_BOID_COUNT,
  MIN_MAX_FORCE,
  MIN_MAX_SPEED,
  MIN_PERCEPTION_RADIUS,
  MIN_WEIGHT,
  stepBoids,
} from "./boids";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function BoidsApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boidsRef = useRef<Boid[]>(createRandomBoids(DEFAULT_BOID_COUNT, 800, 600, 1));
  const paramsRef = useRef<BoidParams>({
    perceptionRadius: DEFAULT_PERCEPTION_RADIUS,
    maxSpeed: DEFAULT_MAX_SPEED,
    maxForce: DEFAULT_MAX_FORCE,
    separationWeight: DEFAULT_SEPARATION_WEIGHT,
    alignmentWeight: DEFAULT_ALIGNMENT_WEIGHT,
    cohesionWeight: DEFAULT_COHESION_WEIGHT,
    predator: null,
  });
  const runningRef = useRef(true);
  const predatorModeRef = useRef(false);
  const predatorPosRef = useRef<{ x: number; y: number } | null>(null);

  const [boidCount, setBoidCount] = useState(DEFAULT_BOID_COUNT);
  const [perceptionRadius, setPerceptionRadius] = useState(DEFAULT_PERCEPTION_RADIUS);
  const [maxSpeed, setMaxSpeed] = useState(DEFAULT_MAX_SPEED);
  const [maxForce, setMaxForce] = useState(DEFAULT_MAX_FORCE);
  const [separationWeight, setSeparationWeight] = useState(DEFAULT_SEPARATION_WEIGHT);
  const [alignmentWeight, setAlignmentWeight] = useState(DEFAULT_ALIGNMENT_WEIGHT);
  const [cohesionWeight, setCohesionWeight] = useState(DEFAULT_COHESION_WEIGHT);
  const [running, setRunning] = useState(true);
  const [predatorMode, setPredatorMode] = useState(false);

  useEffect(() => {
    paramsRef.current = {
      perceptionRadius,
      maxSpeed,
      maxForce,
      separationWeight,
      alignmentWeight,
      cohesionWeight,
      predator: predatorModeRef.current ? predatorPosRef.current : null,
    };
  }, [perceptionRadius, maxSpeed, maxForce, separationWeight, alignmentWeight, cohesionWeight]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    predatorModeRef.current = predatorMode;
    if (!predatorMode) {
      predatorPosRef.current = null;
    }
  }, [predatorMode]);

  const respawn = useCallback((count: number) => {
    const wrap = wrapRef.current;
    const width = wrap ? Math.max(1, wrap.clientWidth) : 800;
    const height = wrap ? Math.max(1, wrap.clientHeight) : 600;
    boidsRef.current = createRandomBoids(count, width, height, randomSeed());
  }, []);

  useEffect(() => {
    respawn(boidCount);
  }, [boidCount, respawn]);

  useEffect(() => {
    let frameId = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const width = Math.max(1, wrap.clientWidth);
        const height = Math.max(1, wrap.clientHeight);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        if (runningRef.current) {
          paramsRef.current.predator = predatorModeRef.current ? predatorPosRef.current : null;
          stepBoids(boidsRef.current, paramsRef.current, width, height);
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawBoids(ctx, width, height, boidsRef.current);
          if (predatorModeRef.current && predatorPosRef.current) {
            ctx.fillStyle = "rgba(230, 84, 90, 0.85)";
            ctx.beginPath();
            ctx.arc(predatorPosRef.current.x, predatorPosRef.current.y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!predatorModeRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    predatorPosRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerLeave = () => {
    predatorPosRef.current = null;
  };

  const resetView = () => {
    setBoidCount(DEFAULT_BOID_COUNT);
    setPerceptionRadius(DEFAULT_PERCEPTION_RADIUS);
    setMaxSpeed(DEFAULT_MAX_SPEED);
    setMaxForce(DEFAULT_MAX_FORCE);
    setSeparationWeight(DEFAULT_SEPARATION_WEIGHT);
    setAlignmentWeight(DEFAULT_ALIGNMENT_WEIGHT);
    setCohesionWeight(DEFAULT_COHESION_WEIGHT);
    setRunning(true);
    setPredatorMode(false);
    respawn(DEFAULT_BOID_COUNT);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `boids.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar boids-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Boids (Flocking)</h2>
            </div>
            <div className="dragon-sidebar-panel boids-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-count">
                    Boid count
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-count"
                      type="range"
                      min={MIN_BOID_COUNT}
                      max={MAX_BOID_COUNT}
                      step={10}
                      value={boidCount}
                      onChange={(e) => setBoidCount(clampBoidCount(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{boidCount}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-perception">
                    Perception radius
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-perception"
                      type="range"
                      min={MIN_PERCEPTION_RADIUS}
                      max={MAX_PERCEPTION_RADIUS}
                      step={1}
                      value={perceptionRadius}
                      onChange={(e) => setPerceptionRadius(clampPerceptionRadius(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{perceptionRadius}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-speed">
                    Max speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-speed"
                      type="range"
                      min={MIN_MAX_SPEED}
                      max={MAX_MAX_SPEED}
                      step={0.1}
                      value={maxSpeed}
                      onChange={(e) => setMaxSpeed(clampMaxSpeed(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{maxSpeed.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-force">
                    Max force
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-force"
                      type="range"
                      min={MIN_MAX_FORCE}
                      max={MAX_MAX_FORCE}
                      step={0.01}
                      value={maxForce}
                      onChange={(e) => setMaxForce(clampMaxForce(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{maxForce.toFixed(2)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-separation">
                    Separation
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-separation"
                      type="range"
                      min={MIN_WEIGHT}
                      max={MAX_WEIGHT}
                      step={0.1}
                      value={separationWeight}
                      onChange={(e) => setSeparationWeight(clampWeight(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{separationWeight.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-alignment">
                    Alignment
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-alignment"
                      type="range"
                      min={MIN_WEIGHT}
                      max={MAX_WEIGHT}
                      step={0.1}
                      value={alignmentWeight}
                      onChange={(e) => setAlignmentWeight(clampWeight(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{alignmentWeight.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="boids-cohesion">
                    Cohesion
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="boids-cohesion"
                      type="range"
                      min={MIN_WEIGHT}
                      max={MAX_WEIGHT}
                      step={0.1}
                      value={cohesionWeight}
                      onChange={(e) => setCohesionWeight(clampWeight(Number(e.target.value)))}
                    />
                    <div className="boids-value-readout">{cohesionWeight.toFixed(1)}</div>
                  </div>
                </div>

                <FormCheck
                  id="boids-predator"
                  type="checkbox"
                  label="Predator (mouse) mode"
                  checked={predatorMode}
                  onChange={(e) => setPredatorMode(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={() => respawn(boidCount)}>
                    Respawn
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="boids-hint">
                  Craig Reynolds' 1986 boids model produces convincing
                  flocking from three purely local rules, each boid
                  reacting only to neighbors within a perception radius:
                  separation (steer away from very-close neighbors),
                  alignment (match the average heading of nearby boids),
                  and cohesion (steer toward the average position of
                  nearby boids). No boid has any notion of the flock as a
                  whole — the global, coordinated-looking motion emerges
                  entirely from these local interactions, a foundational
                  example of emergent behavior in agent-based simulation.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="boids-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="boids-canvas"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            role="img"
            aria-label="Boids flocking simulation"
          />
        </div>
      </div>
    </>
  );
}
