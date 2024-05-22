import { RefAttributes } from "react";
import { OverlayTrigger, Stack, Tooltip, TooltipProps } from "react-bootstrap";

export default function Heading({
  showFullScreen,
}: {
  showFullScreen: boolean;
}) {
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
          display: showFullScreen ? "none" : "flex",
          justifyContent: "space-between", // Add this line to align the children in the center horizontally
          alignItems: "flex-end", // Add this line to align the children in the center vertically
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            width: "400px",
            height: "100%",
          }}
        >
          <OverlayTrigger
            placement="left"
            delay={{ show: 250, hide: 4000 }}
            overlay={aboutTooltip}
          >
            <h5>About</h5>
          </OverlayTrigger>

          <h6>Version 1.1</h6>
        </div>
      </div>
    </>
  );
}
