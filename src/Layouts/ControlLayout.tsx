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
import DownloadingModal from "../DialogBoxes/DownloadingModal";
import CollageModal from "../DialogBoxes/CreateCollageModal";
import FoldsModal from "../DialogBoxes/RawConfigModal";
import DownloadZipModal from "../DialogBoxes/DownloadZipModal";
import SaveCurveModal from "../DialogBoxes/SaveCurveModal";
import LoadCurveModal from "../DialogBoxes/LoadCurveModal";
import { JSX } from "react/jsx-runtime";
import GroutingConfig from "../Widgets/GroutingConfigWidget";
import myGlobalObject from "../globals";
import SettingsModal from "../DialogBoxes/SettingsModal";
import RendererHelpModal from "../DialogBoxes/RendererHelpModal";

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
  const [configState, setConfigState] = useState({
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

  const downloadRawTurns = () => {
    setFoldsShow(true);
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

  const downloadDragonCurveSVG = () => {
    setDownloadingShow(true);
    var url = getSingleURL();

    axios({
      url: url, //your url
      method: "GET",
      responseType: "blob", // important
    }).then((response) => {
      // create file link in browser's memory
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement("a");
      link.href = href;
      link.setAttribute("download", "Dragon.svg"); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setDownloadingShow(false);
    });
  };

  const createCollage = () => {
    setCollageShow(true);
  };

  // const createZip = () => {
  //   setZipShow(true);
  // };

  const loadCurve = () => {
    setLoadShow(true);
  };

  const saveCurve = () => {
    setConfigState({
      ...configState,
      state: state,
      inside: insideCellState,
      outside: outsideCellState,
      active: activeCellState,
      path: pathState,
    });
    setSaveShow(true);
  };

  // Defintion of the tooltip for various buttons
  const renderCurrentSizeTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Generates a random dragon curve with the current size configuration
      settings until the "Stop Slide Show" button is clicked.
    </Tooltip>
  );

  const renderRandomTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Generates a random dragon curve with random configuration settings until
      the "Stop Slide Show" button is clicked.
    </Tooltip>
  );
  const renderSaveTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Save the configuration settings of the current dragon curve by showing the
      underlying configuration which can be saved as a JSON file.
    </Tooltip>
  );
  const renderLoadTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Load a previously saved configuration settings of a dragon curve by
      uploading a JSON file.
    </Tooltip>
  );
  const renderDownLoadTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Download the SVG file of the current dragon curve.
    </Tooltip>
  );
  const renderSettingsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Open the settings dialog box to change the general settings.
    </Tooltip>
  );
  const renderTurnsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Download the sequence of turns for an artbitrary number of folds of a
      dragon curve.
    </Tooltip>
  );
  const renderHelpTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Opens the help dialog box. (not implemented yet)
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
        className="form-control"
        style={{
          height: "calc(100vh - 90px)",
          display: slideShow ? "none" : "grid",
          justifyContent: "left",
          alignItems: "center",
          width: "320px",
          backgroundColor: "#ccccccbb",
          paddingTop: "20px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* The inner shell of the control layout */}
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
            <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={renderLoadTooltip}
            >
              <CellConfig
                state={activeCellState}
                setState={setActiveCellState}
                slideShow={slideShow}
                setDirty={setDirty}
                isActive={true}
                activeState={activeCellState}
              ></CellConfig>
            </OverlayTrigger>
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
                <Col xs={7}>
                  <FormLabel>Number Of Folds</FormLabel>
                </Col>
                <Col xs={5}>
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
                <Col xs={7}>
                  <FormLabel>Tile Width</FormLabel>
                </Col>
                <Col xs={5}>
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
                <Col xs={7}>
                  <FormLabel>Outer Margin</FormLabel>
                </Col>
                <Col xs={5}>
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
                <Col xs={7}>
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
                <Col xs={5}>
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
                <Col xs={7}>
                  <FormLabel>Triangle Angle</FormLabel>
                </Col>
                <Col xs={5}>
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
            >
              {/* <OverlayTrigger
                placement="right"
                delay={{ show: 250, hide: 400 }}
                overlay={renderSaveTooltip}
              >
                <svg
                  onClick={saveCurve}
                  xmlns="http://www.w3.org/2000/svg"
                  width="30px"
                  height="30px"
                  cursor={"pointer"}
                  fill="currentColor"
                  className="bi bi-floppy"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 2H9v3h2z" />
                  <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z" />
                </svg>
              </OverlayTrigger>
              <OverlayTrigger
                placement="right"
                delay={{ show: 250, hide: 400 }}
                overlay={renderLoadTooltip}
              >
                <svg
                  onClick={loadCurve}
                  cursor={"pointer"}
                  xmlns="http://www.w3.org/2000/svg"
                  width="30px"
                  height="30px"
                  fill="currentColor"
                  className="bi bi-door-open"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1" />
                  <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z" />
                </svg>
              </OverlayTrigger>
              <OverlayTrigger
                placement="right"
                delay={{ show: 250, hide: 400 }}
                overlay={renderDownLoadTooltip}
              >
                <svg
                  onClick={downloadDragonCurveSVG}
                  cursor={"pointer"}
                  xmlns="http://www.w3.org/2000/svg"
                  width="30px"
                  height="30px"
                  fill="currentColor"
                  className="bi bi-download"
                  viewBox="0 0 20 20"
                >
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                </svg>
              </OverlayTrigger> */}
            </div>
          </Stack>

          {/* The Slideshow Button  Stack */}
          <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
            <FormLabel style={{ fontWeight: "bold" }}>
              Slideshow of Random Dragon Curve
            </FormLabel>
            <Stack direction="vertical" gap={1}>
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
                  style={{ width: "280px" }}
                >
                  Radomise Keeping Current Size
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
                  onClick={randomDragonCurve}
                  style={{ width: "280px" }}
                >
                  Randomise
                </Button>
              </OverlayTrigger>
            </Stack>
          </Stack>

          {/* The Collage Button  Stack */}
          <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
            <FormLabel style={{ fontWeight: "bold" }}>
              Generate A Collage of Curves
            </FormLabel>
            <Button
              disabled={slideShow}
              size="sm"
              variant="primary"
              onClick={createCollage}
              style={{ width: "280px" }}
            >
              Configure and Generate Collage
            </Button>
            <Button
              disabled={slideShow}
              size="sm"
              variant="primary"
              onClick={collageSlideShow}
              style={{ width: "280px" }}
            >
              Collage Slide Show
            </Button>
          </Stack>

          {/* The Miscellaneous Button Stack */}
          <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
            {/* <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={renderMultiDragonTooltip}
            >
              <Button
                disabled={slideShow}
                size="sm"
                variant="primary"
                onClick={createZip}
                style={{ width: "280px" }}
              >
                Multi Dragon Download
              </Button>
            </OverlayTrigger>
            <Button
              disabled={slideShow}
              size="sm"
              variant="primary"
              onClick={downloadRawTurns}
              style={{ width: "280px" }}
            >
              Raw Turns
            </Button> */}
            <CollageModal
              show={collageShow}
              setState={setCollageShow}
              collageConfig={collageConfig}
              setCollageConfig={setCollageConfig}
              updateImage={updateImage}
              urlHead={urlHead}
            ></CollageModal>
            <SettingsModal
              show={settingsShow}
              setState={setSettingsShow}
              settingsConfig={settingsConfig}
              setSettingsConfig={setSettingsConfig}
            ></SettingsModal>
            <DownloadingModal show={downloadingShow}></DownloadingModal>
            <FoldsModal
              show={foldsShow}
              setState={setFoldsShow}
              urlHead={urlHead}
            ></FoldsModal>
            <DownloadZipModal
              show={zipShow}
              setState={setZipShow}
              urlHead={urlHead}
            ></DownloadZipModal>
            <SaveCurveModal
              show={saveShow}
              setState={setSaveShow}
              config={configState}
            ></SaveCurveModal>
            <LoadCurveModal
              show={loadShow}
              setState={setLoadShow}
              activeCellState={activeCellState}
              setActiveCellState={setActiveCellState}
              outsideCellState={outsideCellState}
              setOutsideCellState={setOutsideCellState}
              insideCellState={insideCellState}
              setInsideCellState={setInsideCellState}
              pathState={pathState}
              setPathState={setPathState}
              curveState={state}
              setCurveState={setState}
              setDirty={setDirty}
            ></LoadCurveModal>
            <RendererHelpModal
              show={showRendererHelp}
              setState={setShowRendererHelp}
            ></RendererHelpModal>
          </Stack>
        </div>
        <div
          style={{
            display: "flex",
            position: "fixed",
            flexDirection: "row",
            justifyContent: "space-between",
            bottom: "10px",
            left: "10px",
            width: "300px",
            cursor: "pointer",
          }}
        >
          {" "}
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderSettingsTooltip}
          >
            <svg
              onClick={() => setSettingsShow(true)}
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              fill="#444444"
              className="bi bi-gear"
              viewBox="0 0 16 16"
            >
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
            </svg>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderSaveTooltip}
          >
            <svg
              onClick={saveCurve}
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              cursor={"pointer"}
              fill="currentColor"
              className="bi bi-floppy"
              viewBox="0 0 20 20"
            >
              <path d="M11 2H9v3h2z" />
              <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z" />
            </svg>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderLoadTooltip}
          >
            <svg
              onClick={loadCurve}
              cursor={"pointer"}
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              fill="currentColor"
              className="bi bi-door-open"
              viewBox="0 0 20 20"
            >
              <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1" />
              <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z" />
            </svg>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderDownLoadTooltip}
          >
            <svg
              onClick={downloadDragonCurveSVG}
              cursor={"pointer"}
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              fill="currentColor"
              className="bi bi-download"
              viewBox="0 0 20 20"
            >
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
            </svg>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTurnsTooltip}
          >
            <svg
              onClick={downloadRawTurns}
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              fill="currentColor"
              className="bi bi-sign-turn-slight-left"
              viewBox="0 0 16 16"
            >
              <path d="m7.665 6.982-.8 1.386a.25.25 0 0 1-.451-.039l-1.06-2.882a.25.25 0 0 1 .192-.333l3.026-.523a.25.25 0 0 1 .26.371l-.667 1.154.621.373A2.5 2.5 0 0 1 10 8.632V11H9V8.632a1.5 1.5 0 0 0-.728-1.286z" />
              <path
                fill-rule="evenodd"
                d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134Z"
              />
            </svg>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={renderHelpTooltip}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30px"
              height="30px"
              fill="currentColor"
              className="bi bi-question"
              viewBox="0 0 16 16"
            >
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94" />
            </svg>
          </OverlayTrigger>
        </div>
      </div>
    </>
  );
}
