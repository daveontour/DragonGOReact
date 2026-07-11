import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import { downloadCanvasPng } from "../downloadViz";
import {
  clampDetail,
  clampRoughness,
  clampSeaLevel,
  createSeededRandom,
  DEFAULT_DETAIL,
  DEFAULT_ROUGHNESS,
  DEFAULT_SEA_LEVEL,
  generateDiamondSquare,
  gridSizeForDetail,
  MAX_DETAIL,
  MAX_ROUGHNESS,
  MAX_SEA_LEVEL,
  MIN_DETAIL,
  MIN_ROUGHNESS,
  MIN_SEA_LEVEL,
  renderTerrain,
} from "./fractalterrain";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function FractalTerrainApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [detail, setDetail] = useState(DEFAULT_DETAIL);
  const [roughness, setRoughness] = useState(DEFAULT_ROUGHNESS);
  const [seaLevel, setSeaLevel] = useState(DEFAULT_SEA_LEVEL);
  const [seed, setSeed] = useState(1);

  const size = gridSizeForDetail(detail);

  const heights = useMemo(
    () => generateDiamondSquare(detail, roughness, createSeededRandom(seed)),
    [detail, roughness, seed]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const imageData = ctx.createImageData(size, size);
    renderTerrain(imageData, heights, size, seaLevel);
    ctx.putImageData(imageData, 0, 0);
  }, [heights, size, seaLevel]);

  useEffect(() => {
    draw();
  }, [draw]);

  const resetView = () => {
    setDetail(DEFAULT_DETAIL);
    setRoughness(DEFAULT_ROUGHNESS);
    setSeaLevel(DEFAULT_SEA_LEVEL);
    setSeed(1);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(canvas, `fractal-terrain.png`);
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar fractal-terrain-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Fractal Terrain</h2>
            </div>
            <div className="dragon-sidebar-panel fractal-terrain-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="terrain-detail">
                    Detail level
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="terrain-detail"
                      type="range"
                      min={MIN_DETAIL}
                      max={MAX_DETAIL}
                      step={1}
                      value={detail}
                      onChange={(e) => setDetail(clampDetail(Number(e.target.value)))}
                    />
                    <div className="fractal-terrain-value-readout">
                      {size}×{size}
                    </div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="terrain-roughness">
                    Roughness (Hurst)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="terrain-roughness"
                      type="range"
                      min={MIN_ROUGHNESS}
                      max={MAX_ROUGHNESS}
                      step={0.01}
                      value={roughness}
                      onChange={(e) => setRoughness(clampRoughness(Number(e.target.value)))}
                    />
                    <div className="fractal-terrain-value-readout">{roughness.toFixed(2)}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="terrain-sea">
                    Sea level
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="terrain-sea"
                      type="range"
                      min={MIN_SEA_LEVEL}
                      max={MAX_SEA_LEVEL}
                      step={0.01}
                      value={seaLevel}
                      onChange={(e) => setSeaLevel(clampSeaLevel(Number(e.target.value)))}
                    />
                    <div className="fractal-terrain-value-readout">{seaLevel.toFixed(2)}</div>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
                    Regenerate
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <Button variant="secondary" onClick={resetView}>
                  Reset
                </Button>

                <p className="fractal-terrain-hint">
                  Fournier, Fussell and Carpenter's 1982 midpoint
                  displacement algorithm builds fractal terrain by
                  alternating two steps on a (2ⁿ+1)×(2ⁿ+1) grid: a diamond
                  step sets each square's center to the average of its 4
                  corners plus a random offset, and a square step sets
                  each diamond's midpoint to the average of its
                  surrounding points plus a random offset. After each pass
                  the grid spacing halves and the random offset's
                  amplitude shrinks by 2^(-H), where the Hurst exponent H
                  controls the terrain's fractal dimension (D = 3 − H) —
                  low H produces jagged, mountainous terrain, high H
                  produces smooth, rolling hills.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="fractal-terrain-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="fractal-terrain-canvas"
            role="img"
            aria-label="Diamond-square fractal terrain heightmap"
          />
        </div>
      </div>
    </>
  );
}
