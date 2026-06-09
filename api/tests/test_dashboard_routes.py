import asyncio
from unittest import TestCase

from app.api.router import api_router
from app.api.routers import dashboard
from app.common.schemas.auth import AuthContext


class _DashboardService:
    def __init__(self):
        self.calls = []

    def get_dashboard(self, user_id, auth_context):
        self.calls.append(("dashboard", user_id, auth_context))
        return {"user_id": user_id}

    def get_devices(self, user_id, auth_context):
        self.calls.append(("devices", user_id, auth_context))
        return []

    def get_locations(self, user_id, auth_context, limit=20):
        self.calls.append(("locations", user_id, auth_context, limit))
        return []

    def get_alerts(self, user_id, auth_context, page=1, limit=20):
        self.calls.append(("alerts", user_id, auth_context, page, limit))
        return []


class DashboardRouteTest(TestCase):
    def setUp(self):
        self.auth_context = AuthContext(user_id="user-from-jwt", role="user", installation_id="inst-1")
        self.dashboard_service = _DashboardService()

    def test_me_aliases_use_authenticated_user_and_forward_query_parameters(self):
        asyncio.run(dashboard.get_my_dashboard(self.auth_context, self.dashboard_service))
        asyncio.run(dashboard.get_my_devices(self.auth_context, self.dashboard_service))
        asyncio.run(dashboard.get_my_locations(12, self.auth_context, self.dashboard_service))
        asyncio.run(dashboard.get_my_alerts(3, 7, self.auth_context, self.dashboard_service))

        self.assertEqual(
            self.dashboard_service.calls,
            [
                ("dashboard", "user-from-jwt", self.auth_context),
                ("devices", "user-from-jwt", self.auth_context),
                ("locations", "user-from-jwt", self.auth_context, 12),
                ("alerts", "user-from-jwt", self.auth_context, 3, 7),
            ],
        )

    def test_dashboard_me_route_is_registered_before_dynamic_user_id_route(self):
        route_paths = [route.path for route in dashboard.router.routes]

        self.assertLess(route_paths.index("/dashboard/me"), route_paths.index("/dashboard/{user_id}"))

    def test_existing_user_id_routes_remain_registered(self):
        route_paths = {route.path for route in dashboard.router.routes}

        self.assertTrue(
            {
                "/dashboard/{user_id}",
                "/users/{user_id}/devices",
                "/users/{user_id}/locations",
                "/users/{user_id}/alerts",
            }.issubset(route_paths)
        )

    def test_required_me_aliases_are_registered_with_full_mobile_paths(self):
        route_paths = {route.path for route in api_router.routes}

        self.assertTrue(
            {
                "/api/mobile/v1/dashboard/me",
                "/api/mobile/v1/me/devices",
                "/api/mobile/v1/me/locations",
                "/api/mobile/v1/me/alerts",
            }.issubset(route_paths)
        )
