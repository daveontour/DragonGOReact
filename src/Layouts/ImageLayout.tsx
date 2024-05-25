import ZoomControl from "../Widgets/ZoomControlWidget";
import "./ImageLayout.css";

export default function ImageLayout({
  imgUrl,
  imageSize,
  setImageSize,
  statsURL,
  setShowFullScreen,
  stopSlideShowNow,
  settingsConfig,
}: {
  imgUrl: string;
  imageSize: any;
  setImageSize: any;
  statsURL: any;
  setShowFullScreen: any;
  stopSlideShowNow: any;
  settingsConfig: any;
}) {
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
          className={settingsConfig.background}
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
            style={{ width: imageSize.width, height: imageSize.height }}
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
            imageSize={imageSize}
            setImageSize={setImageSize}
            statsURL={statsURL}
            setShowFullScreen={setShowFullScreen}
            stopSlideShowNow={stopSlideShowNow}
          />
        </div>
      </div>
    </>
  );
}
