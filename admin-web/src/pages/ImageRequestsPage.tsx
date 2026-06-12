import { useCallback } from "react";
import { listImageRequests } from "../api/admin";
import type { ImageRequest } from "../api/types";
import Pagination from "../components/Pagination";
import ResourceTable from "../components/ResourceTable";
import StatusBadge from "../components/StatusBadge";
import { usePagedResource } from "../hooks/usePagedResource";
import { useI18n } from "../i18n/I18nProvider";

export default function ImageRequestsPage() {
  const { t } = useI18n();
  const resource = usePagedResource<ImageRequest>(useCallback(listImageRequests, []));
  return <>
    <h1>{t("imageRequests")}</h1>
    <ResourceTable<ImageRequest>
      items={resource.items}
      loading={resource.loading}
      error={resource.error}
      columns={[
        {
          label: "image",
          render: (item) => item.image_url
            ? <img className="request-image" src={item.image_url} alt={`Image request ${item.id}`} />
            : null,
        },
        { label: "id", render: (item) => item.id },
        { label: "device_id", render: (item) => item.device_id },
        { label: "user_id", render: (item) => item.user_id },
        { label: "status", render: (item) => <StatusBadge value={item.status} /> },
        { label: "created_at", render: (item) => item.created_at },
      ]}
    />
    <Pagination {...resource} />
  </>;
}
