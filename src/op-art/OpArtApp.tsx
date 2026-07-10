import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampAngleOffset,
  clampCenterOffset,
  clampLineWidth,
  clampRotateSpeed,
  clampSpacing,
  clampSpacingDelta,
  DEFAULT_ANGLE_OFFSET,
  DEFAULT_CENTER_OFFSET,
  DEFAULT_LINE_WIDTH,
  DEFAULT_ROTATE_SPEED,
  DEFAULT_SPACING_A,
  DEFAULT_SPACING_DELTA,
  MAX_ANGLE_OFFSET,
  MAX_CENTER_OFFSET,
  MAX_LINE_WIDTH,
  MAX_ROTATE_SPEED,
  MAX_SPACING,
  MAX_SPACING_DELTA,
  MIN_ANGLE_OFFSET,
  MIN_CENTER_OFFSET,
  MIN_LINE_WIDTH,
  MIN_ROTATE_SPEED,
  MIN_SPACING,
  MIN_SPACING_DELTA,
  OP_ART_PATTERNS,
  OpArtPattern,
  renderOpArt,
} from "./opart";

export default function OpArtApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);

  const [pattern, setPattern] = useState<OpArtPattern>("line-grating");
  const [spacingA, setSpacingA] = useState(DEFAULT_SPACING_A);
  const [spacingDelta, setSpacingDelta] = useState(DEFAULT_SPACING_DELTA);
  const [angleOffsetDeg, setAngleOffsetDeg] = useState(DEFAULT_ANGLE_OFFSET);
  const [centerOffsetPx, setCenterOffsetPx] = useState(DEFAULT_CENTER_OFFSET);
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(DEFAULT_ROTATE_SPEED);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, wrap.clientWidth);
    const displayHeight = Math.max(1, wrap.clientHeight);
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    renderOpArt(ctx, {
      pattern,
      width: displayWidth,
      height: displayHeight,
      spacingA,
      spacingDelta,
      angleOffsetDeg,
      centerOffsetPx,
      lineWidth,
      rotationPhaseDeg: phaseRef.current,
    });
  }, [pattern, spacingA, spacingDelta, angleOffsetDeg, centerOffsetPx, lineWidth]);

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

  // Auto-rotate is an opt-in animation layered on top of the otherwise
  // static/parametric visualization: it only runs while enabled, and simply
  // advances the phase ref and re-invokes the same draw() used everywhere
  // else, rather than adopting the full animated-template shape.
  useEffect(() => {
    if (!autoRotate) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      phaseRef.current = (phaseRef.current + rotateSpeed * dt) % 360;
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [autoRotate, rotateSpeed, draw]);

  const resetView = () => {
    setPattern("line-grating");
    setSpacingA(DEFAULT_SPACING_A);
    setSpacingDelta(DEFAULT_SPACING_DELTA);
    setAngleOffsetDeg(DEFAULT_ANGLE_OFFSET);
    setCenterOffsetPx(DEFAULT_CENTER_OFFSET);
    setLineWidth(DEFAULT_LINE_WIDTH);
    setAutoRotate(false);
    setRotateSpeed(DEFAULT_ROTATE_SPEED);
    phaseRef.current = 0;
  };

  const showCenterOffset = pattern !== "line-grating";

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar op-art-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Op Art / Moiré</h2>
            </div>
            <div className="dragon-sidebar-panel op-art-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="op-art-pattern">
                    Pattern style
                  </FormLabel>
                  <FormControl
                    id="op-art-pattern"
                    as="select"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value as OpArtPattern)}
                  >
                    {OP_ART_PATTERNS.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </FormControl>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="op-art-spacing">
                    Layer A spacing
                  </FormLabel>
                  <FormControl
                    id="op-art-spacing"
                    type="range"
                    min={MIN_SPACING}
                    max={MAX_SPACING}
                    step={1}
                    value={spacingA}
                    onChange={(e) => setSpacingA(clampSpacing(Number(e.target.value)))}
                  />
                  <div className="op-art-value-readout">{spacingA}px</div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="op-art-spacing-delta">
                    Spacing delta (layer B)
                  </FormLabel>
                  <FormControl
                    id="op-art-spacing-delta"
                    type="range"
                    min={MIN_SPACING_DELTA}
                    max={MAX_SPACING_DELTA}
                    step={0.5}
                    value={spacingDelta}
                    onChange={(e) =>
                      setSpacingDelta(clampSpacingDelta(Number(e.target.value)))
                    }
                  />
                  <div className="op-art-value-readout">
                    {spacingDelta > 0 ? "+" : ""}
                    {spacingDelta.toFixed(1)}px
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label-muted" htmlFor="op-art-angle-offset">
                    Angle offset (layer B)
                  </FormLabel>
                  <FormControl
                    id="op-art-angle-offset"
                    type="range"
                    min={MIN_ANGLE_OFFSET}
                    max={MAX_ANGLE_OFFSET}
                    step={1}
                    value={angleOffsetDeg}
                    onChange={(e) =>
                      setAngleOffsetDeg(clampAngleOffset(Number(e.target.value)))
                    }
                  />
                  <div className="op-art-value-readout">{angleOffsetDeg}°</div>
                </div>

                {showCenterOffset ? (
                  <div>
                    <FormLabel
                      className="section-label-muted"
                      htmlFor="op-art-center-offset"
                    >
                      Center offset (layer B)
                    </FormLabel>
                    <FormControl
                      id="op-art-center-offset"
                      type="range"
                      min={MIN_CENTER_OFFSET}
                      max={MAX_CENTER_OFFSET}
                      step={1}
                      value={centerOffsetPx}
                      onChange={(e) =>
                        setCenterOffsetPx(clampCenterOffset(Number(e.target.value)))
                      }
                    />
                    <div className="op-art-value-readout">{centerOffsetPx}px</div>
                  </div>
                ) : null}

                <div>
                  <FormLabel className="section-label-muted" htmlFor="op-art-line-width">
                    Line thickness
                  </FormLabel>
                  <FormControl
                    id="op-art-line-width"
                    type="range"
                    min={MIN_LINE_WIDTH}
                    max={MAX_LINE_WIDTH}
                    step={0.5}
                    value={lineWidth}
                    onChange={(e) =>
                      setLineWidth(clampLineWidth(Number(e.target.value)))
                    }
                  />
                  <div className="op-art-value-readout">{lineWidth}px</div>
                </div>

                <FormCheck
                  id="op-art-auto-rotate"
                  type="checkbox"
                  label="Auto-rotate layer A"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                />

                {autoRotate ? (
                  <div>
                    <FormLabel
                      className="section-label-muted"
                      htmlFor="op-art-rotate-speed"
                    >
                      Rotate speed
                    </FormLabel>
                    <FormControl
                      id="op-art-rotate-speed"
                      type="range"
                      min={MIN_ROTATE_SPEED}
                      max={MAX_ROTATE_SPEED}
                      step={1}
                      value={rotateSpeed}
                      onChange={(e) =>
                        setRotateSpeed(clampRotateSpeed(Number(e.target.value)))
                      }
                    />
                    <div className="op-art-value-readout">{rotateSpeed}°/s</div>
                  </div>
                ) : null}

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="op-art-hint">
                  Two nearly identical geometric layers, one nudged slightly in
                  spacing, angle, or center, interfere to produce the shifting
                  bands and shimmer of classic Op Art — the same illusion
                  behind Bridget Riley and Victor Vasarely's work.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="op-art-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="op-art-canvas"
            role="img"
            aria-label="Overlapping geometric layers producing a moiré interference pattern"
          />
        </div>
      </div>
    </>
  );
}
