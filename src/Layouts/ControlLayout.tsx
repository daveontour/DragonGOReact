import { RefAttributes, useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Dropdown,
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

var stopSlideShow = false;
var opened = true;

function calculateImageSize(
  imgWidth: number,
  imgHeight: number
): [string, string, string] {
  let hOffset = 170;
  let portalWidth = window.innerWidth - 350;
  let portalHeight = window.innerHeight - hOffset;

  let widthRatio = imgWidth / portalWidth;
  let heightRatio = imgHeight / portalHeight;

  if (widthRatio < 1 && heightRatio < 1) {
    return [imgWidth + "px", imgHeight + "px", "100"];
  }

  if (widthRatio > 1 && heightRatio < 1) {
    let zoom = Math.round(100 / widthRatio);
    return [portalWidth + "px", "auto", String(zoom)];
  }
  if (widthRatio < 1 && heightRatio > 1) {
    let zoom = Math.round(100 / heightRatio);
    return ["auto", portalHeight + "px", String(zoom)];
  }

  if (widthRatio > 1 && heightRatio > 1) {
    if (widthRatio > heightRatio) {
      let zoom = Math.round(100 / widthRatio);
      return [portalWidth + "px", "auto", String(zoom)];
    } else {
      let zoom = Math.round(100 / heightRatio);
      return ["auto", portalHeight + "px", String(zoom)];
    }
  }

  console.log("zoom default", "100");

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
  const [foldsShow, setFoldsShow] = useState(false);
  const [zipShow, setZipShow] = useState(false);
  const [saveShow, setSaveShow] = useState(false);
  const [loadShow, setLoadShow] = useState(false);
  const [configState, setConfigState] = useState({
    outside: outsideCellState,
    inside: insideCellState,
    active: activeCellState,
    path: pathState,
    state: state,
  });
  const [slideShow, setSlideShow] = useState(false);

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
        response.data.height
      );
      setImageSize({
        ...imageSize,
        width: imgSX,
        height: imgSY,
        zoom: zoom,
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
    stopSlideShow = false;
    const interval = setInterval(() => {
      if (stopSlideShow) {
        clearInterval(interval);
        setSlideShow(false);
      } else {
        randomDragonCurveLocal();
        generate();
      }
    }, 2000);
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
    stopSlideShow = false;
    const interval = setInterval(() => {
      if (stopSlideShow) {
        clearInterval(interval);
        setSlideShow(false);
      } else {
        randomDragonCurveLocalCurrentSize();
        generate();
      }
    }, 2000);
  };

  const collageSlideShow = () => {
    setSlideShow(true);
    stopSlideShow = false;

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
        if (!stopSlideShow) {
          collageSlideShow();
        } else {
          setSlideShow(false);
        }
      }, 2000);
    });
  };

  const downloadDragonCurve = () => {
    setDownloadingShow(true);
    var url = getSingleURL() + "&format=png";

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
      link.setAttribute("download", "Dragon.png"); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setDownloadingShow(false);
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

  const createZip = () => {
    setZipShow(true);
  };

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

  const renderMultiDragonTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Creates and downloads a zip file containing multiple dragon curves with a
      range of sizes and configurations.
    </Tooltip>
  );

  const renderSaveTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Allows you to save the configuration settings of the current dragon curve
      by showing the underlying configuration which can be saved as a JSON file.
    </Tooltip>
  );
  const renderLoadTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Allows you to load a previously saved configuration settings of a dragon
      curve by uploading a JSON file.
    </Tooltip>
  );
  return (
    <>
      {/* This div is an overlay to the main Control div which is shown when a slide show is executing */}
      <div
        className="form-control"
        style={{
          height: "calc(100vh - 145px)",
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
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              stopSlideShow = true;
              stopSlideShowNow();
            }}
            style={{
              width: "280px",
              display: slideShow ? "block" : "none",
            }}
          >
            Stop Slide Show
          </Button>
          <div style={{ width: "280px", marginTop: "50px" }}>
            <p>
              The turns of a Dragon Curve can be represented as a sequence of
              Left and Right turns. You can download the sequence of turns for a
              Dragon Curve of a specified number of folds using the button below
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={downloadRawTurns}
              style={{ width: "280px", marginBottom: "10px" }}
            >
              Turn Sequence
            </Button>
            <p>
              The sequnce of turns can be determined by folding a strip of paper
              repeatedly (folds) and then unfolding it and follow the left and
              right turn from one end. Of course, there is also an algoritmic
              way of determining the turns
            </p>
            <a href="http://en.wikipedia.org/wiki/Dragon_curve">
              Wikipedia's article
            </a>

            <p style={{ marginTop: "20px" }}>
              This Numberphile video helped inspire this work <br />
              <a href="https://www.youtube.com/watch?v=v678Em6qyzk">
                Numberphile's video
              </a>
            </p>
          </div>
        </Stack>
      </div>

      {/* This div is the main control div */}
      <div
        className="form-control"
        style={{
          height: "calc(100vh - 145px)",
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
              Dragon Path and Cell Configuration
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
            ></CellConfig>
            <CellConfig
              state={insideCellState}
              setState={setInsideCellState}
              slideShow={slideShow}
              setDirty={setDirty}
            ></CellConfig>
            <CellConfig
              state={outsideCellState}
              setState={setOutsideCellState}
              slideShow={slideShow}
              setDirty={setDirty}
            ></CellConfig>
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
                  <FormLabel>Cell Width</FormLabel>
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
                  <FormLabel>Tile Grouting Width</FormLabel>
                </Col>
                <Col xs={5}>
                  <FormControl
                    disabled={slideShow}
                    size="sm"
                    as="select"
                    value={state.grouting}
                    onChange={(e) => {
                      setDirty(true);
                      setState({
                        ...state,
                        grouting: e.target.value,
                      });
                    }}
                  >
                    {[...Array(10).keys()].map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </FormControl>
                </Col>
              </Row>
              <Row>
                <Col xs={7}>
                  <FormLabel>Margin</FormLabel>
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
                        generateEnabled: true,
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
                  <FormLabel>Cell Renderer</FormLabel>
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
                    <option value="knuth">Knuth Cell</option>
                    <option value="knuthcurve">Knuth Cell Curve</option>
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
                    disabled={slideShow || state.cellType !== "triangle"}
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
              variant="secondary"
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
              variant="primary"
              onClick={generate}
              disabled={slideShow}
              style={{
                width: "280px",
                display: dirty ? "block" : "none",
              }}
            >
              Generate Dragon Curve
            </Button>
            <Dropdown>
              <Dropdown.Toggle
                disabled={slideShow}
                size="sm"
                variant="primary"
                id="dropdown-basic"
                style={{ width: "280px" }}
              >
                Download Dragon Curve
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={downloadDragonCurveSVG}>
                  Download SVG Format
                </Dropdown.Item>
                <Dropdown.Item onClick={downloadDragonCurve}>
                  Download PNG Format
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Stack direction="horizontal" gap={1}>
              <OverlayTrigger
                placement="right"
                delay={{ show: 250, hide: 400 }}
                overlay={renderSaveTooltip}
              >
                <Button
                  disabled={slideShow}
                  size="sm"
                  variant="primary"
                  onClick={saveCurve}
                  style={{ width: "137px" }}
                >
                  Save
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="right"
                delay={{ show: 250, hide: 400 }}
                overlay={renderLoadTooltip}
              >
                <Button
                  disabled={slideShow}
                  size="sm"
                  variant="primary"
                  onClick={loadCurve}
                  style={{ width: "137px" }}
                >
                  Load
                </Button>
              </OverlayTrigger>
            </Stack>
          </Stack>

          {/* The Slideshow Button  Stack */}
          <Stack direction="vertical" gap={1} style={{ marginTop: "20px" }}>
            <FormLabel style={{ fontWeight: "bold" }}>
              Slideshow of Random Dragon Curve
            </FormLabel>
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
                  style={{ width: "137px" }}
                >
                  Current Size
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
                  style={{ width: "137px" }}
                >
                  Random
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
            <OverlayTrigger
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
            </Button>
            <CollageModal
              show={collageShow}
              setState={setCollageShow}
              collageConfig={collageConfig}
              setCollageConfig={setCollageConfig}
              updateImage={updateImage}
              urlHead={urlHead}
            ></CollageModal>
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
          </Stack>
        </div>
      </div>
    </>
  );
}
