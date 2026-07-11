import { useCallback, useEffect, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  BifurcationView,
  clampBifurcationIterations,
  DEFAULT_BIFURCATION_ITERATIONS,
  DEFAULT_BIFURCATION_VIEW,
  MAX_BIFURCATION_ITERATIONS,
  MIN_BIFURCATION_ITERATIONS,
  rAtPixel,
  renderBifurcation,
  zoomBifurcationAt,
} from "./bifurcation";

const MAX_RENDER_WIDTH = 900;
const MAX_RENDER_HEIGHT = 640;
const LOGISTIC_COLOR: [number, number, number] = [127, 224, 255];

export default function BifurcationApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<BifurcationView>(DEFAULT_BIFURCATION_VIEW);
  const [iterations, setIterations] = useState(DEFAULT_BIFURCATION_ITERATIONS);
  const [rendering, setRendering] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight));
    const scale = Math.min(
      1,
      MAX_RENDER_WIDTH / displayWidth,
      MAX_RENDER_HEIGHT / displayHeight
    );
    const width = Math.max(1, Math.floor(displayWidth * scale));
    const height = Math.max(1, Math.floor(displayHeight * scale));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    setRendering(true);
    const imageData = ctx.createImageData(width, height);
    renderBifurcation(imageData, view, iterations, 200, LOGISTIC_COLOR);
    ctx.putImageData(imageData, 0, 0);
    setRendering(false);
  }, [view, iterations]);

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

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const rTarget = rAtPixel(px, canvas.width, view);
    setView((current) => zoomBifurcationAt(current, rTarget, 0.35));
  };

  const resetView = () => {
    setView(DEFAULT_BIFURCATION_VIEW);
    setIterations(DEFAULT_BIFURCATION_ITERATIONS);
  };


  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `bifurcation.png`);
  };


  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar bifurcation-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Bifurcation Diagram</h2>
            </div>
            <div className="dragon-sidebar-panel bifurcation-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label"
                    htmlFor="bifurcation-iterations">
                    Plotted iterations per column
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="bifurcation-iterations"
                      type="range"
                      min={MIN_BIFURCATION_ITERATIONS}
                      max={MAX_BIFURCATION_ITERATIONS}
                      step={10}
                      value={iterations}
                      onChange={(e) =>
                        setIterations(
                          clampBifurcationIterations(Number(e.target.value))
                        )
                      }
                    />
                    <div className="bifurcation-value-readout">{iterations}</div>
                  </div>
                </div>

                <div className="bifurcation-results">
                  <div className="bifurcation-result-row">
                    <span className="bifurcation-result-label">r range</span>
                    <span className="bifurcation-result-value">
                      {view.rMin.toFixed(5)} – {view.rMax.toFixed(5)}
                    </span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={resetView}>
                    Reset view
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>


                <p className="bifurcation-hint">
                  Each column plots where x settles after iterating the
                  logistic map x → r·x·(1−x) for a fixed r. Below r ≈ 3 it
                  settles to one value; beyond that it period-doubles into
                  chaos. Click to zoom into any region.
                </p>
                {rendering ? (
                  <p className="bifurcation-hint">Rendering…</p>
                ) : null}
              </Stack>
            </div>
          </div>
        </div>

        <div className="bifurcation-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="bifurcation-canvas"
            onClick={handleCanvasClick}
            role="img"
            aria-label="Logistic map bifurcation diagram"
          />
        </div>
      </div>
    </>
  );
}
