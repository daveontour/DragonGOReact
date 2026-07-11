import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  buildLSystemSegments,
  clampLSystemIterations,
  fitSegmentsToViewport,
  LSYSTEM_PRESETS,
  LSystemPresetId,
} from "./lsystems";

const PRESET_COLORS: Record<LSystemPresetId, string> = {
  "koch-snowflake": "#7fd4ff",
  "sierpinski-triangle": "#f6a86a",
  "sierpinski-arrowhead": "#c792ea",
  "dragon-curve": "#7dcea0",
  "fractal-plant": "#8fd97a",
  "hilbert-curve": "#f6d860",
};

export default function LSystemApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [presetId, setPresetId] = useState<LSystemPresetId>("koch-snowflake");
  const [iterations, setIterations] = useState(
    LSYSTEM_PRESETS["koch-snowflake"].defaultIterations
  );
  const [segmentCount, setSegmentCount] = useState(0);

  const preset = LSYSTEM_PRESETS[presetId];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const width = Math.max(1, Math.floor(wrap.clientWidth));
    const height = Math.max(1, Math.floor(wrap.clientHeight));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0a0d18";
    ctx.fillRect(0, 0, width, height);

    const segments = buildLSystemSegments(presetId, iterations);
    setSegmentCount(segments.length);
    const fitted = fitSegmentsToViewport(segments, width, height, 24);

    ctx.strokeStyle = PRESET_COLORS[presetId];
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const seg of fitted) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();
  }, [presetId, iterations]);

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

  const handlePresetChange = (id: LSystemPresetId) => {
    setPresetId(id);
    setIterations(LSYSTEM_PRESETS[id].defaultIterations);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `l-systems.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar lsystem-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">L-Systems</h2>
            </div>
            <div className="dragon-sidebar-panel lsystem-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lsystem-preset">
                    Fractal
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lsystem-preset"
                      as="select"
                      value={presetId}
                      onChange={(e) =>
                        handlePresetChange(e.target.value as LSystemPresetId)
                      }
                    >
                      {Object.values(LSYSTEM_PRESETS).map((p) => (
                      <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="lsystem-iterations">
                    Iterations
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="lsystem-iterations"
                      type="range"
                      min={0}
                      max={preset.maxIterations}
                      step={1}
                      value={iterations}
                      onChange={(e) =>
                        setIterations(
                          clampLSystemIterations(presetId, Number(e.target.value))
                        )
                      }
                    />
                    <div className="lsystem-value-readout">
                      {iterations} / {preset.maxIterations}
                                      </div>
                  </div>
                </div>

                <div className="lsystem-results">
                  <div className="lsystem-result-row">
                    <span className="lsystem-result-label">Turn angle</span>
                    <span className="lsystem-result-value">{preset.angle}°</span>
                  </div>
                  <div className="lsystem-result-row">
                    <span className="lsystem-result-label">Segments drawn</span>
                    <span className="lsystem-result-value">
                      {segmentCount.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                <Button variant="secondary" onClick={downloadPng}>
                  Download PNG
                </Button>


                <p className="lsystem-hint">{preset.description}</p>
                <p className="lsystem-hint">
                  Each iteration rewrites every symbol in the current string
                  using the fractal&apos;s rules, then a turtle draws the
                  result: move forward, turn, or push/pop position on a stack.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="lsystem-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="lsystem-canvas"
            role="img"
            aria-label={`${preset.name} rendered by an L-system turtle`}
          />
        </div>
      </div>
    </>
  );
}
