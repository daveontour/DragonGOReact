import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampCellSize,
  clampColorProbability,
  clampLineWidth,
  clampMondrianDepth,
  countColoredCells,
  DEFAULT_CELL_SIZE,
  DEFAULT_COLOR_PROBABILITY,
  DEFAULT_ENABLED_COLORS,
  DEFAULT_LINE_WIDTH,
  DEFAULT_MONDRIAN_DEPTH,
  generateMondrian,
  MAX_CELL_SIZE,
  MAX_COLOR_PROBABILITY,
  MAX_LINE_WIDTH,
  MAX_MONDRIAN_DEPTH,
  MIN_CELL_SIZE,
  MIN_COLOR_PROBABILITY,
  MIN_LINE_WIDTH,
  MIN_MONDRIAN_DEPTH,
  MONDRIAN_COLOR_MAP,
  MONDRIAN_COLOR_OPTIONS,
  MondrianArtwork,
  MondrianColorId,
  renderMondrianScaled,
  toggleEnabledColor,
} from "./mondrianGenerator";

const GENERATION_WIDTH = 960;
const GENERATION_HEIGHT = 720;
const DOWNLOAD_SCALE = 2;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function MondrianApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [seed, setSeed] = useState(randomSeed);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MONDRIAN_DEPTH);
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const [minCellSize, setMinCellSize] = useState(DEFAULT_CELL_SIZE);
  const [colorProbability, setColorProbability] = useState(
    DEFAULT_COLOR_PROBABILITY
  );
  const [enabledColors, setEnabledColors] = useState<MondrianColorId[]>([
    ...DEFAULT_ENABLED_COLORS,
  ]);
  const [showGridOverlay, setShowGridOverlay] = useState(false);

  const artwork = useMemo(
    (): MondrianArtwork =>
      generateMondrian({
        width: GENERATION_WIDTH,
        height: GENERATION_HEIGHT,
        maxDepth,
        lineWidth,
        minCellSize,
        colorProbability,
        enabledColors,
        seed,
      }),
    [colorProbability, enabledColors, lineWidth, maxDepth, minCellSize, seed]
  );

  const stats = useMemo(
    () => ({
      cells: artwork.cells.length,
      colored: countColoredCells(artwork.cells),
    }),
    [artwork]
  );

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

    renderMondrianScaled(ctx, artwork, displayWidth, displayHeight, {
      showGridOverlay,
    });
  }, [artwork, showGridOverlay]);

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

  const regenerate = () => {
    setSeed(randomSeed());
  };

  const downloadPng = () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = GENERATION_WIDTH * DOWNLOAD_SCALE;
    exportCanvas.height = GENERATION_HEIGHT * DOWNLOAD_SCALE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      return;
    }
    renderMondrianScaled(
      ctx,
      artwork,
      exportCanvas.width,
      exportCanvas.height,
      { showGridOverlay }
    );

    const link = document.createElement("a");
    link.download = `mondrian-${seed}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar mondrian-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Mondrian Generator</h2>
            </div>
            <div className="dragon-sidebar-panel mondrian-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="mondrian-depth">
                    Complexity
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="mondrian-depth"
                      type="range"
                      min={MIN_MONDRIAN_DEPTH}
                      max={MAX_MONDRIAN_DEPTH}
                      step={1}
                      value={maxDepth}
                      onChange={(e) =>
                        setMaxDepth(clampMondrianDepth(Number(e.target.value)))
                      }
                    />
                    <div className="mondrian-value-readout">{maxDepth}</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="mondrian-line">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="mondrian-line"
                      type="range"
                      min={MIN_LINE_WIDTH}
                      max={MAX_LINE_WIDTH}
                      step={1}
                      value={lineWidth}
                      onChange={(e) =>
                        setLineWidth(clampLineWidth(Number(e.target.value)))
                      }
                    />
                    <div className="mondrian-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <FormCheck
                  id="mondrian-grid-overlay"
                  type="checkbox"
                  label="Show grid overlay (line thickness spacing)"
                  checked={showGridOverlay}
                  onChange={(e) => setShowGridOverlay(e.target.checked)}
                />

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="mondrian-cell">
                    Minimum cell size
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="mondrian-cell"
                      type="range"
                      min={MIN_CELL_SIZE}
                      max={MAX_CELL_SIZE}
                      step={2}
                      value={minCellSize}
                      onChange={(e) =>
                        setMinCellSize(clampCellSize(Number(e.target.value)))
                      }
                    />
                    <div className="mondrian-value-readout">{minCellSize}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="mondrian-color">
                    Primary colour chance
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="mondrian-color"
                      type="range"
                      min={MIN_COLOR_PROBABILITY}
                      max={MAX_COLOR_PROBABILITY}
                      step={0.01}
                      value={colorProbability}
                      onChange={(e) =>
                        setColorProbability(
                          clampColorProbability(Number(e.target.value))
                        )
                      }
                    />
                    <div className="mondrian-value-readout">
                      {(colorProbability * 100).toFixed(0)}%
                                      </div>
                  </div>
                </div>

                <div>
                  <FormLabel className="section-label-muted">
                    Fill colours
                  </FormLabel>
                  <Stack direction="horizontal" gap={5} className="mondrian-color-options">
                    {MONDRIAN_COLOR_OPTIONS.map((option) => (
                      <FormCheck
                        key={option.id}
                        id={`mondrian-color-${option.id}`}
                        type="checkbox"
                        checked={enabledColors.includes(option.id)}
                        onChange={() =>
                          setEnabledColors((current) =>
                            toggleEnabledColor(current, option.id)
                          )
                        }
                        label={
                          <span className="mondrian-color-option-label">
                            <span
                              className="mondrian-color-swatch"
                              style={{
                                backgroundColor: MONDRIAN_COLOR_MAP[option.id],
                              }}
                              aria-hidden="true"
                            />
                            {/* {option.label} */}
                          </span>
                        }
                      />
                    ))}
                  </Stack>
                </div>

                <div className="mondrian-results">
                  <div className="mondrian-result-row">
                    <span className="mondrian-result-label">Rectangles</span>
                    <span className="mondrian-result-value">{stats.cells}</span>
                  </div>
                  <div className="mondrian-result-row">
                    <span className="mondrian-result-label">Coloured blocks</span>
                    <span className="mondrian-result-value">{stats.colored}</span>
                  </div>
                  {/* <div className="mondrian-result-row">
                    <span className="mondrian-result-label">Seed</span>
                    <span className="mondrian-result-value">{seed}</span>
                  </div> */}
                </div>

                <Stack direction="horizontal" gap={2}>
                  <Button variant="primary" onClick={regenerate}>
                    Generate
                  </Button>
                  <Button variant="secondary" onClick={downloadPng}>
                    Download PNG
                  </Button>
                </Stack>

                <p className="mondrian-hint">
                  Inspired by Piet Mondrian and tools like{" "}
                  <a
                    href="https://www.mondriangenerator.io/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    mondriangenerator.io
                  </a>
                  . Rectangles are split recursively, then filled with white or
                  your selected colours separated by black grid lines.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="mondrian-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="mondrian-canvas"
            role="img"
            aria-label="Generated Mondrian-style composition"
          />
        </div>
      </div>
    </>
  );
}
