import { listImageRequests } from "../api/admin";
import { useI18n } from "../i18n/I18nProvider";
import ReadOnlyPage from "./ReadOnlyPage";

export default function ImageRequestsPage() {
  const { t } = useI18n();
  return <ReadOnlyPage title={t("imageRequests")} loader={listImageRequests} fields={["id", "device_id", "user_id", "status", "created_at"]} />;
}
