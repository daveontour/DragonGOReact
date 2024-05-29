import { RefAttributes, useEffect, useState } from "react";
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
import ModalsContainer from "./ModalsContainer";
import ControlLayoutButtons from "./ControlLayoutButtons";

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
  state,
  setState,
  pathState,
  setPathState,
  activeCellState,
  setActiveCellState,
  outsideCellState,
  setOutsideCellState,
  insideCellState,
  setInsideCellState,
  updateImage,
  randomDragonCurveLocal,
  randomDragonCurveLocalCurrentSize,
  urlHead,
  imageSize,
  setImageSize,
  setFSImageSize,
  slideShow,
  setSlideShow,
  settingsConfig,
  setSettingsConfig,
}: {
  state: any;
  setState: any;
  pathState: any;
  setPathState: any;
  activeCellState: any;
  setActiveCellState: any;
  outsideCellState: any;
  setOutsideCellState: any;
  insideCellState: any;
  setInsideCellState: any;
  updateImage: any;
  randomDragonCurveLocal: any;
  randomDragonCurveLocalCurrentSize: any;
  urlHead: string;
  imageSize: any;
  setImageSize: any;
  setFSImageSize: any;
  slideShow: boolean;
  setSlideShow: any;
  settingsConfig: any;
  setSettingsConfig: any;
}) {
  // Generate the initial image on load
  useEffect(() => {
    generate();
  }, [opened]);

  const [collageConfig, setCollageConfig] = useState({
    width: 7,
    height: 7,
    elementWidth: 100,
    elementGap: 5,
    gapColor: "#dddddd",
    startDirection: 0,
    format: "png",
  });
  const [downloadingShow, setDownloadingShow] = useState(false);
  const [collageShow, setCollageShow] = useState(false);
  const [settingsShow, setSettingsShow] = useState(false);
  const [foldsShow, setFoldsShow] = useState(false);
  const [zipShow, setZipShow] = useState(false);
  const [saveShow, setSaveShow] = useState(false);
  const [loadShow, setLoadShow] = useState(false);
  const [showRendererHelp, setShowRendererHelp] = useState(false);
  const [showFoldsHelp, setShowFoldsHelp] = useState(false);
  const [showSlideShowConfig, setSlideShowConfig] = useState(false);
  const [slideShowRandomise, setSlideShowRandomise] = useState(false);
  const [configState] = useState({
    outside: outsideCellState,
    inside: insideCellState,
    active: activeCellState,
    path: pathState,
    state: state,
  });
  //  const [slideShow, setSlideShow] = useState(false);

  const [dirty, setDirty] = useState(false);

  const getSingleURL = () => {
    var newURL =
      urlHead +
      `/getTile?
  &folds=${state.folds}
  &margin=${state.margin}
  &cellType=${state.cellType}
  &triangleAngle=${state.triangleAngle}
  &radius=${state.radius}
  &grouting=${state.grouting}
  &groutingColor=${state.groutingColor}
  &gridlines=${state.gridlines}
  &startDirection=${pathState.startDirection}
  &pathStroke=${pathState.borderEnabled}
  &pathWidth=${pathState.borderWidth}
  &pathStrokeColor=${pathState.borderColor}
  &outsideFill=${outsideCellState.fillEnabled}
  &outsideFillColor=${outsideCellState.backgroundColor}
  &outsideStroke=${outsideCellState.borderEnabled}
  &outsideStrokeWidth=${outsideCellState.borderWidth}
  &outsideStrokeColor=${outsideCellState.borderColor}
  &insideFill=${insideCellState.fillEnabled}
  &insideFillColor=${insideCellState.backgroundColor}
  &insideStroke=${insideCellState.borderEnabled}
  &insideStrokeWidth=${insideCellState.borderWidth}
  &insideStrokeColor=${insideCellState.borderColor}
  &activeFill=${activeCellState.fillEnabled}
  &activeFillColor=${activeCellState.backgroundColor}
  &activeStroke=${activeCellState.borderEnabled}
  &activeStrokeWidth=${activeCellState.borderWidth}
  &activeStrokeColor=${activeCellState.borderColor}
  &random=${Math.random()}`
        .replace(/#/g, "")
        .replace(/\s/g, "");

    return newURL;
  };

  const generate = () => {
    var newURL = getSingleURL();
    var sizeURL = newURL.replace("getTile", "getSize");
    axios({
      url: sizeURL, //your url
      method: "GET",
      responseType: "json", // important
    }).then((response) => {
      let [imgSX, imgSY, zoom] = calculateImageSize(
        response.data.width,
        response.data.height,
        false
      );
      setImageSize({
        ...imageSize,
        width: imgSX,
        height: imgSY,
        zoom: zoom,
      });

      // Now get the full screen image size
      let [imgSXFS, imgSYFS, zoomFS] = calculateImageSize(
        response.data.width,
        response.data.height,
        true
      );
      setFSImageSize({
        width: imgSXFS,
        height: imgSYFS,
        zoom: zoomFS,
      });

      setDirty(false);
      updateImage(newURL);
    });
  };

  const randomDragonCurve = () => {
    if (slideShow) {
      return;
    }
    setSlideShow(true);
    randomDragonCurveLocal();
    generate();
    myGlobalObject.stopSlideShow = false;
    const interval = setInterval(() => {
      if (myGlobalObject.stopSlideShow) {
        clearInterval(interval);
        setSlideShow(false);
      } else {
        randomDragonCurveLocal();
        generate();
      }
    }, settingsConfig.slideShowInterval * 1000);
  };

  const stopSlideShowNow = () => {
    setSlideShow(false);
  };

  const randomDragonCurveCurrentSize = () => {
    if (slideShow) {
      return;
    }
    if (slideShowRandomise) {
      randomDragonCurve();
      return;
    }

    setSlideShow(true);
    randomDragonCurveLocalCurrentSize();
    generate();
    myGlobalObject.stopSlideShow = false;
    const interval = setInterval(() => {
      if (myGlobalObject.stopSlideShow) {
        clearInterval(interval);
        setSlideShow(false);
      } else {
        randomDragonCurveLocalCurrentSize();
        generate();
      }
    }, settingsConfig.slideShowInterval * 1000);
  };

  const collageSlideShow = () => {
    setSlideShow(true);
    myGlobalObject.stopSlideShow = false;
    var url =
      urlHead +
      `/prepareCollage?width=${collageConfig.width}&height=${collageConfig.height}&elementWidth=${collageConfig.elementWidth}&startDirection=${collageConfig.startDirection}&gap=${collageConfig.elementGap}&backgroundColor=${collageConfig.gapColor}&format=${collageConfig.format}`
        .replace(/#/g, "")
        .replace(/\s/g, "");
    axios({
      url: url, //your url
      method: "GET",
      responseType: "json", // important
    }).then((response) => {
      updateImage(
        urlHead +
          `/fetchCollage?key=${response.data.key}&format=${collageConfig.format}`
      );

      //wait 2 seconds and then call collageSlideShow again
      setTimeout(() => {
        if (!myGlobalObject.stopSlideShow) {
          collageSlideShow();
        } else {
          setSlideShow(false);
        }
      }, settingsConfig.slideShowInterval * 1000);
    });
  };

  const createCollage = () => {
    setCollageShow(true);
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
          display: slideShow ? "block" : "none",
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
              setState({ ...state, pallette: "pastel" });
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
              setState({ ...state, pallette: "vibrant" });
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
              setState({ ...state, pallette: "redhue" });
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
              setState({ ...state, pallette: "greenhue" });
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
              setState({ ...state, pallette: "bluehue" });
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
              setState({ ...state, pallette: "randomhue" });
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
              setState({ ...state, pallette: "random" });
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
              setState({ ...state, pallette: "highcontrast" });
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
              display: slideShow ? "block" : "none",
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
          display: slideShow ? "none" : "grid",
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
                state={pathState}
                setState={setPathState}
                slideShow={slideShow}
                setDirty={setDirty}
              ></PathConfig>
              <CellConfig
                state={activeCellState}
                setState={setActiveCellState}
                slideShow={slideShow}
                setDirty={setDirty}
                isActive={true}
                activeState={activeCellState}
              ></CellConfig>
              <CellConfig
                state={insideCellState}
                setState={setInsideCellState}
                slideShow={slideShow}
                setDirty={setDirty}
                isActive={false}
                activeState={activeCellState}
              ></CellConfig>
              <CellConfig
                state={outsideCellState}
                setState={setOutsideCellState}
                slideShow={slideShow}
                setDirty={setDirty}
                isActive={false}
                activeState={activeCellState}
              ></CellConfig>
              <GroutingConfig
                state={state}
                setState={setState}
                slideShow={slideShow}
                setDirty={setDirty}
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
                          setShowFoldsHelp(true);
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
                      disabled={slideShow}
                      size="sm"
                      as="select"
                      value={state.folds}
                      onChange={(e) => {
                        setDirty(true);
                        setState({
                          ...state,
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
                      disabled={slideShow}
                      size="sm"
                      as="select"
                      value={state.radius}
                      onChange={(e) => {
                        setDirty(true);
                        setState({
                          ...state,
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
                      disabled={slideShow}
                      size="sm"
                      as="select"
                      value={state.margin}
                      onChange={(e) => {
                        setDirty(true);
                        setState({
                          ...state,
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
                          setShowRendererHelp(true);
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
                      disabled={slideShow}
                      size="sm"
                      as="select"
                      value={state.cellType}
                      onChange={(e) => {
                        setDirty(true);
                        setState({
                          ...state,
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
                        slideShow ||
                        (state.cellType !== "triangle" &&
                          state.cellType !== "knuthtri")
                      }
                      value={state.triangleAngle}
                      onChange={(e) => {
                        setDirty(true);
                        setState({
                          ...state,
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
                disabled={slideShow}
                style={{
                  width: "280px",
                  display: dirty ? "none" : "block",
                }}
              >
                Regenerate Current Dragon Curve
              </Button>

              <Button
                size="sm"
                variant="success"
                onClick={generate}
                disabled={slideShow}
                style={{
                  width: "280px",
                  display: dirty ? "block" : "none",
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
                    disabled={slideShow}
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
                    disabled={slideShow}
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSlideShowConfig(true);
                    }}
                    style={{ width: "60px" }}
                  >
                    {/* Randomise */}{" "}
                    <svg
                      onClick={() => {
                        setSlideShowConfig(true);
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
                    disabled={slideShow}
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
                    disabled={slideShow}
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

            {/* The Miscellaneous Button Stack */}

            <ModalsContainer
              collageConfig={collageConfig}
              setCollageConfig={setCollageConfig}
              collageShow={collageShow}
              setCollageShow={setCollageShow}
              downloadingShow={downloadingShow}
              setSettingsShow={setSettingsShow}
              setFoldsShow={setFoldsShow}
              setSaveShow={setSaveShow}
              setLoadShow={setLoadShow}
              state={state}
              pathState={pathState}
              activeCellState={activeCellState}
              outsideCellState={outsideCellState}
              insideCellState={insideCellState}
              setActiveCellState={setActiveCellState}
              setOutsideCellState={setOutsideCellState}
              setInsideCellState={setInsideCellState}
              setPathState={setPathState}
              setState={setState}
              urlHead={urlHead}
              settingsShow={settingsShow}
              settingsConfig={settingsConfig}
              setSettingsConfig={setSettingsConfig}
              zipShow={zipShow}
              setZipShow={setZipShow}
              updateImage={updateImage}
              foldsShow={foldsShow}
              saveShow={saveShow}
              loadShow={loadShow}
              setDirty={setDirty}
              showRendererHelp={showRendererHelp}
              setShowRendererHelp={setShowRendererHelp}
              configState={configState}
              showFoldsHelp={showFoldsHelp}
              setShowFoldsHelp={setShowFoldsHelp}
              showSlideShowConfig={showSlideShowConfig}
              setSlideShowConfig={setSlideShowConfig}
              slideShowRandomise={slideShowRandomise}
              setSlideShowRandomise={setSlideShowRandomise}
            />
          </div>
        </div>
        <ControlLayoutButtons
          state={state}
          pathState={pathState}
          activeCellState={activeCellState}
          outsideCellState={outsideCellState}
          insideCellState={insideCellState}
          urlHead={urlHead}
          setDownloadingShow={setDownloadingShow}
          setSettingsShow={setSettingsShow}
          setFoldsShow={setFoldsShow}
          setSaveShow={setSaveShow}
          setLoadShow={setLoadShow}
        />
      </div>
    </>
  );
}
