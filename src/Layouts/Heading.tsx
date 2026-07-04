import { RefAttributes } from "react";
import { OverlayTrigger, Tooltip, TooltipProps } from "react-bootstrap";

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
    <div className="top-bar" style={{ display: showFullScreen ? "none" : "flex" }}>
      <div className="top-bar-title">
        <h1>DragonCurves.Art</h1>
        <p className="top-bar-subtitle">
          Generate variations of Heighway-Hater Dragon
        </p>
      </div>
      <div className="top-bar-meta">
        <OverlayTrigger
          placement="left"
          delay={{ show: 250, hide: 4000 }}
          overlay={aboutTooltip}
        >
          <span>Version 3.0</span>
        </OverlayTrigger>
      </div>
    </div>
  );
}
