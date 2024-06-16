import { RefAttributes, useContext, useEffect, useState } from "react";
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
import axios from "axios";
import { JSX } from "react/jsx-runtime";
import GroutingConfig from "../Widgets/GroutingConfigWidget";
import myGlobalObject from "../globals";
import ControlLayoutButtons from "./ControlLayoutButtons";
import {
  DOWN,
  LEFT,
  RIGHT,
  RequestConfig,
  UP,
  calculateTurns,
} from "../servertsx/common";
import { CurrentConfigContext } from "../Contexts";
import CollageModal from "../DialogBoxes/CreateCollageModal";
import SettingsModal from "../DialogBoxes/SettingsModal";
import DownloadingModal from "../DialogBoxes/DownloadingModal";
import FoldsModal from "../DialogBoxes/RawConfigModal";
import ConfigSlideShowModal from "../DialogBoxes/ConfigSlideShowModal";
import FoldsHelpModal from "../DialogBoxes/FoldsHelpModal";
import RendererHelpModal from "../DialogBoxes/RendererHelpModal";
import LoadCurveModal from "../DialogBoxes/LoadCurveModal";
import SaveCurveModal from "../DialogBoxes/SaveCurveModal";
import DownloadZipModal from "../DialogBoxes/DownloadZipModal";
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

export default function ControlLayout({
  randomDragonCurveLocal,
  randomDragonCurveLocalCurrentSize,
  setFSImageSize,
}: {
  randomDragonCurveLocal: any;
  randomDragonCurveLocalCurrentSize: any;
  setFSImageSize: any;
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

  const getSingleURL = () => {
    var newURL =
      config.urlHead +
      `/getTile?
  &folds=${config.state.folds}
  &margin=${config.state.margin}
  &cellType=${config.state.cellType}
  &triangleAngle=${config.state.triangleAngle}
  &radius=${config.state.radius}
  &grouting=${config.state.grouting}
  &groutingColor=${config.state.groutingColor}
  &gridlines=${config.state.gridlines}
  &startDirection=${config.pathState.startDirection}
  &pathStroke=${config.pathState.borderEnabled}
  &pathWidth=${config.pathState.borderWidth}
  &pathStrokeColor=${config.pathState.borderColor}
  &outsideFill=${config.outsideCellState.fillEnabled}
  &outsideFillColor=${config.outsideCellState.backgroundColor}
  &outsideStroke=${config.outsideCellState.borderEnabled}
  &outsideStrokeWidth=${config.outsideCellState.borderWidth}
  &outsideStrokeColor=${config.outsideCellState.borderColor}
  &insideFill=${config.insideCellState.fillEnabled}
  &insideFillColor=${config.insideCellState.backgroundColor}
  &insideStroke=${config.insideCellState.borderEnabled}
  &insideStrokeWidth=${config.insideCellState.borderWidth}
  &insideStrokeColor=${config.insideCellState.borderColor}
  &activeFill=${config.activeCellState.fillEnabled}
  &activeFillColor=${config.activeCellState.backgroundColor}
  &activeStroke=${config.activeCellState.borderEnabled}
  &activeStrokeWidth=${config.activeCellState.borderWidth}
  &activeStrokeColor=${config.activeCellState.borderColor}
  &random=${Math.random()}`
        .replace(/#/g, "")
        .replace(/\s/g, "");

    return newURL;
  };

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
      CellType: "knuthcurve",
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
      TriangleAngle: 30,
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

    // Now get the full screen image size
    let [imgSXFS, imgSYFS, zoomFS] = calculateImageSize(w, h, true);
    setFSImageSize({
      width: imgSXFS,
      height: imgSYFS,
      zoom: zoomFS,
    });

    let svgContent = getDragonSVG(rc);
    const imgElement = document.getElementById(
      "imageHTMLElement"
    ) as HTMLImageElement;
    if (imgElement) {
      imgElement.innerHTML = svgContent;
      config.setDirty(false);
    }

    //console.log(s);

    // var newURL = getSingleURL();

    //    var sizeURL = newURL.replace("getTile", "getSize");
    // axios({
    //   url: sizeURL, //your url
    //   method: "POST",
    //   responseType: "json", // important
    //   data: JSON.stringify(calculateTurns(9)),
    // }).then((response) => {
    //   let [imgSX, imgSY, zoom] = calculateImageSize(
    //     response.data.width,
    //     response.data.height,
    //     false
    //   );
    //   config.setImageSize({
    //     ...config.imageSize,
    //     width: imgSX,
    //     height: imgSY,
    //     zoom: zoom,
    //   });

    //   // Now get the full screen image size
    //   let [imgSXFS, imgSYFS, zoomFS] = calculateImageSize(
    //     response.data.width,
    //     response.data.height,
    //     true
    //   );
    //   setFSImageSize({
    //     width: imgSXFS,
    //     height: imgSYFS,
    //     zoom: zoomFS,
    //   });

    //   config.setDirty(false);
    //   config.updateImage(newURL);
    // });
  };

  const randomDragonCurve = () => {
    if (config.slideShow) {
      return;
    }
    config.setSlideShow(true);
    randomDragonCurveLocal();
    generate();
    myGlobalObject.stopSlideShow = false;
    const interval = setInterval(() => {
      if (myGlobalObject.stopSlideShow) {
        clearInterval(interval);
        config.setSlideShow(false);
      } else {
        randomDragonCurveLocal();
        generate();
      }
    }, config.settingsConfig.slideShowInterval * 1000);
  };

  const stopSlideShowNow = () => {
    config.setSlideShow(false);
  };

  const randomDragonCurveCurrentSize = () => {
    if (config.slideShow) {
      return;
    }
    if (config.slideShowRandomise) {
      randomDragonCurve();
      return;
    }

    config.setSlideShow(true);
    randomDragonCurveLocalCurrentSize();
    generate();
    myGlobalObject.stopSlideShow = false;
    const interval = setInterval(() => {
      if (myGlobalObject.stopSlideShow) {
        clearInterval(interval);
        config.setSlideShow(false);
      } else {
        randomDragonCurveLocalCurrentSize();
        generate();
      }
    }, config.settingsConfig.slideShowInterval * 1000);
  };

  const collageSlideShow = () => {
    config.setSlideShow(true);
    myGlobalObject.stopSlideShow = false;
    var url =
      config.urlHead +
      `/prepareCollage?width=${config.collageConfig.width}&height=${config.collageConfig.height}&elementWidth=${config.collageConfig.elementWidth}&startDirection=${config.collageConfig.startDirection}&gap=${config.collageConfig.elementGap}&backgroundColor=${config.collageConfig.gapColor}&format=${config.collageConfig.format}`
        .replace(/#/g, "")
        .replace(/\s/g, "");
    axios({
      url: url, //your url
      method: "GET",
      responseType: "json", // important
    }).then((response) => {
      config.updateImage(
        config.urlHead +
          `/fetchCollage?key=${response.data.key}&format=${config.collageConfig.format}`
      );

      //wait 2 seconds and then call collageSlideShow again
      setTimeout(() => {
        if (!myGlobalObject.stopSlideShow) {
          collageSlideShow();
        } else {
          config.setSlideShow(false);
        }
      }, config.settingsConfig.slideShowInterval * 1000);
    });
  };

  const createCollage = () => {
    config.setCollageShow(true);
  };

  // Defintion of the tooltip for various buttons
  const renderCollageSlideShowTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Generate a collage of random dragon curves in a slide show format until
      the "Stop Slide Show" button is clicked.
    </Tooltip>
  );
  const renderCollageSlideShowConfigureTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Configure the collage slide show settings.
    </Tooltip>
  );
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

  const renderRandomTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Configre the random dragon curve slide show settings.
    </Tooltip>
  );

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
        <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
          <FormLabel style={{ fontWeight: "bold" }}>Color Pallette</FormLabel>
          <Form.Check
            type="radio"
            label="Pastel Colors"
            name="radioOptions"
            checked={
              myGlobalObject.colorPallete === "pastel" &&
              !myGlobalObject.randomHue
            }
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "pastel";
              config.setState({ ...config.state, pallette: "pastel" });
            }}
          />
          <Form.Check
            type="radio"
            label="Vibrant Colors"
            name="radioOptions"
            checked={
              myGlobalObject.colorPallete === "vibrant" &&
              !myGlobalObject.randomHue
            }
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "vibrant";
              config.setState({ ...config.state, pallette: "vibrant" });
            }}
          />
          <Form.Check
            type="radio"
            label="Red Hue Colors"
            name="radioOptions"
            checked={
              myGlobalObject.colorPallete === "redhue" &&
              !myGlobalObject.randomHue
            }
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "redhue";
              config.setState({ ...config.state, pallette: "redhue" });
            }}
          />
          <Form.Check
            type="radio"
            label="Green Hue Colors"
            name="radioOptions"
            checked={
              myGlobalObject.colorPallete === "greenhue" &&
              !myGlobalObject.randomHue
            }
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "greenhue";
              config.setState({ ...config.state, pallette: "greenhue" });
            }}
          />
          <Form.Check
            type="radio"
            label="Blue Hue Colors"
            name="radioOptions"
            checked={
              myGlobalObject.colorPallete === "bluehue" &&
              !myGlobalObject.randomHue
            }
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "bluehue";
              config.setState({ ...config.state, pallette: "bluehue" });
            }}
          />
          <Form.Check
            type="radio"
            label="Random Hue Set"
            name="radioOptions"
            checked={myGlobalObject.randomHue === true}
            onChange={() => {
              myGlobalObject.randomHue = true;
              myGlobalObject.colorPallete = "randomhue";
              config.setState({ ...config.state, pallette: "randomhue" });
            }}
          />
          <Form.Check
            type="radio"
            label="Random Colors"
            name="radioOptions"
            checked={myGlobalObject.colorPallete === "random"}
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "random";
              config.setState({ ...config.state, pallette: "random" });
            }}
          />
          <Form.Check
            type="radio"
            label="High Contrast Colors"
            name="radioOptions"
            checked={myGlobalObject.colorPallete === "highcontrast"}
            onChange={() => {
              myGlobalObject.randomHue = false;
              myGlobalObject.colorPallete = "highcontrast";
              config.setState({ ...config.state, pallette: "highcontrast" });
            }}
          />
          {/* <Container>
            <Row className="mb-1">
              <Col xs={8}>
                <FormLabel>Slide Show Interval (seconds)</FormLabel>
              </Col>
              <Col xs={2}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settingsConfig.slideShowInterval}
                  onChange={(e) => {
                    setSettingsConfig({
                      ...settingsConfig,
                      slideShowInterval: parseInt(e.target.value),
                    });
                  }}
                />
              </Col>
            </Row>
          </Container> */}

          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              myGlobalObject.stopSlideShow = true;
              //setStopSlideShow(true);
              stopSlideShowNow();
            }}
            style={{
              width: "280px",
              display: config.slideShow ? "block" : "none",
              marginTop: "15px",
            }}
          >
            Stop Slide Show
          </Button>
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
                    onClick={randomDragonCurveCurrentSize}
                    style={{ width: "220px" }}
                  >
                    Random Curve Slide Show
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger
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
                    {/* Randomise */}{" "}
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
                </OverlayTrigger>
              </Stack>
            </Stack>

            {/* The Collage Button  Stack */}
            <Stack direction="vertical" gap={1} style={{ marginTop: "5px" }}>
              {/* <FormLabel style={{ fontWeight: "bold" }}>
                Generate A Collage of Curves
              </FormLabel> */}
              <Stack direction="horizontal" gap={1}>
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderCollageSlideShowTooltip}
                >
                  <Button
                    disabled={config.slideShow}
                    size="sm"
                    variant="primary"
                    onClick={collageSlideShow}
                    style={{ width: "220px" }}
                  >
                    Collage Slide Show
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderCollageSlideShowConfigureTooltip}
                >
                  <Button
                    disabled={config.slideShow}
                    size="sm"
                    variant="primary"
                    onClick={createCollage}
                    style={{ width: "60px" }}
                  >
                    <svg
                      onClick={() => {
                        createCollage();
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
                </OverlayTrigger>
              </Stack>
            </Stack>
            <CollageModal />
            <SettingsModal />
            <DownloadingModal />
            <FoldsModal />
            <DownloadZipModal />
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
