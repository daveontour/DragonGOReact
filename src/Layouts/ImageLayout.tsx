import { useContext } from "react";
import { CurrentConfigContext } from "../Contexts";
import ZoomControl from "../Widgets/ZoomControlWidget";
import "./ImageLayout.css";

export default function ImageLayout({
  imgUrl,
  statsURL,
  setShowFullScreen,
  stopSlideShowNow,
}: {
  imgUrl: string;
  statsURL: any;
  setShowFullScreen: any;
  stopSlideShowNow: any;
}) {
  let config = useContext(CurrentConfigContext);

  return (
    <>
      <div
        style={{
          height: "calc(100vh - 90px)",
          width: "calc(100vw - 335px)",
          overflow: "hide",
          backgroundColor: "aliceblue",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "2px",
          borderRadius: "5px",
          userSelect: "none",
        }}
      >
        <div
          className={config.settingsConfig.background}
          style={{
            height: "calc(100% - 25px)",
            width: "100%",
            overflow: "auto",
            // backgroundColor: "aliceblue",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: "2px",
            borderRadius: "5px",
            userSelect: "none",
          }}
        >
          <img
            src={imgUrl}
            alt="Connecting to server..."
            style={{
              width: config.imageSize.width,
              height: config.imageSize.height,
            }}
            id="imageHTMLElement"
          />
        </div>
        <div
          style={{
            width: "100%",
            height: 25,
            paddingLeft: 5,
            backgroundColor: "#ccccccbb",
            borderRadius: "5px",
          }}
        >
          <ZoomControl
            statsURL={statsURL}
            setShowFullScreen={setShowFullScreen}
            stopSlideShowNow={stopSlideShowNow}
          />
        </div>
      </div>
    </>
  );
}
