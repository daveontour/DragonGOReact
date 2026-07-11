import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampLineWidth,
  clampSymmetry,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SYMMETRY,
  drawSegmentWithSymmetry,
  MAX_LINE_WIDTH,
  MAX_SYMMETRY,
  MIN_LINE_WIDTH,
  MIN_SYMMETRY,
  replayStrokes,
  StrokeSegment,
} from "./kaleidoscope";

export default function KaleidoscopeApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef<StrokeSegment[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [symmetry, setSymmetry] = useState(DEFAULT_SYMMETRY);
  const [mirror, setMirror] = useState(true);
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const [color, setColor] = useState("#7fd4ff");

  const center = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { cx: 0, cy: 0 };
    }
    return { cx: canvas.width / 2, cy: canvas.height / 2 };
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const { cx, cy } = center();
    replayStrokes(ctx, displayWidth, displayHeight, strokesRef.current, cx, cy, symmetry, mirror);
  }, [center, symmetry, mirror]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }
    const observer = new ResizeObserver(() => redrawAll());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [redrawAll]);

  const pointerToPixel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    lastPointRef.current = pointerToPixel(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const point = pointerToPixel(event);
    const seg: StrokeSegment = {
      x1: lastPointRef.current.x,
      y1: lastPointRef.current.y,
      x2: point.x,
      y2: point.y,
      color,
      width: lineWidth,
    };
    strokesRef.current.push(seg);
    const { cx, cy } = center();
    drawSegmentWithSymmetry(ctx, seg, cx, cy, symmetry, mirror);
    lastPointRef.current = point;
  };

  const endStroke = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    strokesRef.current = [];
    redrawAll();
  };

  const resetView = () => {
    setSymmetry(DEFAULT_SYMMETRY);
    setMirror(true);
    setLineWidth(DEFAULT_LINE_WIDTH);
    setColor("#7fd4ff");
    strokesRef.current = [];
    redrawAll();
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `kaleidoscope.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar kaleidoscope-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Kaleidoscope</h2>
            </div>
            <div className="dragon-sidebar-panel kaleidoscope-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="kaleidoscope-symmetry">
                    Symmetry order
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="kaleidoscope-symmetry"
                      type="range"
                      min={MIN_SYMMETRY}
                      max={MAX_SYMMETRY}
                      step={1}
                      value={symmetry}
                      onChange={(e) => setSymmetry(clampSymmetry(Number(e.target.value)))}
                    />
                    <div className="kaleidoscope-value-readout">{symmetry}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="kaleidoscope-mirror">
                    Mirror
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="kaleidoscope-mirror"
                      as="select"
                      value={mirror ? "on" : "off"}
                      onChange={(e) => setMirror(e.target.value === "on")}
                    >
                      <option value="on">On</option>
                      <option value="off">Off</option>
                    </FormControl>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="kaleidoscope-width">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="kaleidoscope-width"
                      type="range"
                      min={MIN_LINE_WIDTH}
                      max={MAX_LINE_WIDTH}
                      step={0.5}
                      value={lineWidth}
                      onChange={(e) => setLineWidth(clampLineWidth(Number(e.target.value)))}
                    />
                    <div className="kaleidoscope-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="kaleidoscope-color">
                    Color
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="kaleidoscope-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="outline-light" onClick={clear}>
                    Clear
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="kaleidoscope-hint">
                  Every stroke you draw is instantly repeated N times around
                  the canvas center — rotated copies at k·360°/N for
                  k=0…N-1, and, with mirroring on, an equal number of
                  reflected copies, together forming the dihedral symmetry
                  group of order 2N. Physical kaleidoscopes (patented by
                  Sir David Brewster in 1816) achieve the same effect
                  optically with mirrors angled at 180°/N; here the
                  reflection is done with the same trigonometry a mirror
                  performs — negating the angle of a point relative to the
                  center before rotating it.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="kaleidoscope-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="kaleidoscope-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
            role="img"
            aria-label="Kaleidoscope symmetry drawing canvas"
          />
        </div>
      </div>
    </>
  );
}
