import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./session";

export default function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}
