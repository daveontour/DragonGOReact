import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, FormCheck, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  clampAngle,
  clampEmptyProbability,
  clampGridCount,
  clampLineSpacing,
  clampLineWidth,
  clampSecondaryOffset,
  countFilledTiles,
  DEFAULT_EMPTY_PROBABILITY,
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  DEFAULT_LINE_SPACING,
  DEFAULT_LINE_WIDTH,
  DEFAULT_PRIMARY_ANGLE,
  DEFAULT_SECONDARY_OFFSET,
  generateMorellet,
  MAX_ANGLE,
  MAX_EMPTY_PROBABILITY,
  MAX_GRID_COUNT,
  MAX_LINE_SPACING,
  MAX_LINE_WIDTH,
  MAX_SECONDARY_OFFSET,
  MIN_ANGLE,
  MIN_EMPTY_PROBABILITY,
  MIN_GRID_COUNT,
  MIN_LINE_SPACING,
  MIN_LINE_WIDTH,
  MIN_SECONDARY_OFFSET,
  MORELLET_PATTERNS,
  MorelletArtwork,
  MorelletPatternId,
  renderMorelletScaled,
} from "./morellet";

const GENERATION_WIDTH = 960;
const GENERATION_HEIGHT = 720;
const DOWNLOAD_SCALE = 2;

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export default function MorelletApp({ onHome }: { onHome: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [seed, setSeed] = useState(randomSeed);
  const [pattern, setPattern] = useState<MorelletPatternId>("crossed-trames");
  const [cols, setCols] = useState(DEFAULT_GRID_COLS);
  const [rows, setRows] = useState(DEFAULT_GRID_ROWS);
  const [lineWidth, setLineWidth] = useState(DEFAULT_LINE_WIDTH);
  const [primaryAngle, setPrimaryAngle] = useState(DEFAULT_PRIMARY_ANGLE);
  const [secondaryOffset, setSecondaryOffset] = useState(DEFAULT_SECONDARY_OFFSET);
  const [lineSpacing, setLineSpacing] = useState(DEFAULT_LINE_SPACING);
  const [emptyProbability, setEmptyProbability] = useState(DEFAULT_EMPTY_PROBABILITY);
  const [showTileGrid, setShowTileGrid] = useState(true);
  const [accentRed, setAccentRed] = useState(false);

  const isTrames = pattern === "crossed-trames";

  const artwork = useMemo(
    (): MorelletArtwork =>
      generateMorellet({
        width: GENERATION_WIDTH,
        height: GENERATION_HEIGHT,
        cols,
        rows,
        lineWidth,
        pattern,
        primaryAngle,
        secondaryOffset,
        lineSpacing,
        emptyProbability,
        seed,
        showTileGrid,
        accentRed,
      }),
    [
      accentRed,
      cols,
      emptyProbability,
      lineSpacing,
      lineWidth,
      pattern,
      primaryAngle,
      rows,
      secondaryOffset,
      seed,
      showTileGrid,
    ]
  );

  const stats = useMemo(
    () => ({
      filledTiles: countFilledTiles(artwork),
      totalTiles: artwork.params.cols * artwork.params.rows,
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

    renderMorelletScaled(ctx, artwork, displayWidth, displayHeight);
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
    renderMorelletScaled(
      ctx,
      artwork,
      exportCanvas.width,
      exportCanvas.height
    );

    const link = document.createElement("a");
    link.download = `morellet-${pattern}-${seed}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const patternInfo = MORELLET_PATTERNS.find((entry) => entry.id === pattern);

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar morellet-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Morellet Patterns</h2>
            </div>
            <div className="dragon-sidebar-panel morellet-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-pattern">
                    Pattern style
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="morellet-pattern"
                      as="select"
                      value={pattern}
                      onChange={(e) =>
                        setPattern(e.target.value as MorelletPatternId)
                      }
                    >
                      {MORELLET_PATTERNS.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                      ))}
                    </FormControl>
                  </div>
                </div>

                {!isTrames ? (
                  <>
                    <div className="viz-control-row">
                      <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-cols">
                        Columns
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="morellet-cols"
                          type="range"
                          min={MIN_GRID_COUNT}
                          max={MAX_GRID_COUNT}
                          step={1}
                          value={cols}
                          onChange={(e) =>
                            setCols(clampGridCount(Number(e.target.value)))
                          }
                        />
                        <div className="morellet-value-readout">{cols}</div>
                      </div>
                    </div>

                    <div className="viz-control-row">
                      <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-rows">
                        Rows
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="morellet-rows"
                          type="range"
                          min={MIN_GRID_COUNT}
                          max={MAX_GRID_COUNT}
                          step={1}
                          value={rows}
                          onChange={(e) =>
                            setRows(clampGridCount(Number(e.target.value)))
                          }
                        />
                        <div className="morellet-value-readout">{rows}</div>
                      </div>
                    </div>

                    <div className="viz-control-row">
                      <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-empty">
                        Empty cells
                      </FormLabel>
                      <div className="viz-control-row-control">
                        <FormControl
                          id="morellet-empty"
                          type="range"
                          min={MIN_EMPTY_PROBABILITY}
                          max={MAX_EMPTY_PROBABILITY}
                          step={0.01}
                          value={emptyProbability}
                          onChange={(e) =>
                            setEmptyProbability(
                              clampEmptyProbability(Number(e.target.value))
                            )
                          }
                        />
                        <div className="morellet-value-readout">
                          {(emptyProbability * 100).toFixed(0)}%
                                              </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-spacing">
                      Line spacing
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="morellet-spacing"
                        type="range"
                        min={MIN_LINE_SPACING}
                        max={MAX_LINE_SPACING}
                        step={1}
                        value={lineSpacing}
                        onChange={(e) =>
                          setLineSpacing(clampLineSpacing(Number(e.target.value)))
                        }
                      />
                      <div className="morellet-value-readout">{lineSpacing}px</div>
                    </div>
                  </div>
                )}

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-line">
                    Line thickness
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="morellet-line"
                      type="range"
                      min={MIN_LINE_WIDTH}
                      max={MAX_LINE_WIDTH}
                      step={1}
                      value={lineWidth}
                      onChange={(e) =>
                        setLineWidth(clampLineWidth(Number(e.target.value)))
                      }
                    />
                    <div className="morellet-value-readout">{lineWidth}px</div>
                  </div>
                </div>

                <div className="viz-control-row">
                  <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-angle">
                    {isTrames ? "First field angle" : "Reference angle"}
                  </FormLabel>
                  <div className="viz-control-row-control">
                    <FormControl
                      id="morellet-angle"
                      type="range"
                      min={MIN_ANGLE}
                      max={MAX_ANGLE}
                      step={1}
                      value={primaryAngle}
                      onChange={(e) =>
                        setPrimaryAngle(clampAngle(Number(e.target.value)))
                      }
                    />
                    <div className="morellet-value-readout">{primaryAngle}°</div>
                  </div>
                </div>

                {isTrames ? (
                  <div className="viz-control-row">
                    <FormLabel className="section-label-muted viz-control-row-label" htmlFor="morellet-offset">
                      Angle between fields
                    </FormLabel>
                    <div className="viz-control-row-control">
                      <FormControl
                        id="morellet-offset"
                        type="range"
                        min={MIN_SECONDARY_OFFSET}
                        max={MAX_SECONDARY_OFFSET}
                        step={1}
                        value={secondaryOffset}
                        onChange={(e) =>
                          setSecondaryOffset(
                            clampSecondaryOffset(Number(e.target.value))
                          )
                        }
                      />
                      <div className="morellet-value-readout">{secondaryOffset}°</div>
                    </div>
                  </div>
                ) : null}

                {!isTrames ? (
                  <FormCheck
                    id="morellet-grid"
                    type="checkbox"
                    label="Show tile grid"
                    checked={showTileGrid}
                    onChange={(e) => setShowTileGrid(e.target.checked)}
                  />
                ) : null}

                <FormCheck
                  id="morellet-accent"
                  type="checkbox"
                  label="Accent with red lines"
                  checked={accentRed}
                  onChange={(e) => setAccentRed(e.target.checked)}
                />

                <div className="morellet-results">
                  {!isTrames ? (
                    <div className="morellet-result-row">
                      <span className="morellet-result-label">Filled tiles</span>
                      <span className="morellet-result-value">
                        {stats.filledTiles} / {stats.totalTiles}
                      </span>
                    </div>
                  ) : null}
                  <div className="morellet-result-row">
                    <span className="morellet-result-label">Seed</span>
                    <span className="morellet-result-value">{seed}</span>
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

                <p className="morellet-hint">
                  {patternInfo?.description} Inspired by the systematic, rule-based
                  line works of François Morellet.
                </p>
              </Stack>
            </div>
          </div>
        </div>

        <div className="morellet-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="morellet-canvas"
            role="img"
            aria-label="Generated Morellet-style tiled pattern"
          />
        </div>
      </div>
    </>
  );
}
