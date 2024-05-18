import { Sketch } from "@uiw/react-color";
import { useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  FormCheck,
  FormControl,
  FormLabel,
  Modal,
  Row,
  Stack,
} from "react-bootstrap";

export default function CellConfig({
  state,
  setState,
  slideShow,
  setDirty,
}: {
  state: any;
  setState: any;
  slideShow: any;
  setDirty: any;
}) {
  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false);
    setDirty(true);
  };
  const handleShow = () => {
    if (!slideShow) setShow(true);
  };

  return (
    <>
      <Stack direction="horizontal" gap={2}>
        <div
          onClick={handleShow}
          style={{
            height: "34px",
            width: "34px",
            paddingTop: "16px",
            paddingLeft: "2px",
            backgroundColor: "#ffFFff",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: "10px",
              width: "30px",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "none",
              borderTopStyle: state.borderEnabled
                ? state.borderStyle
                : "dashed",
              borderTopWidth: state.borderEnabled ? state.borderWidth : "1px",
              borderTopColor: state.borderEnabled
                ? state.borderColor
                : "#000000aa",
            }}
          />
        </div>
        <div
          onClick={handleShow}
          style={{
            cursor: "pointer",
          }}
        >
          {state.shortTitle}
        </div>
      </Stack>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{state.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
            }}
          >
            <Form>
              <h5>Dragon Curve Path</h5>
              <Stack direction="horizontal" gap={2}>
                <Sketch
                  style={{}}
                  color={state.borderColor}
                  disableAlpha={false}
                  onChange={(color) => {
                    setState({
                      ...state,
                      borderColor: color.hexa,
                    });
                  }}
                />
                <Stack
                  direction="vertical"
                  gap={2}
                  style={{ marginTop: "10px", width: "400px" }}
                >
                  <Container>
                    <Row>
                      <Col xs={4}>
                        <FormLabel>Enabled</FormLabel>
                      </Col>
                      <Col xs={2}>
                        <FormCheck
                          type="checkbox"
                          checked={state.borderEnabled}
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                          ): void =>
                            setState({
                              ...state,
                              borderEnabled: event.target.checked,
                            })
                          }
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={4}>
                        <FormLabel>Path Width</FormLabel>
                      </Col>
                      <Col xs={3}>
                        <FormControl
                          size="sm"
                          as="select"
                          value={state.borderWidth}
                          onChange={(e) => {
                            setState({
                              ...state,
                              borderWidth: e.target.value,
                            });
                          }}
                        >
                          <option value="0px">None</option>
                          <option value="1px">1px</option>
                          <option value="2px">2px</option>
                          <option value="3px">3px</option>
                          <option value="4px">4px</option>
                          <option value="5px">5px</option>
                        </FormControl>
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={4}>
                        <FormLabel>Initial Direction</FormLabel>
                      </Col>
                      <Col xs={4}>
                        <FormControl
                          size="sm"
                          as="select"
                          value={state.startDirection}
                          onChange={(e) => {
                            setState({
                              ...state,
                              startDirection: e.target.value,
                            });
                          }}
                        >
                          <option value="UP">UP</option>
                          <option value="DOWN">DOWN</option>
                          <option value="LEFT">LEFT</option>
                          <option value="RIGHT">RIGHT</option>
                        </FormControl>
                      </Col>
                    </Row>
                  </Container>
                </Stack>
              </Stack>
            </Form>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
