import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { I18nProvider } from "./i18n/I18nProvider";
import AdminLayout from "./layout/AdminLayout";
import AlertsPage from "./pages/AlertsPage";
import DashboardPage from "./pages/DashboardPage";
import DemoMonitorPage from "./pages/DemoMonitorPage";
import DevicesPage from "./pages/DevicesPage";
import ImageRequestsPage from "./pages/ImageRequestsPage";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return <I18nProvider><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="demo-monitor" element={<DemoMonitorPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="devices" element={<DevicesPage />} />
      <Route path="image-requests" element={<ImageRequestsPage />} />
      <Route path="alerts" element={<AlertsPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></I18nProvider>;
}
