import { useEffect, useMemo, useState } from "react";
import { getDemoState } from "../api/demo";
import type { DemoState } from "../api/types";
import StatusBadge from "../components/StatusBadge";

const POLL_MS = 1000;

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDistance(value: number | null) {
  return value === null ? "-" : `${value.toFixed(1)} cm`;
}

function formatGps(gps: DemoState["latest_sensor"]["gps"]) {
  if (!gps) return "-";
  return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
}

export default function DemoMonitorPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const load = () => {
      getDemoState()
        .then((data) => {
          if (!active) return;
          setState(data);
          setError("");
          setLastUpdatedAt(new Date());
        })
        .catch(() => {
          if (active) setError("Unable to load demo state");
        });
    };

    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const imageSrc = useMemo(() => {
    if (!state?.latest_frame.image_url) return "";
    const version = `${state.latest_frame.frame_id ?? "frame"}-${state.scene_context.age_ms}`;
    return `${state.latest_frame.image_url}?v=${encodeURIComponent(version)}`;
  }, [state]);

  const context = state?.scene_context;

  return <section className="demo-monitor">
    <div className="page-title-row">
      <div>
        <h1>Demo Monitor</h1>
        <p>Device {state?.device_id ?? "pbl5-01"}</p>
      </div>
      <span className={`live-dot ${context?.fresh ? "live-dot-on" : ""}`}>{context?.fresh ? "Live" : "Stale"}</span>
    </div>

    {error && <p role="alert" className="error">{error}</p>}

    <div className="demo-monitor-grid">
      <section className="frame-panel" aria-label="Latest frame">
        {imageSrc ? <img src={imageSrc} alt="Latest ESP32-CAM frame" /> : <div className="frame-empty">No frame</div>}
        <div className="frame-meta">
          <span>{state?.latest_frame.frame_id ?? "-"}</span>
          <span>{lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "-"}</span>
        </div>
      </section>

      <aside className="context-panel">
        <h2>scene_context</h2>
        <dl className="context-list">
          <div><dt>type</dt><dd>{context?.type ?? "stale"}</dd></div>
          <div><dt>risk_level</dt><dd><StatusBadge value={context?.risk_level ?? "clear"} /></dd></div>
          <div><dt>confidence</dt><dd>{context ? formatPercent(context.confidence) : "0%"}</dd></div>
          <div><dt>age_ms</dt><dd>{context?.age_ms ?? "-"}</dd></div>
          <div><dt>fresh</dt><dd>{context?.fresh ? "true" : "false"}</dd></div>
        </dl>

        <h2>latest_sensor</h2>
        <dl className="context-list">
          <div><dt>seq</dt><dd>{state?.latest_sensor.seq ?? "-"}</dd></div>
          <div><dt>distance</dt><dd>{formatDistance(state?.latest_sensor.distance_cm ?? null)}</dd></div>
          <div><dt>alert_level</dt><dd><StatusBadge value={state?.latest_sensor.alert_level ?? "clear"} /></dd></div>
          <div><dt>gps</dt><dd>{formatGps(state?.latest_sensor.gps ?? null)}</dd></div>
        </dl>
      </aside>
    </div>
  </section>;
}
