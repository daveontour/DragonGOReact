import axios from "axios";
import { useContext, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  FormLabel,
  Modal,
  Row,
  Stack,
} from "react-bootstrap";
import { CurrentConfigContext } from "../Contexts";

function FoldsModal() {
  const [showPrepare, setShowPrepare] = useState(false);
  const [folds, setFolds] = useState({
    folds: "5",
  });

  const config = useContext(CurrentConfigContext);

  const dismiss = () => {
    setShowPrepare(false);
    config.setFoldsShow(false);
  };
  const handleClose = () => {
    setShowPrepare(true);
    var url =
      config.urlHead +
      `/preCalc?folds=${folds.folds}`.replace(/#/g, "").replace(/\s/g, "");

    axios({
      url: url, //your url
      method: "GET",
      responseType: "blob", // important
    }).then((response) => {
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement("a");
      link.href = href;
      var fname = `DragonCurveTurns${folds.folds}.json`;
      link.setAttribute("download", fname); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setShowPrepare(false);
      config.setFoldsShow(false);
    });

    //    setState(false);
  };

  return (
    <Modal show={config.foldsShow} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Download Dragon Curve Turns</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
          <Container>
            <Row>
              <Col xs={10}>
                <p>
                  The turns of a curve are a series of left and right turns in
                  each tile. The turns can be determined by imagining a strip of
                  paper and then progressively folding the strip in half. When
                  you unfold the strip, the peaks and valleys of the folds
                  represent either a left or right turn.
                </p>
                <p>
                  Of course, there is also an algoritmic way of determingning
                  the turns, but it is not as much fun. Each folding of the
                  strip of paper doubles the number of turns in the curve, so
                  the number of turns is 2^n where n is the number of folds.
                </p>
              </Col>
            </Row>
            <Row>
              <Col xs={3}>
                <FormLabel>Number Of Folds</FormLabel>
              </Col>
              <Col xs={2}>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={folds.folds}
                  onChange={(e) => {
                    setFolds({
                      ...folds,
                      folds: e.target.value,
                    });
                  }}
                />
              </Col>
            </Row>
          </Container>
          <Alert show={showPrepare} variant="info" style={{ width: "80%" }}>
            Preparing Dragon Curve Turns - Please Wait
          </Alert>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleClose}>
          Calculate and Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default FoldsModal;
