import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampExponent,
  clampM,
  DEFAULT_M,
  DEFAULT_N1,
  DEFAULT_N2,
  DEFAULT_N3,
  drawSuperformula,
  generateSuperformulaPoints,
  MAX_M,
  MAX_N,
  MIN_M,
  MIN_N,
  randomSuperformulaParams,
  SuperformulaColorMode,
  SUPERFORMULA_PRESETS,
} from "./superformula";

const ANIMATE_DURATION_SECONDS = 4;

export default function SuperformulaApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [m, setM] = useState(DEFAULT_M);
  const [n1, setN1] = useState(DEFAULT_N1);
  const [n2, setN2] = useState(DEFAULT_N2);
  const [n3, setN3] = useState(DEFAULT_N3);
  const [filled, setFilled] = useState(false);
  const [lineWidth, setLineWidth] = useState(2);
  const [colorMode, setColorMode] = useState<SuperformulaColorMode>("mono");
  const [animate, setAnimate] = useState(false);

  const points = useMemo(
    () => generateSuperformulaPoints(m, n1, n2, n3),
    [m, n1, n2, n3]
  );

  const maxRadius = useMemo(
    () => Math.max(1e-6, ...points.map((p) => Math.hypot(p.x, p.y))),
    [points]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displaySize = Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
    canvas.width = displaySize;
    canvas.height = displaySize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const scale = ((displaySize / 2) * 0.85) / maxRadius;
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawSuperformula(
      ctx,
      displaySize,
      points,
      scale,
      lineWidth,
      colorMode,
      filled,
      revealCount
    );
  }, [points, maxRadius, lineWidth, colorMode, filled, animate]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => draw());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!animate) {
      return;
    }
    revealRef.current = 0;
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const perSecond = points.length / ANIMATE_DURATION_SECONDS;
      revealRef.current += perSecond * dt;
      if (revealRef.current > points.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, points.length, draw]);

  const resetView = () => {
    setM(DEFAULT_M);
    setN1(DEFAULT_N1);
    setN2(DEFAULT_N2);
    setN3(DEFAULT_N3);
    setFilled(false);
    setLineWidth(2);
    setColorMode("mono");
    setAnimate(false);
  };

  const applyPreset = (id: string) => {
    const preset = SUPERFORMULA_PRESETS.find((p) => p.id === id);
    if (preset) {
      setM(preset.m);
      setN1(preset.n1);
      setN2(preset.n2);
      setN3(preset.n3);
    }
  };

  const randomize = () => {
    const params = randomSuperformulaParams();
    setM(params.m);
    setN1(params.n1);
    setN2(params.n2);
    setN3(params.n3);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar superformula-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Superformula</h2>
            </div>
            <div className="dragon-sidebar-panel superformula-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-preset">
                    Quick preset
                  </FormLabel>
                  <FormControl
                    id="superformula-preset"
                    as="select"
                    value=""
                    onChange={(e) => applyPreset(e.target.value)}
                  >
                    <option value="" disabled>
                      Choose a preset…
                    </option>
                    {SUPERFORMULA_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </FormControl>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-m">
                    Symmetry (m)
                  </FormLabel>
                  <FormControl
                    id="superformula-m"
                    type="range"
                    min={MIN_M}
                    max={MAX_M}
                    step={1}
                    value={m}
                    onChange={(e) => setM(clampM(Number(e.target.value)))}
                  />
                  <div className="superformula-value-readout">{m}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-n1">
                    n1
                  </FormLabel>
                  <FormControl
                    id="superformula-n1"
                    type="range"
                    min={MIN_N}
                    max={MAX_N}
                    step={0.1}
                    value={n1}
                    onChange={(e) => setN1(clampExponent(Number(e.target.value)))}
                  />
                  <div className="superformula-value-readout">{n1.toFixed(1)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-n2">
                    n2
                  </FormLabel>
                  <FormControl
                    id="superformula-n2"
                    type="range"
                    min={MIN_N}
                    max={MAX_N}
                    step={0.1}
                    value={n2}
                    onChange={(e) => setN2(clampExponent(Number(e.target.value)))}
                  />
                  <div className="superformula-value-readout">{n2.toFixed(1)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-n3">
                    n3
                  </FormLabel>
                  <FormControl
                    id="superformula-n3"
                    type="range"
                    min={MIN_N}
                    max={MAX_N}
                    step={0.1}
                    value={n3}
                    onChange={(e) => setN3(clampExponent(Number(e.target.value)))}
                  />
                  <div className="superformula-value-readout">{n3.toFixed(1)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="superformula-color">
                    Color mode
                  </FormLabel>
                  <FormControl
                    id="superformula-color"
                    as="select"
                    value={colorMode}
                    onChange={(e) =>
                      setColorMode(e.target.value as SuperformulaColorMode)
                    }
                  >
                    <option value="mono">Single color</option>
                    <option value="rainbow">Rainbow along curve</option>
                  </FormControl>
                </div>

                <FormCheck
                  id="superformula-filled"
                  type="checkbox"
                  label="Filled"
                  checked={filled}
                  onChange={(e) => setFilled(e.target.checked)}
                />

                <FormCheck
                  id="superformula-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={randomize}>
                    Randomize
                  </Button>
                  <Button variant="secondary" onClick={resetView}>
                    Reset
                  </Button>
                </Stack>

                <p className="superformula-hint">
                  Johan Gielis's single polar formula generalizes circles,
                  polygons, stars, and organic leaf and flower outlines with
                  just four exponents (m, n1, n2, n3): m sets the rotational
                  symmetry, while n1, n2, n3 sculpt how sharply the outline
                  pinches in between the m 'lobes'. Small changes to any
                  exponent can swing the same formula between a plain
                  circle, a starfish, and a snowflake.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="superformula-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="superformula-canvas"
            role="img"
            aria-label="Superformula generalized polar shape"
          />
        </div>
      </div>
    </>
  );
}
