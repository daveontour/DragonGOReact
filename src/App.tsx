import "bootstrap/dist/css/bootstrap.min.css";
import Heading from "./Layouts/Heading";
import BodyLayout from "./Layouts/BodyLayout";

const App: React.FC = () => {
  return (
    <div
      className="min-vw-100"
      style={{
        maxHeight: "100vh",
        maxWidth: "100vw",
      }}
    >
      <Heading />
      <BodyLayout />
    </div>
  );
};

export default App;
