import { useMemo, useState } from "react";
import { Button, FormControl, FormLabel, Stack } from "react-bootstrap";
import VisualizationTopBar from "../Layouts/VisualizationTopBar";
import {
  buildCollatzChartPoints,
  buildRangeLengthChartPoints,
  chartPolyline,
  collatzRangeLengths,
  collatzSequence,
  CollatzPlotMode,
  DEFAULT_COLLATZ_RANGE_LOWER,
  DEFAULT_COLLATZ_RANGE_UPPER,
  DEFAULT_COLLATZ_START,
  formatCollatzValue,
  MAX_COLLATZ_RANGE_SIZE,
  parseCollatzRange,
  parseCollatzStart,
  rangeChartPolyline,
} from "./collatzSequence";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 420;
const CHART_PADDING = { top: 24, right: 24, bottom: 48, left: 56 };

export default function CollatzApp({ onHome }: { onHome: () => void }) {
  const [plotMode, setPlotMode] = useState<CollatzPlotMode>("single");
  const [inputValue, setInputValue] = useState(DEFAULT_COLLATZ_START.toString());
  const [startValue, setStartValue] = useState(DEFAULT_COLLATZ_START);
  const [rangeLowerInput, setRangeLowerInput] = useState(
    DEFAULT_COLLATZ_RANGE_LOWER.toString()
  );
  const [rangeUpperInput, setRangeUpperInput] = useState(
    DEFAULT_COLLATZ_RANGE_UPPER.toString()
  );
  const [rangeLimits, setRangeLimits] = useState({
    lower: DEFAULT_COLLATZ_RANGE_LOWER,
    upper: DEFAULT_COLLATZ_RANGE_UPPER,
  });
  const [rangeError, setRangeError] = useState("");

  const stats = useMemo(() => collatzSequence(startValue), [startValue]);
  const singleChartPoints = useMemo(
    () =>
      buildCollatzChartPoints(
        stats.sequence,
        CHART_WIDTH,
        CHART_HEIGHT,
        CHART_PADDING
      ),
    [stats.sequence]
  );
  const singleLinePath = useMemo(
    () => chartPolyline(singleChartPoints),
    [singleChartPoints]
  );

  const rangeData = useMemo(
    () => collatzRangeLengths(rangeLimits.lower, rangeLimits.upper),
    [rangeLimits]
  );
  const rangeChartPoints = useMemo(
    () =>
      buildRangeLengthChartPoints(
        rangeData,
        CHART_WIDTH,
        CHART_HEIGHT,
        CHART_PADDING
      ),
    [rangeData]
  );
  const rangeLinePath = useMemo(
    () => rangeChartPolyline(rangeChartPoints),
    [rangeChartPoints]
  );

  const rangeStats = useMemo(() => {
    if (rangeData.length === 0) {
      return null;
    }
    const lengths = rangeData.map((point) => point.length);
    return {
      min: Math.min(...lengths),
      max: Math.max(...lengths),
      count: rangeData.length,
    };
  }, [rangeData]);

  const applyInput = () => {
    const parsed = parseCollatzStart(inputValue);
    if (parsed !== null) {
      setStartValue(parsed);
      setInputValue(parsed.toString());
    }
  };

  const applyRange = () => {
    const parsed = parseCollatzRange(rangeLowerInput, rangeUpperInput);
    if (parsed === null) {
      setRangeError(
        `Enter valid limits with at most ${MAX_COLLATZ_RANGE_SIZE.toLocaleString("en-US")} values.`
      );
      return;
    }
    setRangeLimits(parsed);
    setRangeLowerInput(parsed.lower.toString());
    setRangeUpperInput(parsed.upper.toString());
    setRangeError("");
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (plotMode === "single") {
        applyInput();
      } else {
        applyRange();
      }
    }
  };

  const showSequenceList =
    plotMode === "single" && stats.sequence.length <= 64;

  return (
    <>
      <VisualizationTopBar showFullScreen={false} onHome={onHome} />
      <div className="main-content">
        <div className="dragon-sidebar collatz-sidebar">
          <div className="dragon-sidebar-inner">
            <div className="dragon-sidebar-heading">
              <h2 className="dragon-sidebar-title">Collatz Conjecture</h2>
            </div>
            <div className="dragon-sidebar-panel collatz-sidebar-panel">
              <Stack direction="vertical" gap={3}>
                <div>
                  <FormLabel className="section-label-muted" htmlFor="collatz-plot-mode">
                    Plot mode
                  </FormLabel>
                  <FormControl
                    id="collatz-plot-mode"
                    as="select"
                    value={plotMode}
                    onChange={(e) =>
                      setPlotMode(e.target.value as CollatzPlotMode)
                    }
                  >
                    <option value="single">Single sequence</option>
                    <option value="range">Range: sequence lengths</option>
                  </FormControl>
                </div>

                {plotMode === "single" ? (
                  <div>
                    <FormLabel className="section-label-muted" htmlFor="collatz-start">
                      Starting value
                    </FormLabel>
                    <FormControl
                      id="collatz-start"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                    />
                    <Button
                      className="mt-2"
                      variant="primary"
                      onClick={applyInput}
                    >
                      Map sequence
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FormLabel className="section-label-muted" htmlFor="collatz-range-lower">
                      Lower limit
                    </FormLabel>
                    <FormControl
                      id="collatz-range-lower"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeLowerInput}
                      onChange={(e) => setRangeLowerInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                    />
                    <FormLabel
                      className="section-label-muted mt-2"
                      htmlFor="collatz-range-upper"
                    >
                      Upper limit
                    </FormLabel>
                    <FormControl
                      id="collatz-range-upper"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeUpperInput}
                      onChange={(e) => setRangeUpperInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                    />
                    <Button
                      className="mt-2"
                      variant="primary"
                      onClick={applyRange}
                    >
                      Plot range
                    </Button>
                    {rangeError ? (
                      <p className="collatz-error">{rangeError}</p>
                    ) : null}
                  </div>
                )}

                <p className="collatz-hint">
                  If n is even, divide by 2. If n is odd, compute 3n + 1. Repeat
                  until you reach 1.
                </p>

                {plotMode === "single" ? (
                  <div className="collatz-results">
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Steps to 1</span>
                      <span className="collatz-result-value">
                        {stats.reachedOne
                          ? stats.steps.toLocaleString("en-US")
                          : `>${stats.steps.toLocaleString("en-US")}`}
                      </span>
                    </div>
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Peak value</span>
                      <span className="collatz-result-value collatz-result-value--peak">
                        {formatCollatzValue(stats.peak)}
                      </span>
                    </div>
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Sequence length</span>
                      <span className="collatz-result-value">
                        {stats.sequence.length.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>
                ) : rangeStats ? (
                  <div className="collatz-results">
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Values plotted</span>
                      <span className="collatz-result-value">
                        {rangeStats.count.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Min length</span>
                      <span className="collatz-result-value">
                        {rangeStats.min.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Max length</span>
                      <span className="collatz-result-value collatz-result-value--peak">
                        {rangeStats.max.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="collatz-result-row">
                      <span className="collatz-result-label">Range</span>
                      <span className="collatz-result-value">
                        {formatCollatzValue(rangeLimits.lower)} –{" "}
                        {formatCollatzValue(rangeLimits.upper)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {showSequenceList ? (
                  <div className="collatz-sequence-list">
                    <FormLabel className="section-label-muted">Sequence</FormLabel>
                    <div className="collatz-sequence-scroll">
                      {stats.sequence.map((value, index) => (
                        <span key={index} className="collatz-sequence-item">
                          {formatCollatzValue(value)}
                          {index < stats.sequence.length - 1 ? (
                            <span className="collatz-sequence-arrow">→</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : plotMode === "single" ? (
                  <p className="collatz-hint">
                    Sequence has {stats.sequence.length.toLocaleString("en-US")}{" "}
                    values — see the chart for the full path.
                  </p>
                ) : (
                  <p className="collatz-hint">
                    Plots sequence length for every starting value from lower to
                    upper (up to {MAX_COLLATZ_RANGE_SIZE.toLocaleString("en-US")}{" "}
                    values).
                  </p>
                )}
              </Stack>
            </div>
          </div>
        </div>

        <div className="collatz-canvas-wrap">
          {plotMode === "single" ? (
            <svg
              className="collatz-chart"
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label={`Collatz sequence chart starting from ${startValue.toString()}`}
            >
              <rect
                className="collatz-chart-bg"
                x={CHART_PADDING.left}
                y={CHART_PADDING.top}
                width={CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right}
                height={CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom}
              />
              <line
                className="collatz-axis"
                x1={CHART_PADDING.left}
                y1={CHART_HEIGHT - CHART_PADDING.bottom}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
              />
              <line
                className="collatz-axis"
                x1={CHART_PADDING.left}
                y1={CHART_PADDING.top}
                x2={CHART_PADDING.left}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
              />
              <text
                className="collatz-axis-label"
                x={CHART_WIDTH / 2}
                y={CHART_HEIGHT - 10}
                textAnchor="middle"
              >
                Step
              </text>
              <text
                className="collatz-axis-label collatz-axis-label--vertical"
                x={16}
                y={CHART_HEIGHT / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${CHART_HEIGHT / 2})`}
              >
                Value (log scale)
              </text>
              <path className="collatz-line" d={singleLinePath} />
              {singleChartPoints.map((point, index) => {
                const isStart = index === 0;
                const isEnd = index === singleChartPoints.length - 1;
                return (
                  <circle
                    key={point.step}
                    className={[
                      "collatz-point",
                      isStart ? "collatz-point--start" : "",
                      isEnd ? "collatz-point--end" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    cx={point.x}
                    cy={point.y}
                    r={
                      isStart || isEnd
                        ? 5
                        : singleChartPoints.length > 200
                          ? 0
                          : 2.5
                    }
                  />
                );
              })}
            </svg>
          ) : (
            <svg
              className="collatz-chart"
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label={`Collatz sequence lengths from ${rangeLimits.lower.toString()} to ${rangeLimits.upper.toString()}`}
            >
              <rect
                className="collatz-chart-bg"
                x={CHART_PADDING.left}
                y={CHART_PADDING.top}
                width={CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right}
                height={CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom}
              />
              <line
                className="collatz-axis"
                x1={CHART_PADDING.left}
                y1={CHART_HEIGHT - CHART_PADDING.bottom}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
              />
              <line
                className="collatz-axis"
                x1={CHART_PADDING.left}
                y1={CHART_PADDING.top}
                x2={CHART_PADDING.left}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
              />
              <text
                className="collatz-axis-label"
                x={CHART_WIDTH / 2}
                y={CHART_HEIGHT - 10}
                textAnchor="middle"
              >
                Starting value
              </text>
              <text
                className="collatz-axis-label collatz-axis-label--vertical"
                x={16}
                y={CHART_HEIGHT / 2}
                textAnchor="middle"
                transform={`rotate(-90 16 ${CHART_HEIGHT / 2})`}
              >
                Sequence length
              </text>
              <path className="collatz-line collatz-line--range" d={rangeLinePath} />
              {rangeChartPoints.length <= 300
                ? rangeChartPoints.map((point) => (
                    <circle
                      key={point.start.toString()}
                      className="collatz-point collatz-point--range"
                      cx={point.x}
                      cy={point.y}
                      r={2.5}
                    />
                  ))
                : null}
            </svg>
          )}
        </div>
      </div>
    </>
  );
}
