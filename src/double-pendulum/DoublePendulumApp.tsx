import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  BASE_TIME_STEP,
  bobPositions,
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
  DEFAULT_TIMESCALE,
  DEFAULT_TRAIL,
  drawDoublePendulum,
  drawPivot,
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
  PendulumParams,
  PendulumState,
  PERTURBATION_EPSILON_RAD,
  perturbState,
  rk4PendulumStep,
} from "./doublependulum";

interface TrailPoint {
  x: number;
  y: number;
}

function initialState(theta1Deg: number, theta2Deg: number): PendulumState {
  return {
    theta1: (theta1Deg * Math.PI) / 180,
    theta2: (theta2Deg * Math.PI) / 180,
    omega1: 0,
    omega2: 0,
  };
}

export default function DoublePendulumApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [m1, setM1] = useState(DEFAULT_MASS);
  const [m2, setM2] = useState(DEFAULT_MASS);
  const [L1, setL1] = useState(DEFAULT_LENGTH);
  const [L2, setL2] = useState(DEFAULT_LENGTH);
  const [gravity, setGravity] = useState(DEFAULT_GRAVITY);
  const [theta1Deg, setTheta1Deg] = useState(DEFAULT_THETA1_DEG);
  const [theta2Deg, setTheta2Deg] = useState(DEFAULT_THETA2_DEG);
  const [timescale, setTimescale] = useState(DEFAULT_TIMESCALE);
  const [trailLength, setTrailLength] = useState(DEFAULT_TRAIL);
  const [running, setRunning] = useState(true);
  const [showSensitivity, setShowSensitivity] = useState(false);

  const paramsRef = useRef<PendulumParams>({ m1, m2, L1, L2, g: gravity });
  const timescaleRef = useRef(DEFAULT_TIMESCALE);
  const trailLengthRef = useRef(DEFAULT_TRAIL);
  const runningRef = useRef(true);
  const showSensitivityRef = useRef(false);

  const stateRef = useRef<PendulumState>(initialState(theta1Deg, theta2Deg));
  const state2Ref = useRef<PendulumState>(perturbState(stateRef.current, PERTURBATION_EPSILON_RAD));
  const trailRef = useRef<TrailPoint[]>([]);
  const trail2Ref = useRef<TrailPoint[]>([]);

  useEffect(() => {
    paramsRef.current = { m1, m2, L1, L2, g: gravity };
  }, [m1, m2, L1, L2, gravity]);
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
      state2Ref.current = perturbState(stateRef.current, PERTURBATION_EPSILON_RAD);
      trail2Ref.current = [];
    }
  }, [showSensitivity]);

  const resetSimulation = useCallback(() => {
    stateRef.current = initialState(theta1Deg, theta2Deg);
    state2Ref.current = perturbState(stateRef.current, PERTURBATION_EPSILON_RAD);
    trailRef.current = [];
    trail2Ref.current = [];
  }, [theta1Deg, theta2Deg]);

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
          stateRef.current = rk4PendulumStep(stateRef.current, paramsRef.current, dt / subSteps);
          if (showSensitivityRef.current) {
            state2Ref.current = rk4PendulumStep(state2Ref.current, paramsRef.current, dt / subSteps);
          }
        }

        const { x2, y2 } = bobPositions(stateRef.current, paramsRef.current);
        trailRef.current.push({ x: x2, y: y2 });
        if (trailRef.current.length > trailLengthRef.current) {
          trailRef.current.shift();
        }

        if (showSensitivityRef.current) {
          const pos2 = bobPositions(state2Ref.current, paramsRef.current);
          trail2Ref.current.push({ x: pos2.x2, y: pos2.y2 });
          if (trail2Ref.current.length > trailLengthRef.current) {
            trail2Ref.current.shift();
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0d18";
        ctx.fillRect(0, 0, width, height);
        const scale = Math.min(width, height) / (2.4 * (paramsRef.current.L1 + paramsRef.current.L2));

        if (showSensitivityRef.current) {
          drawDoublePendulum(
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
        drawDoublePendulum(
          ctx,
          width,
          height,
          stateRef.current,
          paramsRef.current,
          trailRef.current,
          scale,
          "#7fd4ff"
        );
        drawPivot(ctx, width, height);
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const resetView = () => {
    setM1(DEFAULT_MASS);
    setM2(DEFAULT_MASS);
    setL1(DEFAULT_LENGTH);
    setL2(DEFAULT_LENGTH);
    setGravity(DEFAULT_GRAVITY);
    setTheta1Deg(DEFAULT_THETA1_DEG);
    setTheta2Deg(DEFAULT_THETA2_DEG);
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
    downloadCanvasPng(canvas, `double-pendulum.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar double-pendulum-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Double Pendulum</h2>
            </div>
            <div className="dragon-sidebar-panel double-pendulum-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-theta1">
                    Initial angle 1
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-theta1"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={theta1Deg}
                      onChange={(e) => setTheta1Deg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{theta1Deg.toFixed(0)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-theta2">
                    Initial angle 2
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-theta2"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={theta2Deg}
                      onChange={(e) => setTheta2Deg(clampAngleDeg(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{theta2Deg.toFixed(0)}°</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-m1">
                    Mass 1
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-m1"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS}
                      step={0.1}
                      value={m1}
                      onChange={(e) => setM1(clampMass(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{m1.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-m2">
                    Mass 2
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-m2"
                      type="range"
                      min={MIN_MASS}
                      max={MAX_MASS}
                      step={0.1}
                      value={m2}
                      onChange={(e) => setM2(clampMass(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{m2.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-l1">
                    Length 1
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-l1"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step={0.1}
                      value={L1}
                      onChange={(e) => setL1(clampLength(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{L1.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-l2">
                    Length 2
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-l2"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step={0.1}
                      value={L2}
                      onChange={(e) => setL2(clampLength(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{L2.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-gravity">
                    Gravity
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-gravity"
                      type="range"
                      min={MIN_GRAVITY}
                      max={MAX_GRAVITY}
                      step={0.1}
                      value={gravity}
                      onChange={(e) => setGravity(clampGravity(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{gravity.toFixed(1)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-timescale">
                    Speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-timescale"
                      type="range"
                      min={MIN_TIMESCALE}
                      max={MAX_TIMESCALE}
                      step={0.1}
                      value={timescale}
                      onChange={(e) => setTimescale(clampTimescale(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{timescale.toFixed(1)}×</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="pendulum-trail">
                    Trail length
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="pendulum-trail"
                      type="range"
                      min={MIN_TRAIL}
                      max={MAX_TRAIL}
                      step={10}
                      value={trailLength}
                      onChange={(e) => setTrailLength(clampTrailLength(Number(e.target.value)))}
                    />
                    <div className="double-pendulum-value-readout">{trailLength}</div>
                  </div>
                </div>

                <FormCheck
                  id="pendulum-sensitivity"
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

                <p className="double-pendulum-hint">
                  Two rigid rods joined end to end look like a trivial
                  extension of a simple pendulum, but coupling their motion
                  turns Newton's tidy, predictable pendulum into one of the
                  simplest physical systems that is fully chaotic: their
                  equations of motion, derived from the system's
                  Lagrangian, have no closed-form solution, and two runs
                  started a hair's breadth apart — the faint second
                  pendulum here differs from the first by roughly a
                  thousandth of a radian — visibly part ways within seconds
                  and end up in completely unrelated configurations, a
                  direct demonstration of the 'sensitive dependence on
                  initial conditions' that gives chaos theory its name.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="double-pendulum-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="double-pendulum-canvas"
            role="img"
            aria-label="Double pendulum chaotic motion"
          />
        </div>
      </div>
    </>
  );
}
