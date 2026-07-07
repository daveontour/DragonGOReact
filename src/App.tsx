import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import HomePage from "./pages/HomePage";
import DragonCurvesApp from "./visualizations/DragonCurvesApp";
import KnightsTourApp from "./visualizations/KnightsTourApp";
import PiNGonApp from "./visualizations/PiNGonApp";
import CollatzApp from "./visualizations/CollatzApp";
import { VisualizationId } from "./visualizations/registry";

type AppView = "home" | VisualizationId;

const App: React.FC = () => {
  const [view, setView] = useState<AppView>("home");
  const [mountedViz, setMountedViz] = useState<Set<VisualizationId>>(
    () => new Set()
  );

  const openVisualization = (id: VisualizationId) => {
    setMountedViz((prev) => new Set(prev).add(id));
    setView(id);
  };

  return (
    <div className="dragon-app min-vw-100">
      {view === "home" ? (
        <HomePage onSelect={openVisualization} />
      ) : null}

      {mountedViz.has("dragon-curves") ? (
        <div
          className="viz-shell"
          style={{ display: view === "dragon-curves" ? "flex" : "none" }}
        >
          <DragonCurvesApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("knights-tour") ? (
        <div
          className="viz-shell"
          style={{ display: view === "knights-tour" ? "flex" : "none" }}
        >
          <KnightsTourApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("pi-n-gon") ? (
        <div
          className="viz-shell"
          style={{ display: view === "pi-n-gon" ? "flex" : "none" }}
        >
          <PiNGonApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("collatz") ? (
        <div
          className="viz-shell"
          style={{ display: view === "collatz" ? "flex" : "none" }}
        >
          <CollatzApp onHome={() => setView("home")} />
        </div>
      ) : null}
    </div>
  );
};

export default App;
