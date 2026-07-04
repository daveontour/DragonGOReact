import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import { SetShowFullScreen } from "../types";
import { downloadJSON } from "../utils/downloadUtils";

export default function FullScreenLayout({
  showFullScreen,
  setShowFullScreen,
}: {
  showFullScreen: boolean;
  setShowFullScreen: SetShowFullScreen;
}) {
  const config = useContext(CurrentConfigContext);
  
  const handleImageClick = () => {
    setShowFullScreen(false);
  };
  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
    }

    document.getElementById("imageHTMLElementFullScreen")?.focus();
  }

  return (
    <>
      <div
        tabIndex={0}
        id="imageHTMLElementFullScreen"
        onClick={handleImageClick}
        onKeyDown={handleKeyPress}
        style={{
          display: showFullScreen ? "flex" : "none",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none",
        }}
      ></div>
    </>
  );
}
