import { Sketch } from "@uiw/react-color";
import axios from "axios";
import { useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  FormControl,
  FormLabel,
  Modal,
  Row,
  Stack,
} from "react-bootstrap";

function CollageModal({
  show,
  setState,
  collageConfig,
  setCollageConfig,
  updateImage,
  urlHead,
}: {
  show: any;
  setState: any;
  collageConfig: any;
  setCollageConfig: any;
  updateImage: any;
  urlHead: string;
}) {
  const [showPrepare, setShowPrepare] = useState(false);

  const dismiss = () => {
    setShowPrepare(false);
    setState(false);
  };
  const handleClose = () => {
    setShowPrepare(true);
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
      dismiss();
    });
  };

  return (
    <>
      {/* <Alert show={stopSlideShow} variant="info" style={{ width: "80%" }}>
        Stop Recieved
      </Alert> */}
      <Modal show={show} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create A Dragon Curve Collage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
            <Container>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Number Of Element Wide</FormLabel>
                </Col>
                <Col xs={4}>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={collageConfig.width}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        width: e.target.value,
                      });
                    }}
                  />
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Number Of Element High</FormLabel>
                </Col>
                <Col xs={4}>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={collageConfig.height}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        height: e.target.value,
                      });
                    }}
                  />
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Width Of Element</FormLabel>
                </Col>
                <Col xs={4}>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={collageConfig.elementWidth}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        elementWidth: e.target.value,
                      });
                    }}
                  />
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Initial Dragon Direction</FormLabel>
                </Col>
                <Col xs={4}>
                  <FormControl
                    as="select"
                    value={collageConfig.startDirection}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        startDirection: e.target.value,
                      });
                    }}
                  >
                    <option value="0">Up</option>
                    <option value="1">Down</option>
                    <option value="2">Left</option>
                    <option value="3">Right</option>
                    <option value="4">Random</option>{" "}
                  </FormControl>
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Format</FormLabel>
                </Col>
                <Col xs={4}>
                  <FormControl
                    as="select"
                    value={collageConfig.format}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        format: e.target.value,
                      });
                    }}
                  >
                    <option value="png">PNG</option>
                    {/* <option value="svg">SVG</option> */}
                  </FormControl>
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Gap Between Elements</FormLabel>
                </Col>
                <Col xs={4}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={collageConfig.elementGap}
                    onChange={(e) => {
                      setCollageConfig({
                        ...collageConfig,
                        elementGap: e.target.value,
                      });
                    }}
                  />
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Background/Gap Color</FormLabel>
                </Col>
                <Col xs={4}>
                  <Sketch
                    style={{}}
                    disableAlpha={false}
                    color={collageConfig.gapColor}
                    onChange={(color) => {
                      setCollageConfig({
                        ...collageConfig,
                        gapColor: color.hexa,
                      });
                    }}
                  />
                </Col>
              </Row>
            </Container>
            <Alert
              className="mb-1"
              show={showPrepare}
              variant="info"
              style={{ width: "100%" }}
            >
              Preparing Dragon Curve Collage - Please Wait
            </Alert>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={dismiss}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Generate Collage
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CollageModal;
