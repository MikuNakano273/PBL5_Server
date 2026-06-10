import { listAlerts } from "../api/admin";
import { useI18n } from "../i18n/I18nProvider";
import ReadOnlyPage from "./ReadOnlyPage";

export default function AlertsPage() {
  const { t } = useI18n();
  return <ReadOnlyPage title={t("alerts")} loader={listAlerts} fields={["id", "user_id", "device_id", "type", "created_at"]} />;
}
