import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import App from "./App";

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("redirects a protected route to login without a token", async () => {
  renderApp("/users");
  expect(await screen.findByRole("heading", { name: "Đăng nhập quản trị" })).toBeInTheDocument();
});

test("logs in and opens the dashboard", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/auth/login")) {
      return new Response(JSON.stringify({ access_token: "admin-token", token_type: "bearer" }), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  });
  renderApp("/login");

  await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("Mật khẩu"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

  expect(await screen.findByRole("heading", { name: "Tổng quan" })).toBeInTheDocument();
  expect(sessionStorage.getItem("admin_access_token")).toBe("admin-token");
});

test("shows an authentication error", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ error: { message: "Invalid credentials" } }), { status: 401 }),
  );
  renderApp("/login");

  await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("Mật khẩu"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
});

test("switches language persistently and logs out", async () => {
  sessionStorage.setItem("admin_access_token", "admin-token");
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));
  renderApp("/");

  await userEvent.click(await screen.findByRole("button", { name: "EN" }));
  expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  expect(localStorage.getItem("admin_language")).toBe("en");

  await userEvent.click(screen.getByRole("button", { name: "Logout" }));
  await waitFor(() => expect(sessionStorage.getItem("admin_access_token")).toBeNull());
  expect(await screen.findByRole("heading", { name: "Admin login" })).toBeInTheDocument();
});
