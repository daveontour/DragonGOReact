import { Sketch } from "@uiw/react-color";
import axios from "axios";
import { useContext, useState } from "react";
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
import { CurrentConfigContext } from "../Contexts";

function CollageModal() {
  const [showPrepare, setShowPrepare] = useState(false);
  const config = useContext(CurrentConfigContext);

  const dismiss = () => {
    setShowPrepare(false);
    config.setCollageShow(false);
  };
  const handleClose = () => {
    setShowPrepare(true);
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
      dismiss();
    });
  };

  return (
    <>
      {/* <Alert show={stopSlideShow} variant="info" style={{ width: "80%" }}>
        Stop Recieved
      </Alert> */}
      <Modal show={config.collageShow} onHide={dismiss} size="lg">
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
                    value={config.collageConfig.width}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    value={config.collageConfig.height}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    value={config.collageConfig.elementWidth}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    value={config.collageConfig.startDirection}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    value={config.collageConfig.format}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    value={config.collageConfig.elementGap}
                    onChange={(e) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
                    color={config.collageConfig.gapColor}
                    onChange={(color) => {
                      config.setCollageConfig({
                        ...config.collageConfig,
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
