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
import React from "react";
import { DragonCurveState } from "../types";

export default function GroutingConfig({
  state,
  setState,
  slideShow,
  setDirty,
}: {
  state: DragonCurveState;
  setState: React.Dispatch<React.SetStateAction<DragonCurveState>>;
  slideShow: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
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
              borderStyle: state.gridlines ? "solid" : "dashed",
              borderWidth: state.gridlines ? "1px" : "0px",
              borderColor: "black",
              backgroundColor: state.groutingColor,
            }}
          />
        </div>
        <div
          onClick={handleShow}
          style={{
            cursor: "pointer",
          }}
        >
          Background and Grouting
        </div>
      </Stack>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Background, Grouting and Grid Lines Configuration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
            }}
          >
            <Form>
              <h5>Background and Grouting Color</h5>
              <Stack direction="horizontal" gap={2}>
                <Sketch
                  style={{}}
                  color={state.groutingColor}
                  disableAlpha={false}
                  onChange={(color) => {
                    setState({
                      ...state,
                      groutingColor: color.hexa,
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
                        <FormLabel>Tile Grouting Width</FormLabel>
                      </Col>
                      <Col xs={3}>
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
                      <Col xs={4}>
                        <FormLabel>Grid Lines</FormLabel>
                      </Col>
                      <Col xs={5}>
                        <FormCheck
                          type="checkbox"
                          checked={state.gridlines}
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                          ): void => {
                            setDirty(true);
                            setState({
                              ...state,
                              gridlines: event.target.checked,
                            });
                          }}
                        />
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
