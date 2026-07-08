import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import HomePage from "./pages/HomePage";
import DragonCurvesApp from "./visualizations/DragonCurvesApp";
import KnightsTourApp from "./visualizations/KnightsTourApp";
import PiNGonApp from "./visualizations/PiNGonApp";
import CollatzApp from "./visualizations/CollatzApp";
import MandelbrotApp from "./visualizations/MandelbrotApp";
import PlanetaryOrbitApp from "./visualizations/PlanetaryOrbitApp";
import LSystemApp from "./visualizations/LSystemApp";
import GameOfLifeApp from "./visualizations/GameOfLifeApp";
import VoronoiApp from "./visualizations/VoronoiApp";
import NBodyApp from "./visualizations/NBodyApp";
import NewtonFractalApp from "./visualizations/NewtonFractalApp";
import MondrianApp from "./visualizations/MondrianApp";
import AttractorApp from "./visualizations/AttractorApp";
import FourierApp from "./visualizations/FourierApp";
import BifurcationApp from "./visualizations/BifurcationApp";
import ElementaryCAApp from "./visualizations/ElementaryCAApp";
import PrimeSpiralApp from "./visualizations/PrimeSpiralApp";
import PenroseApp from "./visualizations/PenroseApp";
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

      {mountedViz.has("mandelbrot") ? (
        <div
          className="viz-shell"
          style={{ display: view === "mandelbrot" ? "flex" : "none" }}
        >
          <MandelbrotApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("planetary-orbits") ? (
        <div
          className="viz-shell"
          style={{ display: view === "planetary-orbits" ? "flex" : "none" }}
        >
          <PlanetaryOrbitApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("l-systems") ? (
        <div
          className="viz-shell"
          style={{ display: view === "l-systems" ? "flex" : "none" }}
        >
          <LSystemApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("game-of-life") ? (
        <div
          className="viz-shell"
          style={{ display: view === "game-of-life" ? "flex" : "none" }}
        >
          <GameOfLifeApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("voronoi") ? (
        <div
          className="viz-shell"
          style={{ display: view === "voronoi" ? "flex" : "none" }}
        >
          <VoronoiApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("n-body") ? (
        <div
          className="viz-shell"
          style={{ display: view === "n-body" ? "flex" : "none" }}
        >
          <NBodyApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("newton-fractal") ? (
        <div
          className="viz-shell"
          style={{ display: view === "newton-fractal" ? "flex" : "none" }}
        >
          <NewtonFractalApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("mondrian") ? (
        <div
          className="viz-shell"
          style={{ display: view === "mondrian" ? "flex" : "none" }}
        >
          <MondrianApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("strange-attractors") ? (
        <div
          className="viz-shell"
          style={{ display: view === "strange-attractors" ? "flex" : "none" }}
        >
          <AttractorApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("fourier-epicycles") ? (
        <div
          className="viz-shell"
          style={{ display: view === "fourier-epicycles" ? "flex" : "none" }}
        >
          <FourierApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("bifurcation") ? (
        <div
          className="viz-shell"
          style={{ display: view === "bifurcation" ? "flex" : "none" }}
        >
          <BifurcationApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("elementary-ca") ? (
        <div
          className="viz-shell"
          style={{ display: view === "elementary-ca" ? "flex" : "none" }}
        >
          <ElementaryCAApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("prime-spirals") ? (
        <div
          className="viz-shell"
          style={{ display: view === "prime-spirals" ? "flex" : "none" }}
        >
          <PrimeSpiralApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("penrose-tiling") ? (
        <div
          className="viz-shell"
          style={{ display: view === "penrose-tiling" ? "flex" : "none" }}
        >
          <PenroseApp onHome={() => setView("home")} />
        </div>
      ) : null}
    </div>
  );
};

export default App;
