import { RefAttributes } from "react";
import { OverlayTrigger, Tooltip, TooltipProps } from "react-bootstrap";

export default function VisualizationTopBar({
  showFullScreen,
  onHome,
}: {
  showFullScreen: boolean;
  onHome: () => void;
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
    <div
      className="top-bar"
      style={{ display: showFullScreen ? "none" : "flex" }}
    >
      <div className="top-bar-nav">
        <button type="button" className="top-bar-home-link" onClick={onHome}>
          Home
        </button>
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
