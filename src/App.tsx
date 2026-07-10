import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import HomePage from "./pages/HomePage";
import DragonCurvesApp from "./dragon-curves/DragonCurvesApp";
import KnightsTourApp from "./knights-tour/KnightsTourApp";
import PiNGonApp from "./pi-n-gon/PiNGonApp";
import CollatzApp from "./collatz/CollatzApp";
import MandelbrotApp from "./mandelbrot/MandelbrotApp";
import LSystemApp from "./l-systems/LSystemApp";
import GameOfLifeApp from "./game-of-life/GameOfLifeApp";
import VoronoiApp from "./voronoi/VoronoiApp";
import NBodyApp from "./n-body/NBodyApp";
import NewtonFractalApp from "./newton-fractal/NewtonFractalApp";
import MondrianApp from "./mondrian/MondrianApp";
import AttractorApp from "./strange-attractors/AttractorApp";
import FourierApp from "./fourier-epicycles/FourierApp";
import BifurcationApp from "./bifurcation/BifurcationApp";
import ElementaryCAApp from "./elementary-ca/ElementaryCAApp";
import PrimeSpiralApp from "./prime-spirals/PrimeSpiralApp";
import PenroseApp from "./penrose-tiling/PenroseApp";
import MorelletApp from "./morellet/MorelletApp";
import MorelletTilesApp from "./morellet-tiles/MorelletTilesApp";
import OpArtApp from "./op-art/OpArtApp";
import ChladniApp from "./chladni-patterns/ChladniApp";
import FlowFieldsApp from "./flow-fields/FlowFieldsApp";
import PhyllotaxisApp from "./phyllotaxis/PhyllotaxisApp";
import ReactionDiffusionApp from "./reaction-diffusion/ReactionDiffusionApp";
import SpirographApp from "./spirograph/SpirographApp";
import LissajousApp from "./lissajous/LissajousApp";
import HarmonographApp from "./harmonograph/HarmonographApp";
import RoseCurvesApp from "./rose-curves/RoseCurvesApp";
import SuperformulaApp from "./superformula/SuperformulaApp";
import EulerSpiralApp from "./euler-spiral/EulerSpiralApp";
import CurveStitchingApp from "./curve-stitching/CurveStitchingApp";
import { VisualizationId } from "./registry";

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

      {mountedViz.has("morellet") ? (
        <div
          className="viz-shell"
          style={{ display: view === "morellet" ? "flex" : "none" }}
        >
          <MorelletApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("morellet-tiles") ? (
        <div
          className="viz-shell"
          style={{ display: view === "morellet-tiles" ? "flex" : "none" }}
        >
          <MorelletTilesApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("op-art") ? (
        <div
          className="viz-shell"
          style={{ display: view === "op-art" ? "flex" : "none" }}
        >
          <OpArtApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("chladni-patterns") ? (
        <div
          className="viz-shell"
          style={{ display: view === "chladni-patterns" ? "flex" : "none" }}
        >
          <ChladniApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("flow-fields") ? (
        <div
          className="viz-shell"
          style={{ display: view === "flow-fields" ? "flex" : "none" }}
        >
          <FlowFieldsApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("phyllotaxis") ? (
        <div
          className="viz-shell"
          style={{ display: view === "phyllotaxis" ? "flex" : "none" }}
        >
          <PhyllotaxisApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("reaction-diffusion") ? (
        <div
          className="viz-shell"
          style={{ display: view === "reaction-diffusion" ? "flex" : "none" }}
        >
          <ReactionDiffusionApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("spirograph") ? (
        <div
          className="viz-shell"
          style={{ display: view === "spirograph" ? "flex" : "none" }}
        >
          <SpirographApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("lissajous") ? (
        <div
          className="viz-shell"
          style={{ display: view === "lissajous" ? "flex" : "none" }}
        >
          <LissajousApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("harmonograph") ? (
        <div
          className="viz-shell"
          style={{ display: view === "harmonograph" ? "flex" : "none" }}
        >
          <HarmonographApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("rose-curves") ? (
        <div
          className="viz-shell"
          style={{ display: view === "rose-curves" ? "flex" : "none" }}
        >
          <RoseCurvesApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("superformula") ? (
        <div
          className="viz-shell"
          style={{ display: view === "superformula" ? "flex" : "none" }}
        >
          <SuperformulaApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("euler-spiral") ? (
        <div
          className="viz-shell"
          style={{ display: view === "euler-spiral" ? "flex" : "none" }}
        >
          <EulerSpiralApp onHome={() => setView("home")} />
        </div>
      ) : null}

      {mountedViz.has("curve-stitching") ? (
        <div
          className="viz-shell"
          style={{ display: view === "curve-stitching" ? "flex" : "none" }}
        >
          <CurveStitchingApp onHome={() => setView("home")} />
        </div>
      ) : null}
    </div>
  );
};

export default App;
