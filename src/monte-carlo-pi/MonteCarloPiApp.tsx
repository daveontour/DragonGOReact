import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  addMonteCarloSamples,
  clampSamplesPerFrame,
  clampTargetSamples,
  createMonteCarloPiSimulation,
  DEFAULT_SAMPLES_PER_FRAME,
  DEFAULT_TARGET_SAMPLES,
  estimateError,
  estimatePi,
  MAX_SAMPLES_PER_FRAME,
  MAX_TARGET_SAMPLES,
  MIN_SAMPLES_PER_FRAME,
  MIN_TARGET_SAMPLES,
  MonteCarloPiSimulation,
} from "./monteCarloPi";

interface SimulationCounts {
  inside: number;
  total: number;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

function drawSimulation(
  canvas: HTMLCanvasElement,
  simulation: MonteCarloPiSimulation
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const padding = Math.max(14, Math.min(width, height) * 0.035);
  const side = Math.max(1, Math.min(width, height) - padding * 2);
  const left = (width - side) / 2;
  const top = (height - side) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = side / 2;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, "#121b2e");
  gradient.addColorStop(1, "#060810");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(90, 170, 255, 0.08)";
  ctx.fillRect(left, top, side, side);

  for (const point of simulation.points) {
    const x = centerX + point.x * radius;
    const y = centerY - point.y * radius;
    ctx.fillStyle = point.inside
      ? "rgba(107, 220, 170, 0.72)"
      : "rgba(244, 125, 125, 0.72)";
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  ctx.strokeStyle = "rgba(127, 212, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left, top, side, side);
}

export default function MonteCarloPiApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef(createMonteCarloPiSimulation(randomSeed()));
  const targetSamplesRef = useRef(DEFAULT_TARGET_SAMPLES);
  const samplesPerFrameRef = useRef(DEFAULT_SAMPLES_PER_FRAME);
  const runningRef = useRef(true);

  const [targetSamples, setTargetSamples] = useState(DEFAULT_TARGET_SAMPLES);
  const [samplesPerFrame, setSamplesPerFrame] = useState(
    DEFAULT_SAMPLES_PER_FRAME
  );
  const [running, setRunning] = useState(true);
  const [counts, setCounts] = useState<SimulationCounts>({
    inside: 0,
    total: 0,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(
      1,
      Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight))
    );
    if (canvas.width !== displaySize || canvas.height !== displaySize) {
      canvas.width = displaySize;
      canvas.height = displaySize;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
    }
    drawSimulation(canvas, simulationRef.current);
  }, []);

  const setIsRunning = useCallback((value: boolean) => {
    runningRef.current = value;
    setRunning(value);
  }, []);

  const resetSimulation = useCallback(
    (seed = simulationRef.current.seed) => {
      simulationRef.current = createMonteCarloPiSimulation(seed);
      setCounts({ inside: 0, total: 0 });
      setIsRunning(true);
      draw();
    },
    [draw, setIsRunning]
  );

  useEffect(() => {
    targetSamplesRef.current = targetSamples;
    if (simulationRef.current.points.length >= targetSamples) {
      resetSimulation();
    }
  }, [resetSimulation, targetSamples]);

  useEffect(() => {
    samplesPerFrameRef.current = samplesPerFrame;
  }, [samplesPerFrame]);

  useEffect(() => {
    draw();
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
    const loop = () => {
      const simulation = simulationRef.current;
      if (
        runningRef.current &&
        simulation.points.length < targetSamplesRef.current
      ) {
        addMonteCarloSamples(
          simulation,
          samplesPerFrameRef.current,
          targetSamplesRef.current
        );
        setCounts({
          inside: simulation.insideCount,
          total: simulation.points.length,
        });
        draw();

        if (simulation.points.length >= targetSamplesRef.current) {
          setIsRunning(false);
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw, setIsRunning]);

  const piEstimate = estimatePi(counts.inside, counts.total);
  const ratio = counts.total > 0 ? counts.inside / counts.total : 0;
  const progress = (counts.total / targetSamples) * 100;

  const downloadPng = () => {
    if (canvasRef.current) {
      downloadCanvasPng(canvasRef.current, "monte-carlo-pi.png");
    }
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar monte-carlo-pi-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Monte Carlo π</h2>
            </div>
            <div className="dragon-sidebar-panel monte-carlo-pi-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="monte-carlo-pi-target"
                  >
                    Total dots
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="monte-carlo-pi-target"
                      type="range"
                      min={MIN_TARGET_SAMPLES}
                      max={MAX_TARGET_SAMPLES}
                      step={1_000}
                      value={targetSamples}
                      onChange={(event) =>
                        setTargetSamples(
                          clampTargetSamples(Number(event.target.value))
                        )
                      }
                    />
                    <div className="monte-carlo-pi-value-readout">
                      {targetSamples.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel
                    className="section-label-muted viz-control-row-label"
                    htmlFor="monte-carlo-pi-rate"
                  >
                    Dots per frame
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="monte-carlo-pi-rate"
                      type="range"
                      min={MIN_SAMPLES_PER_FRAME}
                      max={MAX_SAMPLES_PER_FRAME}
                      step={10}
                      value={samplesPerFrame}
                      onChange={(event) =>
                        setSamplesPerFrame(
                          clampSamplesPerFrame(Number(event.target.value))
                        )
                      }
                    />
                    <div className="monte-carlo-pi-value-readout">
                      {samplesPerFrame.toLocaleString()}
                    </div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant={running ? "secondary" : "primary"}
                    onClick={() => setIsRunning(!running)}
                    disabled={counts.total >= targetSamples}
                  >
                    {running ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => resetSimulation(randomSeed())}
                  >
                    New experiment
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <div className="monte-carlo-pi-results">
                  <div className="monte-carlo-pi-result-row">
                    <span className="monte-carlo-pi-result-label">
                      Estimated π
                    </span>
                    <span className="monte-carlo-pi-result-value monte-carlo-pi-estimate">
                      {counts.total > 0 ? piEstimate.toFixed(6) : "—"}
                    </span>
                  </div>
                  <div className="monte-carlo-pi-result-row">
                    <span className="monte-carlo-pi-result-label">
                      Inside / total
                    </span>
                    <span className="monte-carlo-pi-result-value">
                      {counts.inside.toLocaleString()} /{" "}
                      {counts.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="monte-carlo-pi-result-row">
                    <span className="monte-carlo-pi-result-label">
                      Inside ratio
                    </span>
                    <span className="monte-carlo-pi-result-value">
                      {(ratio * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div className="monte-carlo-pi-result-row">
                    <span className="monte-carlo-pi-result-label">
                      Absolute error
                    </span>
                    <span className="monte-carlo-pi-result-value">
                      {counts.total > 0 ? estimateError(piEstimate).toFixed(6) : "—"}
                    </span>
                  </div>
                  <div className="monte-carlo-pi-progress-track">
                    <div
                      className="monte-carlo-pi-progress-fill"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                <p className="monte-carlo-pi-formula">
                  π ≈ 4 × inside dots ÷ total dots
                </p>
                <p className="monte-carlo-pi-hint">
                  The circle has one quarter of π times the square&apos;s
                  area. Random dots therefore land inside it with probability
                  π/4. Green dots are inside; red dots are outside.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="monte-carlo-pi-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="monte-carlo-pi-canvas"
            role="img"
            aria-label="Random dots estimating pi inside a circle and square"
          />
        </div>
      </div>
    </>
  );
}
