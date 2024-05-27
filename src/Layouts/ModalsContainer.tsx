import CollageModal from "../DialogBoxes/CreateCollageModal";
import DownloadZipModal from "../DialogBoxes/DownloadZipModal";
import DownloadingModal from "../DialogBoxes/DownloadingModal";
import LoadCurveModal from "../DialogBoxes/LoadCurveModal";
import FoldsModal from "../DialogBoxes/RawConfigModal";
import RendererHelpModal from "../DialogBoxes/RendererHelpModal";
import SaveCurveModal from "../DialogBoxes/SaveCurveModal";
import SettingsModal from "../DialogBoxes/SettingsModal";

export default function ModalsContainer({
  state,
  pathState,
  activeCellState,
  outsideCellState,
  insideCellState,
  setActiveCellState,
  setOutsideCellState,
  setInsideCellState,
  setPathState,
  setState,
  urlHead,
  setSettingsShow,
  setFoldsShow,
  setSaveShow,
  setLoadShow,
  collageShow,
  setCollageShow,
  collageConfig,
  setCollageConfig,
  settingsShow,
  settingsConfig,
  setSettingsConfig,
  zipShow,
  setZipShow,
  updateImage,
  downloadingShow,
  foldsShow,
  saveShow,
  loadShow,
  setDirty,
  showRendererHelp,
  setShowRendererHelp,
  configState,
}: {
  state: any;
  pathState: any;
  activeCellState: any;
  outsideCellState: any;
  insideCellState: any;
  setActiveCellState: any;
  setOutsideCellState: any;
  setInsideCellState: any;
  setPathState: any;
  setState: any;
  urlHead: any;
  setSettingsShow: any;
  setFoldsShow: any;
  setSaveShow: any;
  setLoadShow: any;
  collageShow: any;
  setCollageShow: any;
  collageConfig: any;
  setCollageConfig: any;
  settingsShow: any;
  settingsConfig: any;
  setSettingsConfig: any;
  zipShow: any;
  setZipShow: any;
  updateImage: any;
  downloadingShow: any;
  foldsShow: any;
  saveShow: any;
  loadShow: any;
  setDirty: any;
  showRendererHelp: any;
  setShowRendererHelp: any;
  configState: any;
}) {
  return (
    <>
      <CollageModal
        show={collageShow}
        setState={setCollageShow}
        collageConfig={collageConfig}
        setCollageConfig={setCollageConfig}
        updateImage={updateImage}
        urlHead={urlHead}
      ></CollageModal>
      <SettingsModal
        show={settingsShow}
        setState={setSettingsShow}
        settingsConfig={settingsConfig}
        setSettingsConfig={setSettingsConfig}
      ></SettingsModal>
      <DownloadingModal show={downloadingShow}></DownloadingModal>
      <FoldsModal
        show={foldsShow}
        setState={setFoldsShow}
        urlHead={urlHead}
      ></FoldsModal>
      <DownloadZipModal
        show={zipShow}
        setState={setZipShow}
        urlHead={urlHead}
      ></DownloadZipModal>
      <SaveCurveModal
        show={saveShow}
        setState={setSaveShow}
        config={configState}
      ></SaveCurveModal>
      <LoadCurveModal
        show={loadShow}
        setState={setLoadShow}
        activeCellState={activeCellState}
        setActiveCellState={setActiveCellState}
        outsideCellState={outsideCellState}
        setOutsideCellState={setOutsideCellState}
        insideCellState={insideCellState}
        setInsideCellState={setInsideCellState}
        pathState={pathState}
        setPathState={setPathState}
        curveState={state}
        setCurveState={setState}
        setDirty={setDirty}
      ></LoadCurveModal>
      <RendererHelpModal
        show={showRendererHelp}
        setState={setShowRendererHelp}
      ></RendererHelpModal>
    </>
  );
}
