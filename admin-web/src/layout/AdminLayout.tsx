import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/session";
import { useI18n } from "../i18n/I18nProvider";

export default function AdminLayout() {
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const logout = () => { clearToken(); navigate("/login"); };
  useEffect(() => {
    const unauthorized = () => navigate("/login");
    window.addEventListener("admin-unauthorized", unauthorized);
    return () => window.removeEventListener("admin-unauthorized", unauthorized);
  }, [navigate]);
  const links = [["/", t("dashboard")], ["/demo-monitor", t("demoMonitor")], ["/pictures", t("pictures")], ["/users", t("users")], ["/devices", t("devices")], ["/image-requests", t("imageRequests")], ["/alerts", t("alerts")]];
  return <div className="admin-shell">
    <aside><div className="brand">PBL5 Admin</div><nav>{links.map(([path, label]) => <NavLink key={path} to={path} end={path === "/"}>{label}</NavLink>)}</nav></aside>
    <div className="content-shell"><header><button onClick={() => setLanguage(language === "vi" ? "en" : "vi")}>{language === "vi" ? "EN" : "VI"}</button><button onClick={logout}>{t("logout")}</button></header><main><Outlet /></main></div>
  </div>;
}
