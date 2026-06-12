import { useCallback } from "react";
import { listAlerts } from "../api/admin";
import type { Alert, AlertSceneContext } from "../api/types";
import Pagination from "../components/Pagination";
import ResourceTable from "../components/ResourceTable";
import StatusBadge from "../components/StatusBadge";
import { usePagedResource } from "../hooks/usePagedResource";
import { useI18n } from "../i18n/I18nProvider";

function SceneContext({ context }: { context?: AlertSceneContext }) {
  if (!context) return null;
  const objects = context.objects?.map((item) => {
    const label = item.label ?? item.class ?? "object";
    return item.confidence === undefined ? label : `${label} (${Math.round(item.confidence * 100)}%)`;
  }).join(", ");
  return <div className="alert-context">
    <strong>{context.summary_text}</strong>
    {context.type && <span>{context.type}</span>}
    {context.confidence !== undefined && <span>{Math.round(context.confidence * 100)}%</span>}
    {objects && <span>{objects}</span>}
    {context.nearest_obstacle_cm !== null && context.nearest_obstacle_cm !== undefined
      && <span>{context.nearest_obstacle_cm} cm</span>}
  </div>;
}

export default function AlertsPage() {
  const { t } = useI18n();
  const resource = usePagedResource<Alert>(useCallback(listAlerts, []));
  return <>
    <h1>{t("alerts")}</h1>
    <ResourceTable<Alert>
      items={resource.items}
      loading={resource.loading}
      error={resource.error}
      columns={[
        { label: "id", render: (item) => item.id },
        { label: "alert_type", render: (item) => item.alert_type },
        { label: "risk_level", render: (item) => <StatusBadge value={item.risk_level} /> },
        { label: "scene_context", render: (item) => <SceneContext context={item.scene_context} /> },
        { label: "triggered_at", render: (item) => item.triggered_at },
      ]}
    />
    <Pagination {...resource} />
  </>;
}
