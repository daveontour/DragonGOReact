import { VISUALIZATIONS, VisualizationId } from "../registry";

export default function HomePage({
  onSelect,
}: {
  onSelect: (id: VisualizationId) => void;
}) {
  return (
    <div className="mathart-home">
      <header className="mathart-home-header">
        <h1 className="mathart-home-title">MathArt</h1>
        <p className="mathart-home-subtitle">
          Explore mathematical patterns through interactive visualisations
        </p>
      </header>

      <div className="mathart-home-grid">
        {VISUALIZATIONS.map((viz) => (
          <button
            key={viz.id}
            type="button"
            className="mathart-viz-card"
            onClick={() => onSelect(viz.id)}
          >
            <div
              className={
                viz.previewImage
                  ? "mathart-viz-card-preview"
                  : `mathart-viz-card-preview mathart-viz-card-preview--${viz.id}`
              }
              aria-hidden="true"
            >
              {viz.previewImage ? (
                <img
                  src={viz.previewImage}
                  alt=""
                  className="mathart-viz-card-image"
                />
              ) : null}
            </div>
            <div className="mathart-viz-card-body">
              <h2 className="mathart-viz-card-title">{viz.title}</h2>
              <p className="mathart-viz-card-description">{viz.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
