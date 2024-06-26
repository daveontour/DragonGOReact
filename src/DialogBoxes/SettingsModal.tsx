import {
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
import { useContext } from "react";

export default function SettingsModal() {
  let config = useContext(CurrentConfigContext);
  const dismiss = () => {
    config.setSettingsShow(false);
  };

  return (
    <>
      {/* <Alert show={stopSlideShow} variant="info" style={{ width: "80%" }}>
        Stop Recieved
      </Alert> */}
      <Modal show={config.settingsShow} onHide={dismiss} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>General Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
            <Container>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Slide Show Interval (seconds)</FormLabel>
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
                    }}
                  />
                </Col>
              </Row>
              <Row className="mb-1">
                <Col xs={4}>
                  <FormLabel>Background</FormLabel>
                </Col>
                <Col xs={4}>
                  <FormControl
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
            </Container>
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={dismiss}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
