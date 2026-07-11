import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  artworkPixelSize,
  clampCellSize,
  clampColorWeight,
  clampGridDimension,
  colorPercentages,
  countTilesByColor,
  DEFAULT_CELL_SIZE,
  DEFAULT_COLOR_WEIGHTS,
  DEFAULT_GUTTER,
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  GoldenRatioOrientation,
  colsForGoldenRows,
  generateMorelletTiles,
  MAX_CELL_SIZE,
  MAX_COLOR_WEIGHT,
  MAX_GRID_DIMENSION,
  MAX_GUTTER,
  MIN_CELL_SIZE,
  MIN_COLOR_WEIGHT,
  MIN_GRID_DIMENSION,
  MIN_GUTTER,
  rowsForGoldenCols,
  clampGutter,
  MorelletTilesArtwork,
  TILE_COLOR_MAP,
  TILE_COLOR_OPTIONS,
  TileColorId,
  TileColorWeights,
  renderMorelletTilesScaled,
} from "./morelletTiles";

const DOWNLOAD_SCALE = 2;
const VIEWPORT_BACKGROUND = "#0a0d18";

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function MorelletTilesApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [seed, setSeed] = useState(randomSeed);
  const [cols, setCols] = useState(DEFAULT_GRID_COLS);
  const [rows, setRows] = useState(DEFAULT_GRID_ROWS);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [gutter, setGutter] = useState(DEFAULT_GUTTER);
  const [goldenRatioLock, setGoldenRatioLock] = useState(false);
  const [goldenOrientation, setGoldenOrientation] =
    useState<GoldenRatioOrientation>("horizontal-long");
  const [colorWeights, setColorWeights] = useState<TileColorWeights>({
    ...DEFAULT_COLOR_WEIGHTS,
  });
  const [exactMix, setExactMix] = useState(false);

  const artwork = useMemo(
    (): MorelletTilesArtwork =>
      generateMorelletTiles({
        cols,
        rows,
        cellSize,
        gutter,
        colorWeights,
        exactMix,
        seed,
      }),
    [cellSize, colorWeights, cols, exactMix, gutter, rows, seed]
  );

  const percentages = useMemo(
    () => colorPercentages(artwork.params.colorWeights),
    [artwork.params.colorWeights]
  );

  const counts = useMemo(
    () => countTilesByColor(artwork.cells),
    [artwork.cells]
  );

  const pixelSize = useMemo(() => artworkPixelSize(artwork), [artwork]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }

    const style = window.getComputedStyle(wrap);
    const paddingX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const paddingY =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const displayWidth = Math.max(1, Math.floor(wrap.clientWidth - paddingX));
    const displayHeight = Math.max(1, Math.floor(wrap.clientHeight - paddingY));
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    renderMorelletTilesScaled(ctx, artwork, displayWidth, displayHeight, {
      fit: true,
      background: VIEWPORT_BACKGROUND,
    });
  }, [artwork]);

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

  const updateColorWeight = (id: TileColorId, value: number) => {
    setColorWeights((current) => ({
      ...current,
      [id]: clampColorWeight(value),
    }));
  };

  const handleColsChange = (value: number) => {
    const nextCols = clampGridDimension(value, DEFAULT_GRID_COLS);
    setCols(nextCols);
    if (goldenRatioLock) {
      setRows(rowsForGoldenCols(nextCols, goldenOrientation));
    }
  };

  const handleRowsChange = (value: number) => {
    const nextRows = clampGridDimension(value, DEFAULT_GRID_ROWS);
    setRows(nextRows);
    if (goldenRatioLock) {
      setCols(colsForGoldenRows(nextRows, goldenOrientation));
    }
  };

  const handleGoldenRatioLockChange = (locked: boolean) => {
    setGoldenRatioLock(locked);
    if (locked) {
      setRows(rowsForGoldenCols(cols, goldenOrientation));
    }
  };

  const handleGoldenOrientationChange = (verticalLong: boolean) => {
    const orientation: GoldenRatioOrientation = verticalLong
      ? "vertical-long"
      : "horizontal-long";
    setGoldenOrientation(orientation);
    if (goldenRatioLock) {
      setRows(rowsForGoldenCols(cols, orientation));
    }
  };

  const regenerate = () => {
    setSeed(randomSeed());
  };

  const downloadPng = () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = pixelSize.width * DOWNLOAD_SCALE;
    exportCanvas.height = pixelSize.height * DOWNLOAD_SCALE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      return;
    }
    renderMorelletTilesScaled(
      ctx,
      artwork,
      exportCanvas.width,
      exportCanvas.height
    );

    const link = document.createElement("a");
    link.download = `morellet-tiles-${seed}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar morellet-tiles-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Morellet Color Grid</h2>
            </div>
            <div className="dragon-sidebar-panel morellet-tiles-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="tiles-cols">
                    Width (columns)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="tiles-cols"
                      type="range"
                      min={MIN_GRID_DIMENSION}
                      max={MAX_GRID_DIMENSION}
                      step={1}
                      value={cols}
                      onChange={(e) => handleColsChange(Number(e.target.value))}
                    />
                    <div className="morellet-tiles-value-readout">{cols}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="tiles-rows">
                    Height (rows)
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="tiles-rows"
                      type="range"
                      min={MIN_GRID_DIMENSION}
                      max={MAX_GRID_DIMENSION}
                      step={1}
                      value={rows}
                      onChange={(e) => handleRowsChange(Number(e.target.value))}
                    />
                    <div className="morellet-tiles-value-readout">{rows}</div>
                  </div>
                </div>

                <FormCheck
                  id="tiles-golden-ratio"
                  type="checkbox"
                  label="Lock width and height to golden ratio (φ)"
                  checked={goldenRatioLock}
                  onChange={(e) => handleGoldenRatioLockChange(e.target.checked)}
                />

                {goldenRatioLock ? (
                  <FormCheck
                    id="tiles-golden-vertical-long"
                    type="checkbox"
                    label="Vertical is the long dimension"
                    checked={goldenOrientation === "vertical-long"}
                    onChange={(e) =>
                      handleGoldenOrientationChange(e.target.checked)
                    }
                  />
                ) : null}

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="tiles-cell-size">
                    Cell size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="tiles-cell-size"
                      type="range"
                      min={MIN_CELL_SIZE}
                      max={MAX_CELL_SIZE}
                      step={1}
                      value={cellSize}
                      onChange={(e) =>
                        setCellSize(clampCellSize(Number(e.target.value)))
                      }
                    />
                    <div className="morellet-tiles-value-readout">{cellSize}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="tiles-gutter">
                    Black gutter
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="tiles-gutter"
                      type="range"
                      min={MIN_GUTTER}
                      max={MAX_GUTTER}
                      step={1}
                      value={gutter}
                      onChange={(e) =>
                        setGutter(clampGutter(Number(e.target.value)))
                      }
                    />
                    <div className="morellet-tiles-value-readout">{gutter}px</div>
                  </div>
                </div>

                {TILE_COLOR_OPTIONS.map((option) => (
                  <div key={option.id} className="viz-control-row">
                    <FormLabel
                      className="section-label-muted viz-control-row-label"
                      htmlFor={`tiles-color-${option.id}`}
                    >
                      <span className="morellet-tiles-color-label">
                        <span
                          className="morellet-tiles-color-swatch"
                          style={{ backgroundColor: TILE_COLOR_MAP[option.id] }}
                          aria-hidden="true"
                        />
                        {option.label} weight
                      </span>
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id={`tiles-color-${option.id}`}
                        type="range"
                        min={MIN_COLOR_WEIGHT}
                        max={MAX_COLOR_WEIGHT}
                        step={1}
                        value={colorWeights[option.id]}
                        onChange={(e) =>
                          updateColorWeight(option.id, Number(e.target.value))
                        }
                      />
                      <div className="morellet-tiles-value-readout">
                        {colorWeights[option.id]} ({percentages[option.id].toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}

                <FormCheck
                  id="tiles-exact-mix"
                  type="checkbox"
                  label="Enforce exact mix (counts match percentages)"
                  checked={exactMix}
                  onChange={(e) => setExactMix(e.target.checked)}
                />

                <div className="morellet-tiles-results">
                  <div className="morellet-tiles-result-row">
                    <span className="morellet-tiles-result-label">Output size</span>
                    <span className="morellet-tiles-result-value">
                      {pixelSize.width} × {pixelSize.height}px
                    </span>
                  </div>
                  <div className="morellet-tiles-result-row">
                    <span className="morellet-tiles-result-label">Tiles</span>
                    <span className="morellet-tiles-result-value">
                      {(cols * rows).toLocaleString("en-US")}
                    </span>
                  </div>
                  {TILE_COLOR_OPTIONS.map((option) => (
                    <div key={option.id} className="morellet-tiles-result-row">
                      <span className="morellet-tiles-result-label">
                        {option.label} placed
                      </span>
                      <span className="morellet-tiles-result-value">
                        {counts[option.id].toLocaleString("en-US")}
                      </span>
                    </div>
                  ))}
                  <div className="morellet-tiles-result-row">
                    <span className="morellet-tiles-result-label">Seed</span>
                    <span className="morellet-tiles-result-value">{seed}</span>
                  </div>
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={regenerate}>
                    Generate
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="morellet-tiles-hint">
                  Random square tiles in red, green, blue, and orange on a black
                  grid, in the spirit of François Morellet&apos;s colour distributions.
                  Weights are normalized automatically when tiles are placed.
                  Enable exact mix to force the tile counts to match the
                  percentages.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="morellet-tiles-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="morellet-tiles-canvas"
            role="img"
            aria-label="Generated Morellet-style colored tile grid"
          />
        </div>
      </div>
    </>
  );
}
