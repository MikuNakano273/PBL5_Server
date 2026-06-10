import { useEffect, useState } from "react";
import { listDemoPictures } from "../api/demo";
import type { DemoDetectedObject, DemoPicture } from "../api/types";
import StatusBadge from "../components/StatusBadge";

function boxStyle(object: DemoDetectedObject, picture: DemoPicture) {
  if (!object.bbox) return undefined;
  const width = picture.image_width || Math.max(object.bbox.x2, 1);
  const height = picture.image_height || Math.max(object.bbox.y2, 1);
  return {
    left: `${(object.bbox.x1 / width) * 100}%`,
    top: `${(object.bbox.y1 / height) * 100}%`,
    width: `${((object.bbox.x2 - object.bbox.x1) / width) * 100}%`,
    height: `${((object.bbox.y2 - object.bbox.y1) / height) * 100}%`,
  };
}

export default function PicturesPage() {
  const [pictures, setPictures] = useState<DemoPicture[]>([]);
  const [selected, setSelected] = useState<DemoPicture | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      listDemoPictures()
        .then((items) => {
          if (!active) return;
          setPictures(items);
          setSelected((current) => items.find((item) => item.frame_id === current?.frame_id) ?? current ?? items[0] ?? null);
          setError("");
        })
        .catch(() => {
          if (active) setError("Unable to load pictures");
        });
    };
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return <section className="pictures-page">
    <div className="page-title-row">
      <div><h1>Pictures</h1><p>{pictures.length} persisted frame(s)</p></div>
    </div>
    {error && <p role="alert" className="error">{error}</p>}

    <div className="pictures-layout">
      <section className="picture-grid" aria-label="Persisted pictures">
        {pictures.map((picture) => <button
          type="button"
          className={`picture-thumb ${selected?.frame_id === picture.frame_id ? "picture-thumb-selected" : ""}`}
          key={picture.frame_id}
          aria-label={`Select ${picture.frame_id}`}
          onClick={() => setSelected(picture)}
        >
          <img src={picture.image_url} alt="" />
          <span>{picture.frame_id}</span>
          <small>{new Date(picture.created_at).toLocaleString()}</small>
        </button>)}
        {!pictures.length && !error && <div className="empty">No pictures</div>}
      </section>

      <section className="picture-detail">
        {selected ? <>
          <div className="picture-stage">
            <img src={selected.image_url} alt={`Selected frame ${selected.frame_id}`} />
            {selected.objects.filter((object) => object.bbox).map((object, index) =>
              <div className="picture-bbox" data-testid="picture-bbox" style={boxStyle(object, selected)} key={`${object.label}-${index}`}>
                <span>{object.label} {Math.round(object.confidence * 100)}%</span>
              </div>)}
          </div>

          <div className="picture-inspector">
            <h2>{selected.frame_id}</h2>
            <dl className="context-list">
              <div><dt>device</dt><dd>{selected.device_id}</dd></div>
              <div><dt>type</dt><dd>{selected.scene_context.type}</dd></div>
              <div><dt>risk</dt><dd><StatusBadge value={selected.scene_context.risk_level} /></dd></div>
              <div><dt>confidence</dt><dd>{Math.round(selected.scene_context.confidence * 100)}%</dd></div>
            </dl>
            <h2>Objects</h2>
            <ul className="object-list">
              {selected.objects.map((object, index) => <li key={`${object.label}-${index}`}>
                <strong>{object.label}</strong><span>{Math.round(object.confidence * 100)}%</span>
              </li>)}
              {!selected.objects.length && <li>No objects</li>}
            </ul>
          </div>
        </> : <div className="empty">Select a picture</div>}
      </section>
    </div>
  </section>;
}
