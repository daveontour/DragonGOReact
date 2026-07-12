import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampMassA,
  clampMassB,
  clampTimeScale,
  clampVelocity,
  createElasticCollisionSimulation,
  DEFAULT_MASS_A,
  DEFAULT_MASS_B,
  DEFAULT_TIME_SCALE,
  DEFAULT_VELOCITY_A,
  DEFAULT_VELOCITY_B,
  ElasticCollisionSimulation,
  MAX_MASS_A,
  MAX_MASS_B,
  MAX_TIME_SCALE,
  MAX_VELOCITY,
  MIN_MASS,
  MIN_TIME_SCALE,
  MIN_VELOCITY,
  stepElasticCollision,
  totalKineticEnergy,
  totalMomentum,
} from "./elasticCollisions";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

function drawVelocityArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: number,
  color: string
): void {
  if (Math.abs(velocity) < 0.005) {
    return;
  }
  const length = velocity * 180;
  const endX = x + length;
  const direction = Math.sign(velocity);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - direction * 8, y - 5);
  ctx.lineTo(endX - direction * 8, y + 5);
  ctx.closePath();
  ctx.fill();
}

function drawSimulation(
  canvas: HTMLCanvasElement,
  simulation: ElasticCollisionSimulation
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const { width, height } = canvas;
  const floorY = height * 0.72;
  const wallX = Math.max(48, width * 0.08);
  const worldScale = (width - wallX - 50) / 1.15;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#111a2d");
  gradient.addColorStop(1, "#070a12");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wallX, floorY);
  ctx.lineTo(width - 24, floorY);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(wallX, floorY, width - wallX - 24, 18);

  ctx.fillStyle = "#7b879e";
  ctx.strokeStyle = "#b8c0cf";
  ctx.lineWidth = 2;
  ctx.fillRect(wallX - 18, floorY - 190, 18, 208);
  ctx.strokeRect(wallX - 18, floorY - 190, 18, 208);
  ctx.save();
  ctx.beginPath();
  ctx.rect(wallX - 18, floorY - 190, 18, 208);
  ctx.clip();
  ctx.strokeStyle = "rgba(20, 27, 42, 0.55)";
  ctx.lineWidth = 2;
  for (let y = floorY - 205; y < floorY + 25; y += 16) {
    ctx.beginPath();
    ctx.moveTo(wallX - 24, y);
    ctx.lineTo(wallX + 6, y + 22);
    ctx.stroke();
  }
  ctx.restore();

  const drawBody = (
    body: ElasticCollisionSimulation["bodyA"],
    label: string
  ) => {
    const centerX = wallX + body.x * worldScale;
    const size = body.radius * worldScale * 2;
    const bodyTop = floorY - size;

    ctx.shadowColor = body.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = body.color;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, centerX - size / 2, bodyTop, size, size, 8);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#08101b";
    ctx.font = `600 ${Math.max(12, Math.min(18, size * 0.25))}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${label} · ${body.mass} kg`, centerX, bodyTop + size / 2);

    drawVelocityArrow(
      ctx,
      centerX,
      bodyTop - 18,
      body.velocity,
      body.color
    );
  };

  drawBody(simulation.bodyA, "A");
  drawBody(simulation.bodyB, "B");

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("fixed wall", wallX - 18, floorY - 202);
  ctx.fillText("frictionless surface →", wallX + 12, floorY + 40);
}

export default function ElasticCollisionsApp({
  onHome,
}: {
  onHome: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef(
    createElasticCollisionSimulation({
      massA: DEFAULT_MASS_A,
      massB: DEFAULT_MASS_B,
      velocityA: DEFAULT_VELOCITY_A,
      velocityB: DEFAULT_VELOCITY_B,
    })
  );
  const runningRef = useRef(true);
  const timeScaleRef = useRef(DEFAULT_TIME_SCALE);

  const [massA, setMassA] = useState(DEFAULT_MASS_A);
  const [massB, setMassB] = useState(DEFAULT_MASS_B);
  const [velocityA, setVelocityA] = useState(DEFAULT_VELOCITY_A);
  const [velocityB, setVelocityB] = useState(DEFAULT_VELOCITY_B);
  const [timeScale, setTimeScale] = useState(DEFAULT_TIME_SCALE);
  const [running, setRunning] = useState(true);
  const [, setFrame] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const width = Math.max(1, Math.floor(wrap.clientWidth));
    const height = Math.max(1, Math.floor(wrap.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    drawSimulation(canvas, simulationRef.current);
  }, []);

  const setIsRunning = useCallback((value: boolean) => {
    runningRef.current = value;
    setRunning(value);
  }, []);

  const resetSimulation = useCallback(() => {
    simulationRef.current = createElasticCollisionSimulation({
      massA,
      massB,
      velocityA,
      velocityB,
    });
    setFrame((value) => value + 1);
    setIsRunning(true);
    draw();
  }, [draw, massA, massB, setIsRunning, velocityA, velocityB]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(draw);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    let frameId = 0;
    let previousTime = performance.now();
    const loop = (now: number) => {
      const elapsed = Math.min(0.033, (now - previousTime) / 1000);
      previousTime = now;
      if (runningRef.current) {
        stepElasticCollision(
          simulationRef.current,
          elapsed * timeScaleRef.current
        );
        setFrame((value) => value + 1);
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  const simulation = simulationRef.current;
  const momentum = totalMomentum(simulation);
  const kineticEnergy = totalKineticEnergy(simulation);

  const downloadPng = () => {
    if (canvasRef.current) {
      downloadCanvasPng(canvasRef.current, "elastic-collisions.png");
    }
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar elastic-collisions-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Elastic Collisions</h2>
            </div>
            <div className="dragon-sidebar-panel elastic-collisions-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="elastic-collisions-mass-a"
                  >
                    Mass A
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="elastic-collisions-mass-a"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS_A}
                      step={1}
                      value={massA}
                      onChange={(event) =>
                        setMassA(clampMassA(Number(event.target.value)))
                      }
                    />
                    <div className="elastic-collisions-value-readout">
                      {massA} kg
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="elastic-collisions-mass-b"
                  >
                    Mass B
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="elastic-collisions-mass-b"
                      type="range"
                      min={Math.log10(MIN_MASS)}
                      max={Math.log10(MAX_MASS_B)}
                      step={0.01}
                      value={Math.log10(massB)}
                      onChange={(event) =>
                        setMassB(
                          clampMassB(10 ** Number(event.target.value))
                        )
                      }
                    />
                    <div className="elastic-collisions-value-readout">
                      {massB.toLocaleString()} kg
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="elastic-collisions-velocity-a"
                  >
                    Initial velocity A
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="elastic-collisions-velocity-a"
                      type="range"
                      min={MIN_VELOCITY}
                      max={MAX_VELOCITY}
                      step={0.01}
                      value={velocityA}
                      onChange={(event) =>
                        setVelocityA(clampVelocity(Number(event.target.value)))
                      }
                    />
                    <div className="elastic-collisions-value-readout">
                      {velocityA.toFixed(2)} m/s
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="elastic-collisions-velocity-b"
                  >
                    Initial velocity B
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="elastic-collisions-velocity-b"
                      type="range"
                      min={MIN_VELOCITY}
                      max={MAX_VELOCITY}
                      step={0.01}
                      value={velocityB}
                      onChange={(event) =>
                        setVelocityB(clampVelocity(Number(event.target.value)))
                      }
                    />
                    <div className="elastic-collisions-value-readout">
                      {velocityB.toFixed(2)} m/s
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="elastic-collisions-time-scale"
                  >
                    Time scale
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="elastic-collisions-time-scale"
                      type="range"
                      min={MIN_TIME_SCALE}
                      max={MAX_TIME_SCALE}
                      step={0.25}
                      value={timeScale}
                      onChange={(event) =>
                        setTimeScale(clampTimeScale(Number(event.target.value)))
                      }
                    />
                    <div className="elastic-collisions-value-readout">
                      {timeScale.toFixed(2)}×
                    </div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setIsRunning(!running)}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={resetSimulation}>
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="elastic-collisions-results">
                  <div className="elastic-collisions-result-row">
                    <span className="elastic-collisions-result-label">
                      Velocity A
                    </span>
                    <span className="elastic-collisions-result-value">
                      {simulation.bodyA.velocity.toFixed(3)} m/s
                    </span>
                  </div>
                  <div className="elastic-collisions-result-row">
                    <span className="elastic-collisions-result-label">
                      Velocity B
                    </span>
                    <span className="elastic-collisions-result-value">
                      {simulation.bodyB.velocity.toFixed(3)} m/s
                    </span>
                  </div>
                  <div className="elastic-collisions-result-row">
                    <span className="elastic-collisions-result-label">
                      Total momentum
                    </span>
                    <span className="elastic-collisions-result-value">
                      {momentum.toFixed(3)} kg·m/s
                    </span>
                  </div>
                  <div className="elastic-collisions-result-row">
                    <span className="elastic-collisions-result-label">
                      Kinetic energy
                    </span>
                    <span className="elastic-collisions-result-value">
                      {kineticEnergy.toFixed(3)} J
                    </span>
                  </div>
                  <div className="elastic-collisions-result-row">
                    <span className="elastic-collisions-result-label">
                      Collisions / wall bounces
                    </span>
                    <span className="elastic-collisions-result-value">
                      {simulation.bodyCollisions} / {simulation.wallBounces}
                    </span>
                  </div>
                </div>

                <p className="elastic-collisions-hint">
                  Positive velocity points right. With no friction and
                  perfectly elastic impacts, kinetic energy is conserved
                  during every collision. The fixed wall reverses velocity
                  without changing speed.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="elastic-collisions-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="elastic-collisions-canvas"
            role="img"
            aria-label="Two configurable masses colliding elastically beside a wall"
          />
        </div>
      </div>
    </>
  );
}
