import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  ATTRACTOR_PRESETS,
  AttractorId,
  clampLorenzRho,
  clampMapIterations,
  clampRosslerC,
  cliffordStep,
  deJongStep,
  DEFAULT_CLIFFORD_PARAMS,
  DEFAULT_DE_JONG_PARAMS,
  DEFAULT_LORENZ_PARAMS,
  DEFAULT_MAP_ITERATIONS,
  DEFAULT_ROSSLER_PARAMS,
  lorenzStep,
  MapParams,
  MAX_LORENZ_RHO,
  MAX_MAP_ITERATIONS,
  MAX_ROSSLER_C,
  MIN_LORENZ_RHO,
  MIN_MAP_ITERATIONS,
  MIN_ROSSLER_C,
  randomMapParams,
  renderAttractorDensity,
  rosslerStep,
  Vec3,
} from "../attractors/attractors";

const TRAIL_LENGTH = 6000;
const SUB_STEPS_PER_FRAME = 6;
const FLOW_COLORS: Record<string, string> = {
  lorenz: "#7fd4ff",
  rossler: "#f6a86a",
};
const MAP_COLORS: Record<string, [number, number, number]> = {
  clifford: [127, 224, 255],
  "de-jong": [200, 146, 234],
};

export default function AttractorApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<Vec3>({ x: 0.1, y: 1, z: 1.05 });
  const trailRef = useRef<Vec3[]>([]);

  const [presetId, setPresetId] = useState<AttractorId>("lorenz");
  const [rho, setRho] = useState(DEFAULT_LORENZ_PARAMS.rho);
  const [rosslerC, setRosslerC] = useState(DEFAULT_ROSSLER_PARAMS.c);
  const [cliffordParams, setCliffordParams] = useState<MapParams>(
    DEFAULT_CLIFFORD_PARAMS
  );
  const [deJongParams, setDeJongParams] = useState<MapParams>(
    DEFAULT_DE_JONG_PARAMS
  );
  const [iterations, setIterations] = useState(DEFAULT_MAP_ITERATIONS);
  const [rendering, setRendering] = useState(false);
  const [steps, setSteps] = useState(0);

  const preset = ATTRACTOR_PRESETS[presetId];
  const mapParams = presetId === "clifford" ? cliffordParams : deJongParams;
  const setMapParams = presetId === "clifford" ? setCliffordParams : setDeJongParams;
  const mapStepFn = presetId === "clifford" ? cliffordStep : deJongStep;

  useEffect(() => {
    stateRef.current = { x: 0.1, y: 1, z: 1.05 };
    trailRef.current = [];
    setSteps(0);
  }, [presetId]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const width = Math.max(1, Math.floor(wrap.clientWidth));
    const height = Math.max(1, Math.floor(wrap.clientHeight));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    setRendering(true);
    const imageData = ctx.createImageData(width, height);
    renderAttractorDensity(
      imageData,
      mapStepFn,
      mapParams,
      iterations,
      MAP_COLORS[presetId]
    );
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [iterations, mapParams, mapStepFn, presetId]);

  useEffect(() => {
    if (preset.kind === "map") {
      drawMap();
    }
  }, [preset.kind, drawMap]);

  useEffect(() => {
    if (preset.kind !== "map") {
      return;
    }
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => drawMap());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [preset.kind, drawMap]);

  useEffect(() => {
    if (preset.kind !== "flow") {
      return;
    }
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

      for (let i = 0; i < SUB_STEPS_PER_FRAME; i++) {
        if (presetId === "lorenz") {
          stateRef.current = lorenzStep(
            stateRef.current,
            { ...DEFAULT_LORENZ_PARAMS, rho },
            0.006
          );
        } else {
          stateRef.current = rosslerStep(
            stateRef.current,
            { ...DEFAULT_ROSSLER_PARAMS, c: rosslerC },
            0.02
          );
        }
        trailRef.current.push({ ...stateRef.current });
        if (trailRef.current.length > TRAIL_LENGTH) {
          trailRef.current.shift();
        }
      }
      setSteps((s) => s + SUB_STEPS_PER_FRAME);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#080a12";
        ctx.fillRect(0, 0, width, height);

        const scale = presetId === "lorenz" ? Math.min(width, height) / 55 : Math.min(width, height) / 24;
        const cx = width / 2;
        const cy = presetId === "lorenz" ? height * 0.85 : height / 2;

        const project = (p: Vec3) =>
          presetId === "lorenz"
            ? { x: cx + p.x * scale, y: cy - p.z * scale }
            : { x: cx + p.x * scale, y: cy - p.y * scale };

        const trail = trailRef.current;
        const color = FLOW_COLORS[presetId];
        ctx.lineWidth = 1;
        for (let i = 1; i < trail.length; i++) {
          const a = project(trail[i - 1]);
          const b = project(trail[i]);
          ctx.globalAlpha = Math.max(0.03, i / trail.length) * 0.8;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (trail.length > 0) {
          const head = project(trail[trail.length - 1]);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [preset.kind, presetId, rho, rosslerC]);

  const randomizeMap = () => {
    setMapParams(randomMapParams());
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar attractor-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Strange Attractors</h2>
            </div>
            <div className="dragon-sidebar-panel attractor-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="attractor-preset">
                    Attractor
                  </FormLabel>
                  <FormControl
                    id="attractor-preset"
                    as="select"
                    value={presetId}
                    onChange={(e) => setPresetId(e.target.value as AttractorId)}
                  >
                    {Object.values(ATTRACTOR_PRESETS).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </FormControl>
                </div>

                {presetId === "lorenz" ? (
                  <div>
                    <FormLabel className="section-label-muted" htmlFor="attractor-rho">
                      Rayleigh number (ρ)
                    </FormLabel>
                    <FormControl
                      id="attractor-rho"
                      type="range"
                      min={MIN_LORENZ_RHO}
                      max={MAX_LORENZ_RHO}
                      step={0.5}
                      value={rho}
                      onChange={(e) => setRho(clampLorenzRho(Number(e.target.value)))}
                    />
                    <div className="attractor-value-readout">{rho.toFixed(1)}</div>
                  </div>
                ) : null}

                {presetId === "rossler" ? (
                  <div>
                    <FormLabel className="section-label-muted" htmlFor="attractor-c">
                      Fold parameter (c)
                    </FormLabel>
                    <FormControl
                      id="attractor-c"
                      type="range"
                      min={MIN_ROSSLER_C}
                      max={MAX_ROSSLER_C}
                      step={0.1}
                      value={rosslerC}
                      onChange={(e) => setRosslerC(clampRosslerC(Number(e.target.value)))}
                    />
                    <div className="attractor-value-readout">{rosslerC.toFixed(1)}</div>
                  </div>
                ) : null}

                {preset.kind === "map" ? (
                  <>
                    {(["a", "b", "c", "d"] as const).map((key) => (
                      <div key={key}>
                        <FormLabel className="section-label-muted" htmlFor={`attractor-${key}`}>
                          Parameter {key}
                        </FormLabel>
                        <FormControl
                          id={`attractor-${key}`}
                          type="range"
                          min={-3}
                          max={3}
                          step={0.01}
                          value={mapParams[key]}
                          onChange={(e) =>
                            setMapParams({
                              ...mapParams,
                              [key]: Number(e.target.value),
                            })
                          }
                        />
                        <div className="attractor-value-readout">
                          {mapParams[key].toFixed(2)}
                        </div>
                      </div>
                    ))}

                    <div>
                      <FormLabel className="section-label-muted" htmlFor="attractor-iterations">
                        Iterations
                      </FormLabel>
                      <FormControl
                        id="attractor-iterations"
                        type="range"
                        min={MIN_MAP_ITERATIONS}
                        max={MAX_MAP_ITERATIONS}
                        step={10000}
                        value={iterations}
                        onChange={(e) =>
                          setIterations(clampMapIterations(Number(e.target.value)))
                        }
                      />
                      <div className="attractor-value-readout">
                        {iterations.toLocaleString("en-US")}
                      </div>
                    </div>

                    <Button variant="secondary" onClick={randomizeMap}>
                      Randomize parameters
                    </Button>
                    {rendering ? (
                      <p className="attractor-hint">Rendering…</p>
                    ) : null}
                  </>
                ) : (
                  <div className="attractor-results">
                    <div className="attractor-result-row">
                      <span className="attractor-result-label">Integration steps</span>
                      <span className="attractor-result-value">
                        {steps.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>
                )}

                <p className="attractor-hint">{preset.description}</p>
                <p className="attractor-hint">
                  {preset.kind === "flow"
                    ? "A single point is integrated forward through the system's differential equations; its recent path is drawn as a fading trail."
                    : "A single point is iterated millions of times through the map; each visited pixel brightens, revealing the attractor's shape as a density cloud."}
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="attractor-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="attractor-canvas"
            role="img"
            aria-label={`${preset.name} visualization`}
          />
        </div>
      </div>
    </>
  );
}
