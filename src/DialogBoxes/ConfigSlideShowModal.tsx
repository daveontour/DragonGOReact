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

function ConfigSlideShowModal({
  showSlideShowConfig,
  setSlideShowConfig,
  slideShowRandomise,
  setSlideShowRandomise,
  settingsConfig,
  setSettingsConfig,
}: {
  showSlideShowConfig: any;
  setSlideShowConfig: any;
  slideShowRandomise: any;
  setSlideShowRandomise: any;
  settingsConfig: any;
  setSettingsConfig: any;
}) {
  const dismiss = () => {
    setSlideShowConfig(false);
  };

  return (
    <Modal show={showSlideShowConfig} onHide={dismiss} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Slide Show Configuration</Modal.Title>
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
            <Row>
              <Col xs={4}>
                <FormLabel>Type of Slide Show</FormLabel>
              </Col>
              <Col xs={4}>
                <FormControl
                  as="select"
                  value={slideShowRandomise ? "random" : "fixed"}
                  onChange={(e) => {
                    setSlideShowRandomise(
                      e.target.value === "random" ? true : false
                    );
                  }}
                >
                  <option value="random">Completely Random Size</option>
                  <option value="fixed">Maintain Current Size</option>
                </FormControl>
              </Col>
            </Row>
          </Container>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigSlideShowModal;
