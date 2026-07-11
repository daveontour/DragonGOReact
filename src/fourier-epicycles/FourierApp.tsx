import { useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampFourierSpeed,
  clampHarmonics,
  computeDFT,
  Complex,
  DEFAULT_FOURIER_SAMPLES,
  DEFAULT_FOURIER_SPEED,
  epicycleChainPositions,
  Epicycle,
  FOURIER_PRESETS,
  FourierPresetId,
  generatePresetPath,
  MAX_FOURIER_SPEED,
  MIN_FOURIER_HARMONICS,
  MIN_FOURIER_SPEED,
} from "./fourier";

export default function FourierApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tRef = useRef(0);
  const trailRef = useRef<Complex[]>([]);
  const speedRef = useRef(DEFAULT_FOURIER_SPEED);
  const harmonicsRef = useRef(30);

  const [presetId, setPresetId] = useState<FourierPresetId>("star");
  const [harmonics, setHarmonics] = useState(30);
  const [speed, setSpeed] = useState(DEFAULT_FOURIER_SPEED);
  const [showCircles, setShowCircles] = useState(true);

  const epicycles: Epicycle[] = useMemo(() => {
    const path = generatePresetPath(presetId, DEFAULT_FOURIER_SAMPLES);
    return computeDFT(path);
  }, [presetId]);

  useEffect(() => {
    tRef.current = 0;
    trailRef.current = [];
    const clamped = clampHarmonics(harmonics, epicycles.length);
    setHarmonics(clamped);
  }, [epicycles]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    harmonicsRef.current = harmonics;
  }, [harmonics]);

  useEffect(() => {
    let frameId = 0;
    const dt = (Math.PI * 2) / 240;

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

      const prevT = tRef.current;
      tRef.current += dt * speedRef.current;
      if (tRef.current >= Math.PI * 2) {
        tRef.current -= Math.PI * 2;
        trailRef.current = [];
      } else if (tRef.current < prevT) {
        trailRef.current = [];
      }

      const chain = epicycleChainPositions(
        epicycles,
        harmonicsRef.current,
        tRef.current
      );
      const tip = chain[chain.length - 1];
      trailRef.current.push(tip);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#080a12";
        ctx.fillRect(0, 0, width, height);

        const scale = Math.min(width, height) * 0.28;
        const originX = width * 0.32;
        const originY = height / 2;
        const toScreen = (p: Complex) => ({
          x: originX + p.re * scale,
          y: originY + p.im * scale,
        });

        if (showCircles) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = 1;
          for (let i = 0; i < chain.length - 1; i++) {
            const center = toScreen(chain[i]);
            const edge = toScreen(chain[i + 1]);
            const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.strokeStyle = "rgba(127, 212, 255, 0.6)";
          ctx.beginPath();
          const first = toScreen(chain[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < chain.length; i++) {
            const p = toScreen(chain[i]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        const trailStartX = width * 0.68;
        const trail = trailRef.current;
        if (trail.length > 1) {
          ctx.strokeStyle = "#f6d860";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const firstPoint = trail[0];
          ctx.moveTo(
            trailStartX + firstPoint.re * scale,
            originY + firstPoint.im * scale
          );
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(
              trailStartX + trail[i].re * scale,
              originY + trail[i].im * scale
            );
          }
          ctx.stroke();
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(toScreen(tip).x, toScreen(tip).y);
        ctx.lineTo(
          trailStartX + tip.re * scale,
          originY + tip.im * scale
        );
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(toScreen(tip).x, toScreen(tip).y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          trailStartX + tip.re * scale,
          originY + tip.im * scale,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [epicycles, showCircles]);


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `fourier-epicycles.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar fourier-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Fourier Epicycles</h2>
            </div>
            <div className="dragon-sidebar-panel fourier-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="fourier-preset">
                    Shape
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="fourier-preset"
                      as="select"
                      value={presetId}
                      onChange={(e) => setPresetId(e.target.value as FourierPresetId)}
                    >
                      {Object.values(FOURIER_PRESETS).map((p) => (
                      <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="fourier-harmonics">
                    Harmonics (circles)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="fourier-harmonics"
                      type="range"
                      min={MIN_FOURIER_HARMONICS}
                      max={epicycles.length}
                      step={1}
                      value={harmonics}
                      onChange={(e) =>
                        setHarmonics(
                          clampHarmonics(Number(e.target.value), epicycles.length)
                        )
                      }
                    />
                    <div className="fourier-value-readout">
                      {harmonics} / {epicycles.length}
                                      </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="fourier-speed">
                    Speed
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="fourier-speed"
                      type="range"
                      min={MIN_FOURIER_SPEED}
                      max={MAX_FOURIER_SPEED}
                      step={0.1}
                      value={speed}
                      onChange={(e) => setSpeed(clampFourierSpeed(Number(e.target.value)))}
                    />
                    <div className="fourier-value-readout">{speed.toFixed(1)}×</div>
                  </div>
                </div>

                <FormCheck
                  id="fourier-circles"
                  type="checkbox"
                  label="Show rotating circles"
                  checked={showCircles}
                  onChange={(e) => setShowCircles(e.target.checked)}
                />

                <Button variant="secondary" onClick={downloadPng}>
                  Download PNG
                </Button>


                <p className="fourier-hint">
                  Every closed shape can be written as a sum of rotating
                  circles (a Fourier series). Each circle spins at its own
                  frequency; adding their tips together traces the original
                  shape on the right.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="fourier-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="fourier-canvas"
            role="img"
            aria-label="Fourier epicycles tracing a shape"
          />
        </div>
      </div>
    </>
  );
}
