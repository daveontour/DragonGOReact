import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampAnimateSpeed,
  clampEccentricity,
  clampPenOffset,
  clampR,
  clampSmallR,
  DEFAULT_ANIMATE_SPEED,
  DEFAULT_ECCENTRICITY,
  DEFAULT_PEN_OFFSET_RATIO,
  DEFAULT_R,
  DEFAULT_SMALL_R,
  drawSpirograph,
  generateSpirographPoints,
  MAX_ANIMATE_SPEED,
  MAX_ECCENTRICITY,
  MAX_R,
  MAX_SMALL_R,
  MIN_ANIMATE_SPEED,
  MIN_ECCENTRICITY,
  MIN_R,
  MIN_SMALL_R,
  SpirographColorMode,
  SpirographMode,
} from "./spirograph";

const BASE_ANIMATE_DURATION_SECONDS = 5;

export default function SpirographApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(0);

  const [mode, setMode] = useState<SpirographMode>("hypotrochoid");
  const [R, setR] = useState(DEFAULT_R);
  const [r, setSmallR] = useState(DEFAULT_SMALL_R);
  const [d, setD] = useState(DEFAULT_SMALL_R * DEFAULT_PEN_OFFSET_RATIO);
  const [eRing, setERing] = useState(DEFAULT_ECCENTRICITY);
  const [eWheel, setEWheel] = useState(DEFAULT_ECCENTRICITY);
  const [lineWidth, setLineWidth] = useState(1.5);
  const [colorMode, setColorMode] = useState<SpirographColorMode>("mono");
  const [showConstruction, setShowConstruction] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [animateSpeed, setAnimateSpeed] = useState(DEFAULT_ANIMATE_SPEED);

  const points = useMemo(
    () => generateSpirographPoints(mode, R, r, d, eRing, eWheel),
    [mode, R, r, d, eRing, eWheel]
  );

  const maxExtent = mode === "hypotrochoid" ? R - r + d : R + r + d;

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

    const scale = (displaySize / 2) * 0.88 / Math.max(1, maxExtent);
    const revealCount = animate ? Math.floor(revealRef.current) : points.length;

    drawSpirograph(
      ctx,
      displaySize,
      points,
      scale,
      lineWidth,
      colorMode,
      showConstruction,
      R,
      r,
      revealCount,
      eRing,
      eWheel
    );
  }, [
    points,
    maxExtent,
    lineWidth,
    colorMode,
    showConstruction,
    R,
    r,
    animate,
    eRing,
    eWheel,
  ]);

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

  // Animate drawing is an opt-in reveal layered on top of the otherwise
  // static render, the same pattern as Op Art's auto-rotate / Phyllotaxis's
  // animate-angle: only runs while enabled, re-invokes the same draw().
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
      const perSecond =
        (points.length / BASE_ANIMATE_DURATION_SECONDS) * animateSpeed;
      revealRef.current += perSecond * dt;
      if (revealRef.current > points.length) {
        revealRef.current = 0;
      }
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [animate, animateSpeed, points.length, draw]);

  const resetView = () => {
    setMode("hypotrochoid");
    setR(DEFAULT_R);
    setSmallR(DEFAULT_SMALL_R);
    setD(DEFAULT_SMALL_R * DEFAULT_PEN_OFFSET_RATIO);
    setERing(DEFAULT_ECCENTRICITY);
    setEWheel(DEFAULT_ECCENTRICITY);
    setLineWidth(1.5);
    setColorMode("mono");
    setShowConstruction(false);
    setAnimate(false);
    setAnimateSpeed(DEFAULT_ANIMATE_SPEED);
  };

  const handleModeChange = (nextMode: SpirographMode) => {
    setMode(nextMode);
    setSmallR((current) => clampSmallR(current, R, nextMode));
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar spirograph-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Spirograph</h2>
            </div>
            <div className="dragon-sidebar-panel spirograph-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-mode">
                    Mode
                  </FormLabel>
                  <FormControl
                    id="spirograph-mode"
                    as="select"
                    value={mode}
                    onChange={(e) => handleModeChange(e.target.value as SpirographMode)}
                  >
                    <option value="hypotrochoid">Hypotrochoid (pen inside ring)</option>
                    <option value="epitrochoid">Epitrochoid (pen outside ring)</option>
                  </FormControl>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-R">
                    Ring radius (R)
                  </FormLabel>
                  <FormControl
                    id="spirograph-R"
                    type="range"
                    min={MIN_R}
                    max={MAX_R}
                    step={1}
                    value={R}
                    onChange={(e) => {
                      const nextR = clampR(Number(e.target.value));
                      setR(nextR);
                      setSmallR((current) => clampSmallR(current, nextR, mode));
                    }}
                  />
                  <div className="spirograph-value-readout">{R}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-r">
                    Wheel radius (r)
                  </FormLabel>
                  <FormControl
                    id="spirograph-r"
                    type="range"
                    min={MIN_SMALL_R}
                    max={MAX_SMALL_R}
                    step={1}
                    value={r}
                    onChange={(e) =>
                      setSmallR(clampSmallR(Number(e.target.value), R, mode))
                    }
                  />
                  <div className="spirograph-value-readout">{r}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-d">
                    Pen offset (d)
                  </FormLabel>
                  <FormControl
                    id="spirograph-d"
                    type="range"
                    min={0}
                    max={r * 1.5}
                    step={0.5}
                    value={d}
                    onChange={(e) => setD(clampPenOffset(Number(e.target.value), r))}
                  />
                  <div className="spirograph-value-readout">{d.toFixed(1)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-e-ring">
                    Ring eccentricity
                  </FormLabel>
                  <FormControl
                    id="spirograph-e-ring"
                    type="range"
                    min={MIN_ECCENTRICITY}
                    max={MAX_ECCENTRICITY}
                    step={0.01}
                    value={eRing}
                    onChange={(e) => setERing(clampEccentricity(Number(e.target.value)))}
                  />
                  <div className="spirograph-value-readout">{eRing.toFixed(2)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-e-wheel">
                    Wheel eccentricity
                  </FormLabel>
                  <FormControl
                    id="spirograph-e-wheel"
                    type="range"
                    min={MIN_ECCENTRICITY}
                    max={MAX_ECCENTRICITY}
                    step={0.01}
                    value={eWheel}
                    onChange={(e) => setEWheel(clampEccentricity(Number(e.target.value)))}
                  />
                  <div className="spirograph-value-readout">{eWheel.toFixed(2)}</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-width">
                    Line thickness
                  </FormLabel>
                  <FormControl
                    id="spirograph-width"
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.5}
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                  />
                  <div className="spirograph-value-readout">{lineWidth}px</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="spirograph-color">
                    Color mode
                  </FormLabel>
                  <FormControl
                    id="spirograph-color"
                    as="select"
                    value={colorMode}
                    onChange={(e) =>
                      setColorMode(e.target.value as SpirographColorMode)
                    }
                  >
                    <option value="mono">Single color</option>
                    <option value="rainbow">Rainbow along curve</option>
                  </FormControl>
                </div>

                <FormCheck
                  id="spirograph-construction"
                  type="checkbox"
                  label="Show construction circles"
                  checked={showConstruction}
                  onChange={(e) => setShowConstruction(e.target.checked)}
                />

                <FormCheck
                  id="spirograph-animate"
                  type="checkbox"
                  label="Animate drawing"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                />

                {animate ? (
                  <div>
                    <FormLabel
                      className="section-label-muted"
                      htmlFor="spirograph-animate-speed"
                    >
                      Animate speed
                    </FormLabel>
                    <FormControl
                      id="spirograph-animate-speed"
                      type="range"
                      min={MIN_ANIMATE_SPEED}
                      max={MAX_ANIMATE_SPEED}
                      step={0.25}
                      value={animateSpeed}
                      onChange={(e) =>
                        setAnimateSpeed(clampAnimateSpeed(Number(e.target.value)))
                      }
                    />
                    <div className="spirograph-value-readout">
                      {animateSpeed.toFixed(2)}×
                    </div>
                  </div>
                ) : null}

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="spirograph-hint">
                  A pen offset by distance d from the center of a wheel of
                  radius r traces this curve as the wheel rolls without
                  slipping around the inside (hypotrochoid) or outside
                  (epitrochoid) of a fixed ring of radius R — exactly the
                  mechanism behind the classic Spirograph toy. The curve
                  closes once the wheel completes r⁄gcd(R,r) full trips
                  around the ring; coprime R and r produce the most
                  intricate, densest patterns. Ring and wheel eccentricity
                  squash each one from a circle into an ellipse — 0 is a
                  perfect circle (the classic look), and higher values flatten
                  the ring's overall sweep or the wheel's fine looping detail.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="spirograph-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="spirograph-canvas"
            role="img"
            aria-label="Spirograph hypotrochoid or epitrochoid curve"
          />
        </div>
      </div>
    </>
  );
}
