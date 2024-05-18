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
            padding: "2px",
            backgroundColor: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: "30px",
              width: "30px",
              borderStyle: state.borderEnabled ? state.borderStyle : "dashed",
              borderWidth: state.borderEnabled ? state.borderWidth : "1px",
              borderColor: state.borderEnabled
                ? state.borderColor
                : "#00000000",
              borderRadius: state.borderEnabled ? state.borderRadius : "0px",
              backgroundColor: state.fillEnabled
                ? state.backgroundColor
                : "#00000011",
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
              gridTemplateColumns: "2fr 2fr 1fr",
            }}
          >
            <Form>
              <h5>Cell Borders</h5>

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

              <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
                <Container>
                  <Row>
                    <Col xs={5}>
                      <FormLabel>Enabled</FormLabel>
                    </Col>
                    <Col xs={3}>
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
                    <Col xs={5}>
                      <FormLabel>Border Width</FormLabel>
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
                        <option value="1px">1px</option>
                        <option value="2px">2px</option>
                        <option value="3px">3px</option>
                        <option value="4px">4px</option>
                        <option value="5px">5px</option>
                      </FormControl>
                    </Col>
                  </Row>
                </Container>
              </Stack>
            </Form>

            <Form>
              <h5>Cell Background Color</h5>
              <Sketch
                style={{}}
                color={state.backgroundColor}
                disableAlpha={false}
                onChange={(color) => {
                  setState({
                    ...state,
                    backgroundColor: color.hexa,
                  });
                }}
              />
              <Stack direction="vertical" gap={2} style={{ marginTop: "10px" }}>
                <Container>
                  <Row>
                    <Col xs={5}>
                      <FormLabel>Enabled</FormLabel>
                    </Col>
                    <Col xs={3}>
                      <FormCheck
                        type="checkbox"
                        checked={state.fillEnabled}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ): void =>
                          setState({
                            ...state,
                            fillEnabled: event.target.checked,
                          })
                        }
                      />
                    </Col>
                  </Row>
                </Container>
              </Stack>
            </Form>
            <div>
              <div
                style={{
                  marginTop: "150px",
                  height: "34px",
                  width: "34px",
                  padding: "2px",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    height: "30px",
                    width: "30px",
                    borderStyle: state.borderEnabled
                      ? state.borderStyle
                      : "dashed",
                    borderWidth: state.borderEnabled
                      ? state.borderWidth
                      : "1px",
                    borderColor: state.borderEnabled
                      ? state.borderColor
                      : "#00000000",
                    borderRadius: state.borderEnabled
                      ? state.borderRadius
                      : "0px",
                    backgroundColor: state.fillEnabled
                      ? state.backgroundColor
                      : "#00000011",
                  }}
                />
              </div>
            </div>
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
