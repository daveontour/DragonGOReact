import { useContext, useEffect, useMemo, useState } from "react";
import { CurrentConfigContext } from "../Contexts";
import OverlayBlockModal from "../dialogs/OverlayBlockModal";
import "./ImageLayout.css";
import { buildRequestConfig } from "../buildRequestConfig";
import { downloadJSON } from "../downloadUtils";

const MAIN_IMAGE_ID = "imageHTMLElement";

export default function ImageLayout() {
  const config = useContext(CurrentConfigContext);
  const [overlaySelection, setOverlaySelection] = useState<{
    blockRow: number;
    blockCol: number;
  } | null>(null);

  const overlayClickEnabled =
    config.settingsConfig.planView && config.state.tileBlockGridSize > 0;

  const requestConfig = useMemo(() => {
    if (!overlaySelection) {
      return null;
    }
    return buildRequestConfig(config);
  }, [overlaySelection, config]);

  useEffect(() => {
    const el = document.getElementById(MAIN_IMAGE_ID);
    if (!el) {
      return;
    }

    const handler = (event: MouseEvent) => {
      if (!overlayClickEnabled) {
        return;
      }

      const target = (event.target as Element | null)?.closest(".plan-block-hit");
      if (!target) {
        return;
      }

      const blockRow = Number(target.getAttribute("data-block-row"));
      const blockCol = Number(target.getAttribute("data-block-col"));
      if (Number.isNaN(blockRow) || Number.isNaN(blockCol)) {
        return;
      }

      setOverlaySelection({ blockRow, blockCol });
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [overlayClickEnabled]);

  useEffect(() => {
    if (!overlayClickEnabled) {
      setOverlaySelection(null);
    }
  }, [overlayClickEnabled]);

  function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.type === "keydown" && event.key.toLowerCase() === "s") {
      downloadJSON(config.configJSON, "SaveDragonCurveConfig.json");
    }

    document.getElementById(MAIN_IMAGE_ID)?.focus();
  }

  return (
    <>
      <div
        id="dragonCanvasPortal"
        className="dragon-canvas-wrap"
        onKeyDown={handleKeyPress}
      >
        <div
          tabIndex={0}
          onKeyDown={handleKeyPress}
          id={MAIN_IMAGE_ID}
          className={`dragon-canvas ${config.settingsConfig.background} ${
            overlayClickEnabled ? "dragon-canvas--overlay-pick" : ""
          }`}
        />
      </div>

      <OverlayBlockModal
        show={overlaySelection !== null}
        onHide={() => setOverlaySelection(null)}
        requestConfig={requestConfig}
        blockRow={overlaySelection?.blockRow ?? null}
        blockCol={overlaySelection?.blockCol ?? null}
      />
    </>
  );
}
