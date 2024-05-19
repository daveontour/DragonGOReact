import { RefAttributes } from "react";
import { OverlayTrigger, Stack, Tooltip, TooltipProps } from "react-bootstrap";

export default function Heading() {
  const aboutTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Created and designed by{" "}
      <a style={{ color: "white" }} href="mailto:daveontour57@gmail.com">
        Dave Burton daveontour57@gmail.com
      </a>
    </Tooltip>
  );
  return (
    <>
      <div
        className="w-auto p-3 form-control"
        style={{
          display: "flex", // Add this line to make the children position horizontally
          backgroundColor: "#eee",
          maxHeight: "130px",
          minHeight: "130px",
          marginLeft: "auto",
          marginRight: "5px",
        }}
      >
        <Stack direction="vertical" gap={1}>
          <h1>Dragon Art</h1>
          <h4>Generate variations of Heighway-Hater Dragon</h4>
        </Stack>
        <div style={{ position: "relative" }}>
          <Stack direction="horizontal" gap={1}>
            <OverlayTrigger
              placement="left"
              delay={{ show: 250, hide: 4000 }}
              overlay={aboutTooltip}
            >
              <h5>About</h5>
            </OverlayTrigger>
          </Stack>
          {/* <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Heighway_dragon.svg/1200px-Heighway_dragon.svg.png"
            alt="Heighway-Hater Dragon"
            style={{
              width: "100px",
              height: "100px",
              position: "absolute",
              top: "15px",
              right: "5px",
            }}
          /> */}
        </div>
      </div>
    </>
  );
}
