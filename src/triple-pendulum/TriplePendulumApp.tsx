import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  BASE_TIME_STEP,
  clampAngleDeg,
  clampGravity,
  clampLength,
  clampMass,
  clampTimescale,
  clampTrailLength,
  DEFAULT_GRAVITY,
  DEFAULT_LENGTH,
  DEFAULT_MASS,
  DEFAULT_THETA1_DEG,
  DEFAULT_THETA2_DEG,
  DEFAULT_THETA3_DEG,
  DEFAULT_TIMESCALE,
  DEFAULT_TRAIL,
  drawTriplePendulum,
  drawTriplePivot,
  MAX_GRAVITY,
  MAX_LENGTH,
  MAX_MASS,
  MAX_TIMESCALE,
  MAX_TRAIL,
  MIN_GRAVITY,
  MIN_LENGTH,
  MIN_MASS,
  MIN_TIMESCALE,
  MIN_TRAIL,
  PERTURBATION_EPSILON_RAD,
  perturbTripleState,
  rk4TripleStep,
  TriplePendulumParams,
  TriplePendulumState,
  tripleBobPositions,
} from "./triplependulum";

interface TrailPoint {
  x: number;
  y: number;
}

function initialState(theta1Deg: number, theta2Deg: number, theta3Deg: number): TriplePendulumState {
  return {
    theta: [(theta1Deg * Math.PI) / 180, (theta2Deg * Math.PI) / 180, (theta3Deg * Math.PI) / 180],
    omega: [0, 0, 0],
  };
}

export default function TriplePendulumApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [m1, setM1] = useState(DEFAULT_MASS);
  const [m2, setM2] = useState(DEFAULT_MASS);
  const [m3, setM3] = useState(DEFAULT_MASS);
  const [L1, setL1] = useState(DEFAULT_LENGTH);
  const [L2, setL2] = useState(DEFAULT_LENGTH);
  const [L3, setL3] = useState(DEFAULT_LENGTH);
  const [gravity, setGravity] = useState(DEFAULT_GRAVITY);
  const [theta1Deg, setTheta1Deg] = useState(DEFAULT_THETA1_DEG);
  const [theta2Deg, setTheta2Deg] = useState(DEFAULT_THETA2_DEG);
  const [theta3Deg, setTheta3Deg] = useState(DEFAULT_THETA3_DEG);
  const [timescale, setTimescale] = useState(DEFAULT_TIMESCALE);
  const [trailLength, setTrailLength] = useState(DEFAULT_TRAIL);
  const [running, setRunning] = useState(true);
  const [showSensitivity, setShowSensitivity] = useState(false);

  const paramsRef = useRef<TriplePendulumParams>({ m: [m1, m2, m3], L: [L1, L2, L3], g: gravity });
  const timescaleRef = useRef(DEFAULT_TIMESCALE);
  const trailLengthRef = useRef(DEFAULT_TRAIL);
  const runningRef = useRef(true);
  const showSensitivityRef = useRef(false);

  const stateRef = useRef<TriplePendulumState>(initialState(theta1Deg, theta2Deg, theta3Deg));
  const state2Ref = useRef<TriplePendulumState>(
    perturbTripleState(stateRef.current, PERTURBATION_EPSILON_RAD)
  );
  const trailRef = useRef<TrailPoint[]>([]);
  const trail2Ref = useRef<TrailPoint[]>([]);

  useEffect(() => {
    paramsRef.current = { m: [m1, m2, m3], L: [L1, L2, L3], g: gravity };
  }, [m1, m2, m3, L1, L2, L3, gravity]);
  useEffect(() => {
    timescaleRef.current = timescale;
  }, [timescale]);
  useEffect(() => {
    trailLengthRef.current = trailLength;
  }, [trailLength]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    showSensitivityRef.current = showSensitivity;
    if (showSensitivity) {
      state2Ref.current = perturbTripleState(stateRef.current, PERTURBATION_EPSILON_RAD);
      trail2Ref.current = [];
    }
  }, [showSensitivity]);

  const resetSimulation = useCallback(() => {
    stateRef.current = initialState(theta1Deg, theta2Deg, theta3Deg);
    state2Ref.current = perturbTripleState(stateRef.current, PERTURBATION_EPSILON_RAD);
    trailRef.current = [];
    trail2Ref.current = [];
  }, [theta1Deg, theta2Deg, theta3Deg]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

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
        const dt = BASE_TIME_STEP * timescaleRef.current;
        const subSteps = Math.max(1, Math.round(timescaleRef.current));
        for (let i = 0; i < subSteps; i++) {
          stateRef.current = rk4TripleStep(stateRef.current, paramsRef.current, dt / subSteps);
          if (showSensitivityRef.current) {
            state2Ref.current = rk4TripleStep(state2Ref.current, paramsRef.current, dt / subSteps);
          }
        }

        const pos = tripleBobPositions(stateRef.current, paramsRef.current);
        trailRef.current.push({ x: pos.x[2], y: pos.y[2] });
        if (trailRef.current.length > trailLengthRef.current) {
          trailRef.current.shift();
        }

        if (showSensitivityRef.current) {
          const pos2 = tripleBobPositions(state2Ref.current, paramsRef.current);
          trail2Ref.current.push({ x: pos2.x[2], y: pos2.y[2] });
          if (trail2Ref.current.length > trailLengthRef.current) {
            trail2Ref.current.shift();
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0d18";
        ctx.fillRect(0, 0, width, height);
        const totalLength = paramsRef.current.L[0] + paramsRef.current.L[1] + paramsRef.current.L[2];
        const scale = Math.min(width, height) / (2.4 * totalLength);

        if (showSensitivityRef.current) {
          drawTriplePendulum(
            ctx,
            width,
            height,
            state2Ref.current,
            paramsRef.current,
            trail2Ref.current,
            scale,
            "#e6a844"
          );
        }
        drawTriplePendulum(
          ctx,
          width,
          height,
          stateRef.current,
          paramsRef.current,
          trailRef.current,
          scale,
          "#7fd4ff"
        );
        drawTriplePivot(ctx, width, height);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const resetView = () => {
    setM1(DEFAULT_MASS);
    setM2(DEFAULT_MASS);
    setM3(DEFAULT_MASS);
    setL1(DEFAULT_LENGTH);
    setL2(DEFAULT_LENGTH);
    setL3(DEFAULT_LENGTH);
    setGravity(DEFAULT_GRAVITY);
    setTheta1Deg(DEFAULT_THETA1_DEG);
    setTheta2Deg(DEFAULT_THETA2_DEG);
    setTheta3Deg(DEFAULT_THETA3_DEG);
    setTimescale(DEFAULT_TIMESCALE);
    setTrailLength(DEFAULT_TRAIL);
    setRunning(true);
    setShowSensitivity(false);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `triple-pendulum.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar triple-pendulum-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Triple Pendulum</h2>
            </div>
            <div className="dragon-sidebar-panel triple-pendulum-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-theta1">
                    Initial angle 1
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-theta1"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={theta1Deg}
                      onChange={(e) => setTheta1Deg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{theta1Deg.toFixed(0)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-theta2">
                    Initial angle 2
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-theta2"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={theta2Deg}
                      onChange={(e) => setTheta2Deg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{theta2Deg.toFixed(0)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-theta3">
                    Initial angle 3
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-theta3"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={theta3Deg}
                      onChange={(e) => setTheta3Deg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{theta3Deg.toFixed(0)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-m1">
                    Mass 1 / 2 / 3
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-m1"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS}
                      step={0.1}
                      value={m1}
                      onChange={(e) => setM1(clampMass(Number(e.target.value)))}
                    />
                    <FormControl
                      className="mt-2"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS}
                      step={0.1}
                      value={m2}
                      onChange={(e) => setM2(clampMass(Number(e.target.value)))}
                    />
                    <FormControl
                      className="mt-2"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS}
                      step={0.1}
                      value={m3}
                      onChange={(e) => setM3(clampMass(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">
                      {m1.toFixed(1)} / {m2.toFixed(1)} / {m3.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-l1">
                    Length 1 / 2 / 3
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-l1"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step={0.1}
                      value={L1}
                      onChange={(e) => setL1(clampLength(Number(e.target.value)))}
                    />
                    <FormControl
                      className="mt-2"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step={0.1}
                      value={L2}
                      onChange={(e) => setL2(clampLength(Number(e.target.value)))}
                    />
                    <FormControl
                      className="mt-2"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step={0.1}
                      value={L3}
                      onChange={(e) => setL3(clampLength(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">
                      {L1.toFixed(1)} / {L2.toFixed(1)} / {L3.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-gravity">
                    Gravity
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-gravity"
                      type="range"
                      min={MIN_GRAVITY}
                      max={MAX_GRAVITY}
                      step={0.1}
                      value={gravity}
                      onChange={(e) => setGravity(clampGravity(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{gravity.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-timescale">
                    Speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-timescale"
                      type="range"
                      min={MIN_TIMESCALE}
                      max={MAX_TIMESCALE}
                      step={0.1}
                      value={timescale}
                      onChange={(e) => setTimescale(clampTimescale(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{timescale.toFixed(1)}×</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="triple-pendulum-trail">
                    Trail length
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="triple-pendulum-trail"
                      type="range"
                      min={MIN_TRAIL}
                      max={MAX_TRAIL}
                      step={10}
                      value={trailLength}
                      onChange={(e) => setTrailLength(clampTrailLength(Number(e.target.value)))}
                    />
                    <div className="triple-pendulum-value-readout">{trailLength}</div>
                  </div>
                </div>

                <FormCheck
                  id="triple-pendulum-sensitivity"
                  type="checkbox"
                  label="Show sensitivity (second pendulum, +0.001 rad)"
                  checked={showSensitivity}
                  onChange={(e) => setShowSensitivity(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant={running ? "secondary" : "primary"} onClick={() => setRunning((r) => !r)}>
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button variant="outline-light" onClick={resetSimulation}>
                    Restart
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="triple-pendulum-hint">
                  Adding a third rigid rod to the double pendulum doesn't
                  just add more chaos — it removes the tidy closed-form
                  equations entirely. A two-link pendulum's motion can be
                  written out as two explicit formulas for the angular
                  accelerations; a three-link chain instead requires
                  assembling a 3×3 "mass matrix" from the system's kinetic
                  energy and solving a small linear system at every
                  instant, the same general technique used for pendulum
                  chains, robot arms, and multi-jointed limbs of any
                  length. The extra joint adds an extra degree of freedom
                  for the chaos to explore, so two runs differing by a
                  thousandth of a radian in the first joint typically
                  diverge even faster and more violently than the double
                  pendulum's already-unpredictable swing.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="triple-pendulum-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="triple-pendulum-canvas"
            role="img"
            aria-label="Triple pendulum chaotic motion"
          />
        </div>
      </div>
    </>
  );
}
