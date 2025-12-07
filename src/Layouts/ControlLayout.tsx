import { RefAttributes, useContext, useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
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
import { DOWN, LEFT, RIGHT, RequestConfig, UP } from "../servertsx/common";
import { CurrentConfigContext } from "../Contexts";
import SettingsModal from "../DialogBoxes/SettingsModal";
import FoldsModal from "../DialogBoxes/RawConfigModal";
import ConfigSlideShowModal from "../DialogBoxes/ConfigSlideShowModal";
import FoldsHelpModal from "../DialogBoxes/FoldsHelpModal";
import RendererHelpModal from "../DialogBoxes/RendererHelpModal";
import LoadCurveModal from "../DialogBoxes/LoadCurveModal";
import SaveCurveModal from "../DialogBoxes/SaveCurveModal";
import axios from "axios";
import { getDragonSVG, getDragonSizeSVG } from "../servertsx/svg";

//var stopSlideShow = false;
var opened = true;

function calculateImageSize(
  imgWidth: number,
  imgHeight: number,
  fullScreen: boolean = false
): [string, string, string] {
  let hOffset = 120;
  let portalWidth = window.innerWidth - 350;
  let portalHeight = window.innerHeight - hOffset;

  if (fullScreen) {
    portalWidth = window.innerWidth;
    portalHeight = window.innerHeight;
  }

  let widthRatio = imgWidth / portalWidth;
  let heightRatio = imgHeight / portalHeight;

  // If the image is smaller than the portal, then just show the image
  if (widthRatio < 1 && heightRatio < 1) {
    return [imgWidth + "px", imgHeight + "px", "100"];
  }

  // If the image is wider than the portal, then zoom out
  if (widthRatio > 1 && heightRatio < 1) {
    let zoom = Math.round(100 / widthRatio);
    return [portalWidth + "px", "auto", String(zoom)];
  }

  // If the image is taller than the portal, then zoom out
  if (widthRatio < 1 && heightRatio > 1) {
    let zoom = Math.round(100 / heightRatio);
    return ["auto", portalHeight + "px", String(zoom)];
  }

  // If the image is wider and taller than the portal, then zoom out to the larger ratio
  if (widthRatio > 1 && heightRatio > 1) {
    if (widthRatio > heightRatio) {
      let zoom = Math.round(100 / widthRatio);
      return [portalWidth + "px", "auto", String(zoom)];
    } else {
      let zoom = Math.round(100 / heightRatio);
      return ["auto", portalHeight + "px", String(zoom)];
    }
  }

  return ["auto", "auto", "100"];
}

import { SetSlideShowRandomFunction } from "../types";

export default function ControlLayout({
  setSlideShowRandomFunction,
}: {
  setSlideShowRandomFunction: SetSlideShowRandomFunction;
}) {
  // Generate the initial image on load
  useEffect(() => {
    generate();
  }, [opened]);

  let config = useContext(CurrentConfigContext);

  const [configState] = useState({
    outside: config.outsideCellState,
    inside: config.insideCellState,
    active: config.activeCellState,
    path: config.pathState,
    state: config.state,
  });

  const generate = () => {
    let sd = LEFT;
    if (config.pathState.startDirection === "random") {
      let directions = [UP, DOWN, LEFT, RIGHT];
      let index = Math.floor(Math.random() * 4);
      sd = directions[index];
    }

    if (config.pathState.startDirection === "LEFT") {
      sd = LEFT;
    }
    if (config.pathState.startDirection === "RIGHT") {
      sd = RIGHT;
    }
    if (config.pathState.startDirection === "UP") {
      sd = UP;
    }
    if (config.pathState.startDirection === "DOWN") {
      sd = DOWN;
    }

    let rc: RequestConfig = {
      OutSideFill: config.outsideCellState.fillEnabled,
      OutSideStroke: config.outsideCellState.borderEnabled,
      InsideFill: config.insideCellState.fillEnabled,
      InsideStroke: config.insideCellState.borderEnabled,
      ActiveFill: config.activeCellState.fillEnabled,
      ActiveStroke: config.activeCellState.borderEnabled,
      PathStroke: config.pathState.borderEnabled,
      GridLines: config.state.gridlines,
      NumberFolds: Number(config.state.folds),
      Radius: Number(config.state.radius),
      StartDirection: sd,
      CellType: config.state.cellType,
      OriginX: 0,
      OrignY: 0,
      Margin: Number(config.state.margin.replace(/px/g, "")),
      InsideStrokeColorRaw: config.insideCellState.borderColor,
      InsideFillColorRaw: config.insideCellState.backgroundColor,
      OutsideStrokeColorRaw: config.outsideCellState.borderColor,
      OutsideFillColorRaw: config.outsideCellState.backgroundColor,
      ActiveStrokeColorRaw: config.activeCellState.borderColor,
      ActiveFillColorRaw: config.activeCellState.backgroundColor,
      PathStrokeColorRaw: config.pathState.borderColor,
      GroutingColorRaw: config.state.groutingColor,
      InsideStrokeWidth: Number(
        config.insideCellState.borderWidth.replace(/px/g, "")
      ),
      OutsideStrokeWidth: Number(
        config.outsideCellState.borderWidth.replace(/px/g, "")
      ),
      ActiveStrokeWidth: Number(
        config.activeCellState.borderWidth.replace(/px/g, "")
      ),
      PathWidth: Number(config.pathState.borderWidth.replace(/px/g, "")),
      Grouting: Number(config.state.grouting.replace(/px/g, "")),
      TriangleAngle: Number(config.state.triangleAngle),
      Format: "",
    };

    let size = getDragonSizeSVG(rc);
    let w = size[0];
    let h = size[1];

    let [imgSX, imgSY, zoom] = calculateImageSize(w, h, false);
    config.setImageSize({
      ...config.imageSize,
      width: imgSX,
      height: imgSY,
      zoom: zoom,
    });

    let svgContent = getDragonSVG(rc);
    const imgElement = document.getElementById(
      "imageHTMLElement"
    ) as HTMLImageElement;
    if (imgElement) {
      imgElement.innerHTML = svgContent;
      config.setDirty(false);
    }

    const imgElementFS = document.getElementById(
      "imageHTMLElementFullScreen"
    ) as HTMLImageElement;
    if (imgElementFS) {
      imgElementFS.innerHTML = svgContent;
      config.setDirty(false);
    }

    // Auto-download if slideshow is running and auto-download is enabled
    // Check if interval is running (intervalID will be a number when setInterval is active)
    const isSlideShowRunning = typeof config.intervalID === 'number' && !config.slideShowPause;
    if (isSlideShowRunning && config.slideShowAutoDownload) {
      const blob = new Blob([svgContent], {
        type: "application/svg+xml",
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const paletteName = config.state.pallette || "unknown";
      const fname = `${paletteName}_DragonCurve_${timestamp}.svg`;
      link.setAttribute("download", fname);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }

    let json = JSON.stringify(configState, null, 2);

    config.setConfigJSON(json);
  };

  function startInterval() {
    config.setSlideShow(true);
    const intervalId = setInterval(() => {
      if (!config.slideShowPause) {
        setSlideShowRandomFunction();
        generate();
      }
    }, config.settingsConfig.slideShowInterval * 1000);
    config.setIntervalID(intervalId as unknown as number);
  }

  function changeSlideShowInterval() {
    if (config.intervalID !== null) {
      clearInterval(config.intervalID);
    }
    startInterval();
  }

  const randomDragonCurve = () => {
    startInterval();
  };

  const stopSlideShowNow = () => {
    if (config.intervalID !== null) {
      clearInterval(config.intervalID);
      config.setIntervalID(null);
    }
    config.setSlideShow(false);
    config.setSlideShowPause(false);
  };

  const pauseSlideShowNow = () => {
    config.setSlideShowPause(true);
  };
  const resumeSlideShowNow = () => {
    config.setSlideShowPause(false);
  };

  function saveCurrentSlide(): void {
    const blob = new Blob([config.configJSON], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);

    // create "a" HTML element with href to file & click
    const link = document.createElement("a");
    link.href = href;
    var fname = `SaveDragonCurveConfig.json`;
    link.setAttribute("download", fname); //or any other extension
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
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

  const rateDragonCurve = (rating: number) => {
    let rc = JSON.parse(config.configJSON);
    rc.rating = rating;

    axios.post("/rate", rc);
  };

  return (
    <>
      {/* This div is an overlay to the main Control div which is shown when a slide show is executing */}
      <div
        className="form-control"
        style={{
          height: "calc(100vh - 90px)",
          display: config.slideShow ? "block" : "none",
          justifyContent: "left",
          alignItems: "center",
          width: "320px",
          backgroundColor: "#ccccccbb",
          paddingTop: "20px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Stack direction="vertical" gap={1} style={{ marginTop: "5px" }}>
          <FormLabel style={{ fontWeight: "bold" }}>
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
          <FormLabel style={{ fontWeight: "bold" }}>Color Pallette</FormLabel>

          <FormControl
            as="select"
            value={config.state.pallette}
            onChange={(e) => {
              let t = e.target.value;
              config.setState({ ...config.state, pallette: t });
              config.setSlideShowRandomise(t === "random" ? true : false);

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
            <option value="randomPallette">Random Pallette</option>
          </FormControl>
        </Stack>

        <Stack direction="vertical" gap={1} style={{ marginTop: "15px" }}>
          <FormLabel style={{ fontWeight: "bold" }}>Size</FormLabel>
          <Form.Check
            type="radio"
            label="Maintain Current Size"
            name="radioSizeOptions"
            checked={config.slideShowRandomise === false}
            onChange={() => {
              config.setSlideShowRandomise(false);
            }}
          />
          <Form.Check
            type="radio"
            label="Random Size"
            name="radioSizeOptions"
            checked={config.slideShowRandomise === true}
            onChange={() => {
              config.setSlideShowRandomise(true);
            }}
          />
          <Form.Check
            type="checkbox"
            label="Auto-download each image"
            checked={config.slideShowAutoDownload || false}
            onChange={(e) => {
              config.setSlideShowAutoDownload(e.target.checked);
            }}
            style={{ marginTop: "10px" }}
          />

          <Container style={{ marginTop: "15px" }}>
            <Row className="mb-1">
              <Col xs={8}>
                <FormLabel>Interval (seconds)</FormLabel>
              </Col>
              <Col xs={4}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.settingsConfig.slideShowInterval}
                  onChange={(e) => {
                    config.setSettingsConfig({
                      ...config.settingsConfig,
                      slideShowInterval: parseInt(e.target.value),
                    });
                    changeSlideShowInterval();
                  }}
                />
              </Col>
            </Row>
          </Container>

          <Stack direction="horizontal" gap={2}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                saveCurrentSlide();
              }}
              style={{
                width: "136px",
                display:
                  config.slideShow && !config.slideShowPause ? "block" : "none",
                marginTop: "15px",
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
                width: "136px",
                display:
                  config.slideShow && !config.slideShowPause ? "block" : "none",
                marginTop: "15px",
              }}
            >
              Pause Slide Show
            </Button>
          </Stack>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              resumeSlideShowNow();
            }}
            style={{
              width: "280px",
              display:
                config.slideShow && config.slideShowPause ? "block" : "none",
              marginTop: "15px",
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
              width: "280px",
              display: config.slideShow ? "block" : "none",
              marginTop: "5px",
            }}
          >
            Stop Slide Show
          </Button>
        </Stack>

        {/* This is the Feed the AI Monster Stack*/}
        <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
          <FormLabel style={{ fontWeight: "bold" }}>
            Feed the AI Monster
          </FormLabel>
          <FormLabel style={{ fontWeight: "normal" }}>
            Rate the displayed dragon curve
          </FormLabel>
          <ButtonGroup>
            <Button
              variant="outline-secondary"
              onClick={() => rateDragonCurve(1)}
            >
              1 Star
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => rateDragonCurve(2)}
            >
              2 Stars
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => rateDragonCurve(3)}
            >
              3 Stars
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => rateDragonCurve(4)}
            >
              4 Stars
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => rateDragonCurve(5)}
            >
              5 Stars
            </Button>
          </ButtonGroup>
        </Stack>
      </div>

      {/* This div is the main control div */}
      <div
        //className="form-control"
        style={{
          height: "calc(100vh - 90px)",
          display: config.slideShow ? "none" : "grid",
          gridTemplateRows: "1fr auto",
          justifyContent: "left",
          alignItems: "center",
          width: "320px",
          backgroundColor: "#ccccccbb",
          overflowY: "auto",
          overflowX: "hidden",
          paddingLeft: "12px",
          paddingRight: "12px",
          borderRadius: "5px",
        }}
      >
        {/* The inner shell of the control layout */}
        <div
          style={{
            display: "flex",
            flex: "1",
            flexDirection: "column",
            margin: "auto",
            width: "100%",
            minWidth: "308px",
            maxWidth: "308px",
            height: "100%",
            alignSelf: "start",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              minWidth: "280px",
              maxWidth: "280px",
              alignSelf: "start",
            }}
          >
            {/* The Cell Config Stack */}
            <Stack direction="vertical" gap={2}>
              <FormLabel style={{ fontWeight: "bold" }}>
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
                  <Col xs={8}>
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
                  <Col xs={4}>
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
                  <Col xs={8}>
                    <FormLabel>Tile Width</FormLabel>
                  </Col>
                  <Col xs={4}>
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
                  <Col xs={8}>
                    <FormLabel>Outer Margin</FormLabel>
                  </Col>
                  <Col xs={4}>
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
                  <Col xs={8}>
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
                  <Col xs={4}>
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
                          generateEnabled: true,
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
                  <Col xs={8}>
                    <FormLabel>Triangle Angle</FormLabel>
                  </Col>
                  <Col xs={4}>
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
                          generateEnabled: true,
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
              </Container>
            </Stack>

            {/* The Top Button Stack */}
            <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
              <Button
                id="generate-dragon-curve-button"
                size="sm"
                variant="primary"
                onClick={generate}
                disabled={config.slideShow}
                style={{
                  width: "280px",
                  display: config.dirty ? "none" : "block",
                }}
              >
                Regenerate Current Dragon Curve
              </Button>

              <Button
                size="sm"
                variant="success"
                onClick={generate}
                disabled={config.slideShow}
                style={{
                  width: "280px",
                  display: config.dirty ? "block" : "none",
                }}
              >
                Generate Dragon Curve
              </Button>
              <div
                style={{
                  display: "flex",
                  width: "280px",
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
                    style={{ width: "280px" }}
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

            <SettingsModal />
            <FoldsModal />
            <SaveCurveModal config={configState} />
            <LoadCurveModal />
            <RendererHelpModal />
            <FoldsHelpModal />
            <ConfigSlideShowModal />
          </div>
        </div>
        {/* The Miscellaneous Button Stack */}
        <ControlLayoutButtons />
      </div>
    </>
  );
}
