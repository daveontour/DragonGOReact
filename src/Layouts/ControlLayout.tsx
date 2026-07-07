import { RefAttributes, useContext, useEffect, useRef } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  OverlayTrigger,
  Row,
  Stack,
  Tooltip,
  TooltipProps,
} from "react-bootstrap";
import FormControl from "react-bootstrap/esm/FormControl";
import FormLabel from "react-bootstrap/esm/FormLabel";
import CellConfig from "../Widgets/CellConfigWidget";
import PathConfig from "../Widgets/PathConfigWidget";

import { JSX } from "react/jsx-runtime";
import GroutingConfig from "../Widgets/GroutingConfigWidget";
import ControlLayoutButtons from "./ControlLayoutButtons";
import {
  DOWN,
  LEFT,
  RIGHT,
  RequestConfig,
  UP,
  precalculateTurns,
} from "../servertsx/common";
import { CurrentConfigContext } from "../Contexts";
import FoldsModal from "../DialogBoxes/RawConfigModal";
import ConfigSlideShowModal from "../DialogBoxes/ConfigSlideShowModal";
import FoldsHelpModal from "../DialogBoxes/FoldsHelpModal";
import RendererHelpModal from "../DialogBoxes/RendererHelpModal";
import LoadCurveModal from "../DialogBoxes/LoadCurveModal";
import SaveCurveModal from "../DialogBoxes/SaveCurveModal";
import { getDragonSVG, getDragonSizeSVG, getPlansDisplaySVG, getPlansSizeSVG } from "../servertsx/svg";

var opened = true;

const MAIN_PORTAL_ID = "dragonCanvasPortal";
const MAIN_IMAGE_ID = "imageHTMLElement";
const FULLSCREEN_IMAGE_ID = "imageHTMLElementFullScreen";
/** Inset so the image sits inside the portal border/padding. */
const PORTAL_INSET_PX = 8;

/** Fit image into portal using "contain" scaling (preserve aspect ratio, no crop). */
function fitImageToPortal(
  imgWidth: number,
  imgHeight: number,
  portalWidth: number,
  portalHeight: number
): { width: number; height: number; zoom: string } {
  if (imgWidth <= 0 || imgHeight <= 0 || portalWidth <= 0 || portalHeight <= 0) {
    return { width: imgWidth, height: imgHeight, zoom: "100" };
  }

  const scale = Math.min(portalWidth / imgWidth, portalHeight / imgHeight);
  return {
    width: imgWidth * scale,
    height: imgHeight * scale,
    zoom: String(Math.round(scale * 100)),
  };
}

/**
 * Measure the layout portal (not the SVG host). The portal is sized only by
 * flex layout, so it grows and shrinks with the window independently of the SVG.
 */
function getPortalSize(
  portalId: string,
  fallbackWidth: number,
  fallbackHeight: number
): { width: number; height: number } {
  const portal = document.getElementById(portalId);
  if (portal) {
    const rect = portal.getBoundingClientRect();
    const width = Math.max(rect.width - PORTAL_INSET_PX * 2, 1);
    const height = Math.max(rect.height - PORTAL_INSET_PX * 2, 1);
    if (width > 1 && height > 1) {
      return { width, height };
    }
  }
  return { width: fallbackWidth, height: fallbackHeight };
}

function applySvgSize(
  container: HTMLElement | null,
  portalId: string,
  svgContent: string,
  imgWidth: number,
  imgHeight: number,
  fallbackWidth: number,
  fallbackHeight: number
): { width: number; height: number; zoom: string } | null {
  if (!container) {
    return null;
  }

  container.innerHTML = svgContent;
  return resizeSvgInContainer(
    container,
    portalId,
    imgWidth,
    imgHeight,
    fallbackWidth,
    fallbackHeight
  );
}

/** Resize an existing SVG to fit its layout portal, preserving aspect ratio. */
function resizeSvgInContainer(
  container: HTMLElement | null,
  portalId: string,
  imgWidth: number,
  imgHeight: number,
  fallbackWidth: number,
  fallbackHeight: number
): { width: number; height: number; zoom: string } | null {
  if (!container || imgWidth <= 0 || imgHeight <= 0) {
    return null;
  }

  const svg = container.querySelector("svg");
  if (!svg) {
    return null;
  }

  const portal = getPortalSize(portalId, fallbackWidth, fallbackHeight);
  const fitted = fitImageToPortal(
    imgWidth,
    imgHeight,
    portal.width,
    portal.height
  );

  svg.setAttribute("width", String(fitted.width));
  svg.setAttribute("height", String(fitted.height));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  return fitted;
}

import {
  SetSlideShowRandomFunction,
  SetShowFullScreen,
  RandomiserReturnType,
} from "../types";
import { downloadSVG, downloadJSON } from "../utils/downloadUtils";
import { buildSavedConfig } from "../utils/savedConfig";
import { applyNoCellsOverrides } from "../utils/buildRequestConfig";
import { schedulePathAnimation } from "../utils/pathAnimation";

export default function ControlLayout({
  setSlideShowRandomFunction,
  setShowFullScreen,
}: {
  setSlideShowRandomFunction: SetSlideShowRandomFunction;
  setShowFullScreen: SetShowFullScreen;
}) {
  // Generate the initial image on load
  useEffect(() => {
    generate();
  }, [opened]);

  let config = useContext(CurrentConfigContext);
  const intervalIdRef = useRef<number | null>(null);
  const autoDownloadRef = useRef<boolean>(config.slideShowAutoDownload || false);
  const slideShowPauseRef = useRef<boolean>(config.slideShowPause);
  const paletteRef = useRef<string>(config.state.pallette || "unknown");
  const intrinsicSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const setImageSizeRef = useRef(config.setImageSize);
  setImageSizeRef.current = config.setImageSize;

  // Keep refs in sync with Context state
  useEffect(() => {
    autoDownloadRef.current = config.slideShowAutoDownload || false;
  }, [config.slideShowAutoDownload]);
  
  useEffect(() => {
    slideShowPauseRef.current = config.slideShowPause;
  }, [config.slideShowPause]);

  useEffect(() => {
    paletteRef.current = config.state.pallette || "unknown";
  }, [config.state.pallette]);

  // Re-fit the main (and fullscreen) image when the window or portal is resized.
  useEffect(() => {
    let frameId = 0;

    const mainFallback = () => {
      const titleBar = document.querySelector(".dragon-app .top-bar");
      const titleBarHeight = titleBar?.getBoundingClientRect().height ?? 56;
      const sidebar = document.querySelector(".dragon-app .dragon-sidebar");
      const sidebarWidth =
        sidebar?.getBoundingClientRect().width ?? 400;
      return {
        width: Math.max(window.innerWidth - sidebarWidth - 24, 100),
        height: Math.max(window.innerHeight - titleBarHeight - 16, 100),
      };
    };

    const refitImages = () => {
      const intrinsic = intrinsicSizeRef.current;
      if (!intrinsic) {
        return;
      }

      const fallback = mainFallback();
      const main = document.getElementById(MAIN_IMAGE_ID);
      const fitted = resizeSvgInContainer(
        main,
        MAIN_PORTAL_ID,
        intrinsic.width,
        intrinsic.height,
        fallback.width,
        fallback.height
      );
      if (fitted) {
        setImageSizeRef.current((prev) => ({
          ...prev,
          width: `${fitted.width}px`,
          height: `${fitted.height}px`,
          zoom: fitted.zoom,
        }));
      }

      const fullscreen = document.getElementById(FULLSCREEN_IMAGE_ID);
      resizeSvgInContainer(
        fullscreen,
        FULLSCREEN_IMAGE_ID,
        intrinsic.width,
        intrinsic.height,
        window.innerWidth,
        window.innerHeight
      );
    };

    const scheduleRefit = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(refitImages);
    };

    window.addEventListener("resize", scheduleRefit);

    // Observe the layout portal (not the SVG host) so growth and shrink both fire.
    const portal = document.getElementById(MAIN_PORTAL_ID);
    const observer =
      portal && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleRefit)
        : null;
    if (portal && observer) {
      observer.observe(portal);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleRefit);
      observer?.disconnect();
    };
  }, []);

  const generate = (
    randomized?: RandomiserReturnType,
    planView?: boolean
  ) => {
    const curveState = randomized?.[0] ?? config.state;
    const path = randomized?.[1] ?? config.pathState;
    const active = randomized?.[2] ?? config.activeCellState;
    const inside = randomized?.[3] ?? config.insideCellState;
    const outside = randomized?.[4] ?? config.outsideCellState;

    let sd = LEFT;
    if (path.startDirection === "random") {
      let directions = [UP, DOWN, LEFT, RIGHT];
      let index = Math.floor(Math.random() * 4);
      sd = directions[index];
    }

    if (path.startDirection === "LEFT") {
      sd = LEFT;
    }
    if (path.startDirection === "RIGHT") {
      sd = RIGHT;
    }
    if (path.startDirection === "UP") {
      sd = UP;
    }
    if (path.startDirection === "DOWN") {
      sd = DOWN;
    }

    let rc: RequestConfig = {
      OutSideFill: outside.fillEnabled,
      OutSideStroke: outside.borderEnabled,
      InsideFill: inside.fillEnabled,
      InsideStroke: inside.borderEnabled,
      ActiveFill: active.fillEnabled,
      ActiveStroke: active.borderEnabled,
      PathStroke: path.borderEnabled,
      NoCells: false,
      GridLines: curveState.gridlines,
      TileBlockGridSize: curveState.tileBlockGridSize,
      NumberFolds: Number(curveState.folds),
      Radius: Number(curveState.radius),
      StartDirection: sd,
      CellType: curveState.cellType,
      OriginX: 0,
      OrignY: 0,
      Margin: Number(curveState.margin.replace(/px/g, "")),
      InsideStrokeColorRaw: inside.borderColor,
      InsideFillColorRaw: inside.backgroundColor,
      OutsideStrokeColorRaw: outside.borderColor,
      OutsideFillColorRaw: outside.backgroundColor,
      ActiveStrokeColorRaw: active.borderColor,
      ActiveFillColorRaw: active.backgroundColor,
      PathStrokeColorRaw: path.borderColor,
      GroutingColorRaw: curveState.groutingColor,
      InsideStrokeWidth: Number(inside.borderWidth.replace(/px/g, "")),
      OutsideStrokeWidth: Number(outside.borderWidth.replace(/px/g, "")),
      ActiveStrokeWidth: Number(active.borderWidth.replace(/px/g, "")),
      PathWidth: Number(path.borderWidth.replace(/px/g, "")),
      Grouting: Number(curveState.grouting.replace(/px/g, "")),
      TriangleAngle: Number(curveState.triangleAngle),
      Format: "",
    };
    rc = applyNoCellsOverrides(rc, curveState.noCells);

    let size: [number, number];
    let svgContent: string;
    const usePlanView = planView ?? config.settingsConfig.planView;
    if (usePlanView) {
      svgContent = getPlansDisplaySVG(rc);
      size = getPlansSizeSVG(rc);
    } else {
      size = getDragonSizeSVG(rc);
      svgContent = getDragonSVG(rc);
    }
    let w = size[0];
    let h = size[1];
    intrinsicSizeRef.current = { width: w, height: h };

    const titleBar = document.querySelector(".dragon-app .top-bar");
    const titleBarHeight = titleBar?.getBoundingClientRect().height ?? 56;
    const sidebar = document.querySelector(".dragon-app .dragon-sidebar");
    const sidebarWidth = sidebar?.getBoundingClientRect().width ?? 400;
    const mainFallbackWidth = Math.max(window.innerWidth - sidebarWidth - 24, 100);
    const mainFallbackHeight = Math.max(
      window.innerHeight - titleBarHeight - 16,
      100
    );

    const imgElement = document.getElementById(MAIN_IMAGE_ID);
    const fitted = applySvgSize(
      imgElement,
      MAIN_PORTAL_ID,
      svgContent,
      w,
      h,
      mainFallbackWidth,
      mainFallbackHeight
    );
    if (fitted) {
      config.setImageSize({
        ...config.imageSize,
        width: `${fitted.width}px`,
        height: `${fitted.height}px`,
        zoom: fitted.zoom,
      });
    }
    config.setDirty(false);

    const imgElementFS = document.getElementById(FULLSCREEN_IMAGE_ID);
    applySvgSize(
      imgElementFS,
      FULLSCREEN_IMAGE_ID,
      svgContent,
      w,
      h,
      window.innerWidth,
      window.innerHeight
    );

    if (
      config.settingsConfig.animatePath &&
      !usePlanView &&
      !config.slideShow
    ) {
      schedulePathAnimation(imgElement);
      schedulePathAnimation(imgElementFS);
    }

    // Auto-download if slideshow is running and auto-download is enabled
    // Use refs to check state (more reliable than Context state due to async updates)
    if (intervalIdRef.current !== null && !slideShowPauseRef.current && autoDownloadRef.current) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const paletteName = paletteRef.current;
      const fname = `${paletteName}_DragonCurve_${timestamp}.svg`;
      downloadSVG(svgContent, fname);
    }

    let json = JSON.stringify(buildSavedConfig(config), null, 2);

    config.setConfigJSON(json);
  };

  const generateRef = useRef(generate);
  generateRef.current = generate;

  useEffect(() => {
    config.registerRegenerateCurve((snapshot) => {
      generateRef.current(snapshot);
    });
  }, [config.registerRegenerateCurve]);

  function startInterval() {
    // Turns depend only on fold count. Precompute for the current folds and
    // every fold count the slideshow randomiser may pick (7–11).
    const currentFolds = Number(config.state.folds);
    precalculateTurns([currentFolds, 7, 8, 9, 10, 11]);

    config.setSlideShow(true);
    const intervalId = setInterval(() => {
      if (!slideShowPauseRef.current) {
        const randomized = setSlideShowRandomFunction();
        generate(randomized);
      }
    }, config.settingsConfig.slideShowInterval * 1000);
    const intervalIdNumber = intervalId as unknown as number;
    intervalIdRef.current = intervalIdNumber;
    config.setIntervalID(intervalIdNumber);
  }

  function changeSlideShowInterval() {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    startInterval();
  }

  const randomDragonCurve = () => {
    startInterval();
  };

  const stopSlideShowNow = () => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      config.setIntervalID(null);
    }
    slideShowPauseRef.current = false;
    config.setSlideShow(false);
    config.setSlideShowPause(false);
  };

  const pauseSlideShowNow = () => {
    slideShowPauseRef.current = true;
    config.setSlideShowPause(true);
  };
  const resumeSlideShowNow = () => {
    slideShowPauseRef.current = false;
    config.setSlideShowPause(false);
  };

  function saveCurrentSlide(): void {
    downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
  }

  // Defintion of the tooltip for various buttons
  const renderCurrentSizeTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Generates a random dragon curve until the "Stop Slide Show" button is
      clicked.
    </Tooltip>
  );

  return (
    <>
      {/* This div is an overlay to the main Control div which is shown when a slide show is executing */}
      <div
        className="dragon-sidebar-overlay"
        style={{ display: config.slideShow ? "block" : "none" }}
      >
        <Stack direction="vertical" gap={1} style={{ marginTop: "5px" }}>
          <FormLabel className="section-label">
            Randomisation Scheme
          </FormLabel>

          <FormControl
            as="select"
            value={config.randomiserScheme}
            onChange={(e) => {
              let t = e.target.value;
              config.setRandomiserScheme(t);
            }}
          >
            <option value="standard">Standard</option>
            <option value="noOutside">No Outside Cells</option>
            <option value="boldPath">Bold Path</option>
            <option value="pathOnly">Path Only</option>
            <option value="triangular">Triagular Path</option>
          </FormControl>
        </Stack>
        <Stack direction="vertical" gap={1} style={{ marginTop: "5px" }}>
          <FormLabel className="section-label">Color Pallette</FormLabel>

          <FormControl
            as="select"
            value={config.state.pallette}
            onChange={(e) => {
              let t = e.target.value;
              config.setState({ ...config.state, pallette: t });

              if (t === "randomhue") {
                config.setRandomHue(true);
              } else {
                config.setRandomHue(false);
              }
            }}
          >
            <option value="pastel">Pastel</option>
            <option value="vibrant">Vibrant</option>
            <option value="redhue">Red Hue</option>
            <option value="greenhue">Green Hue</option>
            <option value="bluehue">Blue Hue</option>
            <option value="randomhue">Random Hue</option>
            <option value="highcontrast">High Contrast</option>
            <option value="random">Random Colors</option>
            <option value="vangogh">Van Gogh</option>
            <option value="monet">Monet</option>
            <option value="blueyellow">Blue & Yellow</option>
            <option value="randomPallette">Random Pallette</option>
          </FormControl>
        </Stack>

        <Stack direction="vertical" gap={1} style={{ marginTop: "15px" }}>
          <Form.Check
            type="checkbox"
            label="Randomise cell type"
            checked={config.slideShowRandomiseCellType}
            onChange={(e) => {
              config.setSlideShowRandomiseCellType(e.target.checked);
            }}
          />
          <Form.Check
            type="checkbox"
            label="Auto-download each image"
            checked={config.slideShowAutoDownload || false}
            onChange={(e) => {
              const checked = e.target.checked;
              autoDownloadRef.current = checked;
              config.setSlideShowAutoDownload(checked);
            }}
          />

          <Container style={{ marginTop: "15px" }}>
            <Row className="mb-1">
              <Col xs={8}>
                <FormLabel>Interval (seconds)</FormLabel>
              </Col>
              <Col xs={4}>
                <input
                  type="number"
                  min="0.1"
                  max="60"
                  step="0.1"
                  value={config.settingsConfig.slideShowInterval}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (Number.isNaN(value)) {
                      return;
                    }
                    config.setSettingsConfig({
                      ...config.settingsConfig,
                      slideShowInterval: value,
                    });
                    changeSlideShowInterval();
                  }}
                />
              </Col>
            </Row>
          </Container>

          <Stack direction="vertical" gap={2} style={{ marginTop: "15px" }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                saveCurrentSlide();
              }}
              style={{
                width: "350px",
                display:
                  config.slideShow && !config.slideShowPause ? "block" : "none",
              }}
            >
              Save Current
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={() => {
                pauseSlideShowNow();
              }}
              style={{
                width: "350px",
                display:
                  config.slideShow && !config.slideShowPause ? "block" : "none",
              }}
            >
              Pause Slide Show
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                resumeSlideShowNow();
              }}
              style={{
                width: "350px",
                display:
                  config.slideShow && config.slideShowPause ? "block" : "none",
              }}
            >
              Resume Slide Show
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                config.setStopSlideShow(true);
                stopSlideShowNow();
              }}
              style={{
                width: "350px",
                display: config.slideShow ? "block" : "none",
              }}
            >
              Stop Slide Show
            </Button>
          </Stack>
        </Stack>
      </div>

      {/* This div is the main control div */}
      <div
        className="dragon-sidebar"
        style={{ display: config.slideShow ? "none" : "grid" }}
      >
        <div className="dragon-sidebar-inner">
          <div className="dragon-sidebar-panel">
            {/* The Cell Config Stack */}
            <Stack direction="vertical" gap={2}>
              <FormLabel className="section-label">
                Dragon Path and Tile Configuration
              </FormLabel>
              <PathConfig
                state={config.pathState}
                setState={config.setPathState}
                slideShow={config.slideShow}
                setDirty={config.setDirty}
              ></PathConfig>
              <CellConfig
                state={config.activeCellState}
                setState={config.setActiveCellState}
                slideShow={config.slideShow}
                setDirty={config.setDirty}
                isActive={true}
                activeState={config.activeCellState}
              ></CellConfig>
              <CellConfig
                state={config.insideCellState}
                setState={config.setInsideCellState}
                slideShow={config.slideShow}
                setDirty={config.setDirty}
                isActive={false}
                activeState={config.activeCellState}
              ></CellConfig>
              <CellConfig
                state={config.outsideCellState}
                setState={config.setOutsideCellState}
                slideShow={config.slideShow}
                setDirty={config.setDirty}
                isActive={false}
                activeState={config.activeCellState}
              ></CellConfig>
              <GroutingConfig
                state={config.state}
                setState={config.setState}
                slideShow={config.slideShow}
                setDirty={config.setDirty}
              ></GroutingConfig>
            </Stack>

            {/* The Dragon Curve Configuration Stack */}
            <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
              <Container>
                <Row>
                  <Col xs={6}>
                    <FormLabel>
                      Number Of Folds
                      <svg
                        onClick={() => {
                          config.setShowFoldsHelp(true);
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-circle"
                        viewBox="0 0 16 16"
                        style={{
                          marginLeft: "5px",
                          marginTop: "-5px",
                          cursor: "pointer",
                        }}
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                      </svg>
                    </FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.state.folds}
                      onChange={(e) => {
                        config.setDirty(true);
                        config.setState({
                          ...config.state,
                          folds: e.target.value,
                        });
                      }}
                    >
                      {[...Array(15).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <FormLabel>Tile Width</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.state.radius}
                      onChange={(e) => {
                        config.setDirty(true);
                        config.setState({
                          ...config.state,
                          radius: e.target.value,
                        });
                      }}
                    >
                      {[...Array(50).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </Row>

                <Row>
                  <Col xs={6}>
                    <FormLabel>Outer Margin</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.state.margin}
                      onChange={(e) => {
                        config.setDirty(true);
                        config.setState({
                          ...config.state,
                          margin: e.target.value,
                        });
                      }}
                    >
                      {[...Array(20).keys()].map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <FormLabel>Background</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.settingsConfig.background}
                      onChange={(e) => {
                        config.setSettingsConfig({
                          ...config.settingsConfig,
                          background: e.target.value,
                        });
                      }}
                    >
                      <option value="darksky">Dark Sky</option>
                      <option value="auroraboreal">Aurora Boreal</option>
                      <option value="nightgradient">Night Sky</option>
                      <option value="dawngradient">Dawn Sky</option>
                      <option value="sunsetgradient">Sunset Sky</option>
                      <option value="plain">Plain Color</option>
                    </FormControl>
                  </Col>
                </Row>

                <Row>
                  <Col xs={6}>
                    <FormLabel>Grid overlay (tiles)</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.state.tileBlockGridSize}
                      onChange={(e) => {
                        const size = Number(e.target.value);
                        const newState = {
                          ...config.state,
                          tileBlockGridSize: size,
                        };
                        config.setState(newState);
                        generate([
                          newState,
                          config.pathState,
                          config.activeCellState,
                          config.insideCellState,
                          config.outsideCellState,
                        ]);
                      }}
                    >
                      {[...Array(11).keys()].map((i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "Off" : `${i}×${i}`}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <FormLabel>
                      Tile Renderer
                      <svg
                        onClick={() => {
                          config.setShowRendererHelp(true);
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-circle"
                        viewBox="0 0 16 16"
                        style={{
                          marginLeft: "5px",
                          marginTop: "-5px",
                          cursor: "pointer",
                        }}
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                      </svg>
                    </FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      disabled={config.slideShow}
                      size="sm"
                      as="select"
                      value={config.state.cellType}
                      onChange={(e) => {
                        config.setDirty(true);
                        config.setState({
                          ...config.state,
                          cellType: e.target.value,
                        });
                      }}
                    >
                      <option value="quadrant">Quadrant</option>
                      <option value="triangle">Triangle</option>
                      <option value="line">Line</option>
                      <option value="corner">Corner</option>
                      <option value="knuth">Knuth Tile</option>
                      <option value="knuthcurve">Knuth Tile Curve</option>
                      <option value="knuthtri">Knuth Tile Triangle</option>
                    </FormControl>
                  </Col>
                </Row>

                <Row>
                  <Col xs={6}>
                    <FormLabel>Triangle Angle</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <FormControl
                      size="sm"
                      as="select"
                      disabled={
                        config.slideShow ||
                        (config.state.cellType !== "triangle" &&
                          config.state.cellType !== "knuthtri")
                      }
                      value={config.state.triangleAngle}
                      onChange={(e) => {
                        config.setDirty(true);
                        config.setState({
                          ...config.state,
                          triangleAngle: e.target.value,
                        });
                      }}
                    >
                      <option value="-1">Random</option>
                      {[...Array(91).keys()].map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </FormControl>
                  </Col>
                </Row>
                <Row>
                <Col xs={6}>
                    <FormLabel>Plan View</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <Form.Check
                      type="checkbox"
                      checked={config.settingsConfig.planView}
                      disabled={config.slideShow}
                      onChange={(e) => {
                        const planView = e.target.checked;
                        config.setSettingsConfig({
                          ...config.settingsConfig,
                          planView,
                        });
                        generate(undefined, planView);
                      }}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <FormLabel>No Cells</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <Form.Check
                      type="checkbox"
                      checked={config.state.noCells}
                      disabled={config.slideShow}
                      onChange={(e) => {
                        const noCells = e.target.checked;
                        const newState = {
                          ...config.state,
                          noCells,
                        };
                        config.setState(newState);
                        generate([
                          newState,
                          config.pathState,
                          config.activeCellState,
                          config.insideCellState,
                          config.outsideCellState,
                        ]);
                      }}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <FormLabel>Animate Path</FormLabel>
                  </Col>
                  <Col xs={6}>
                    <Form.Check
                      type="checkbox"
                      checked={config.settingsConfig.animatePath}
                      disabled={config.slideShow || config.settingsConfig.planView}
                      onChange={(e) => {
                        const animatePath = e.target.checked;
                        config.setSettingsConfig({
                          ...config.settingsConfig,
                          animatePath,
                        });
                        if (animatePath) {
                          schedulePathAnimation(
                            document.getElementById(MAIN_IMAGE_ID)
                          );
                          schedulePathAnimation(
                            document.getElementById(FULLSCREEN_IMAGE_ID)
                          );
                        } else {
                          generate();
                        }
                      }}
                    />
                  </Col>
                </Row>
              </Container>
            </Stack>

            {/* The Top Button Stack */}
            <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
              <Button
                id="generate-dragon-curve-button"
                size="sm"
                variant="primary"
                onClick={() => generate()}
                disabled={config.slideShow}
                style={{
                  width: "350px",
                  display: config.dirty ? "none" : "block",
                }}
              >
                Regenerate Current Dragon Curve
              </Button>

              <Button
                size="sm"
                variant="success"
                onClick={() => generate()}
                disabled={config.slideShow}
                style={{
                  width: "350px",
                  display: config.dirty ? "block" : "none",
                }}
              >
                Generate Dragon Curve
              </Button>
              <div
                style={{
                  display: "flex",
                  width: "350px",
                  justifyContent: "center",
                }}
              ></div>
            </Stack>

            {/* The Slideshow Button  Stack */}
            <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
              {/* <FormLabel style={{ fontWeight: "bold" }}>
                Slideshow of Random Dragon Curve
              </FormLabel> */}
              <Stack direction="horizontal" gap={1}>
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderCurrentSizeTooltip}
                >
                  <Button
                    disabled={config.slideShow}
                    size="sm"
                    variant="primary"
                    onClick={randomDragonCurve}
                    style={{ width: "350px" }}
                  >
                    Random Curve Slide Show
                  </Button>
                </OverlayTrigger>
                {/* <OverlayTrigger
                  placement="right"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderRandomTooltip}
                >
                  <Button
                    disabled={config.slideShow}
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      config.setSlideShowConfig(true);
                    }}
                    style={{ width: "60px" }}
                  >
             
                    <svg
                      onClick={() => {
                        config.setSlideShowConfig(true);
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-info-circle"
                      viewBox="0 0 16 16"
                      style={{
                        marginLeft: "5px",
                        marginTop: "-5px",
                        cursor: "pointer",
                      }}
                    >
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
                    </svg>
                  </Button>
                </OverlayTrigger> */}
              </Stack>
            </Stack>

            <FoldsModal />
            <SaveCurveModal />
            <LoadCurveModal />
            <RendererHelpModal />
            <FoldsHelpModal />
            <ConfigSlideShowModal />
          </div>
        </div>
        {/* The Miscellaneous Button Stack */}
        <ControlLayoutButtons setShowFullScreen={setShowFullScreen} />
      </div>
    </>
  );
}
