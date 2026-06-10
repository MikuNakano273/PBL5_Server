import { useEffect, useState } from "react";
import { listAlerts, listDevices, listImageRequests, listUsers } from "../api/admin";
import { useI18n } from "../i18n/I18nProvider";

export default function DashboardPage() {
  const { t } = useI18n();
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  useEffect(() => {
    Promise.all([listUsers(1, 20), listDevices(1, 20), listImageRequests(1, 20), listAlerts(1, 20)])
      .then((results) => setCounts(results.map((items) => items.length)))
      .catch(() => setCounts([0, 0, 0, 0]));
  }, []);
  const labels = [t("users"), t("devices"), t("imageRequests"), t("alerts")];
  return <><h1>{t("dashboard")}</h1><section className="cards">{labels.map((label, index) =>
    <article className="card" key={label}><span>{label}</span><strong>{counts[index]}</strong><small>{t("loadedTotals")}</small></article>)}</section></>;
}
