import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import "./ImageLayout.css";
import { downloadJSON } from "../utils/downloadUtils";

export default function ImageLayout() {
  let config = useContext(CurrentConfigContext);

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
    }

    document.getElementById("imageHTMLElement")?.focus();
  }

  return (
    <div
      id="dragonCanvasPortal"
      className="dragon-canvas-wrap"
      onKeyDown={handleKeyPress}
    >
      <div
        tabIndex={0}
        onKeyDown={handleKeyPress}
        id="imageHTMLElement"
        className={`dragon-canvas ${config.settingsConfig.background}`}
      />
    </div>
  );
}
