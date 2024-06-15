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

function DownloadZipModal() {
  const [showPrepare, setShowPrepare] = useState(false);
  const [numDragon, setNumDragon] = useState({
    dragons: "50",
    format: "SVG",
  });

  const config = useContext(CurrentConfigContext);
  const dismiss = () => {
    setShowPrepare(false);
    config.setZipShow(false);
  };
  const handleClose = () => {
    setShowPrepare(true);
    var url =
      config.urlHead +
      `/createZip?num=${numDragon.dragons}&format=${numDragon.format}`
        .replace(/#/g, "")
        .replace(/\s/g, "");

    axios({
      url: url, //your url
      method: "GET",
      responseType: "blob", // important
    }).then((response) => {
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement("a");
      link.href = href;
      var fname = `${numDragon.dragons}DragonCurves${numDragon.format}.zip`;
      link.setAttribute("download", fname); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setShowPrepare(false);
      config.setZipShow(false);
    });

    //    setState(false);
  };

  return (
    <Modal show={config.zipShow} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Download Dragon Curve Turns</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
          <Container>
            <Row>
              <Col xs={3}>
                <FormLabel>Number Of Dragons</FormLabel>
              </Col>
              <Col xs={2}>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={numDragon.dragons}
                  onChange={(e) => {
                    setNumDragon({
                      ...numDragon,
                      dragons: e.target.value,
                    });
                  }}
                />
              </Col>
            </Row>
          </Container>
          <Container>
            <Row>
              <Col xs={3}>
                <FormLabel>Image Format</FormLabel>
              </Col>
              <Col xs={2}>
                <FormControl
                  as="select"
                  value={numDragon.format}
                  onChange={(e) => {
                    setNumDragon({
                      ...numDragon,
                      format: e.target.value,
                    });
                  }}
                >
                  <option value="SVG">SVG</option>
                  <option value="PNG">PNG</option>
                </FormControl>
              </Col>
            </Row>
          </Container>
        </Stack>
        <Alert show={showPrepare} variant="info" style={{ width: "80%" }}>
          Preparing Dragon Zip File - Please Wait
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleClose}>
          Create and Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DownloadZipModal;
