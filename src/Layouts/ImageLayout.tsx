import ZoomControl from "../Widgets/ZoomControlWidget";

export default function ImageLayout({
  imgUrl,
  imageSize,
  setImageSize,
  statsURL,
}: {
  imgUrl: string;
  imageSize: any;
  setImageSize: any;
  statsURL: any;
}) {
  return (
    <>
      <div
        style={{
          height: "calc(100vh - 145px)",
          width: "calc(100vw - 335px)",
          overflow: "hide",
          backgroundColor: "#FFFFFF",
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
          style={{
            height: "calc(100% - 25px)",
            width: "100%",
            overflow: "auto",
            backgroundColor: "#FFFFFF00",
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
          />
        </div>
      </div>
    </>
  );
}
