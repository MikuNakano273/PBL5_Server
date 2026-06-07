import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

function renderRoute(path: string) {
  sessionStorage.setItem("admin_access_token", "token");
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

test("edits the allowed user fields and displays the update", async () => {
  let user = { id: "u1", email: "user@example.com", full_name: "Old Name", phone: "0900", status: "active" };
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.endsWith("/users/u1") && init?.method === "PATCH") {
      user = { ...user, ...JSON.parse(String(init.body)) };
      return new Response(JSON.stringify(user), { status: 200 });
    }
    if (url.endsWith("/users/u1")) return new Response(JSON.stringify(user), { status: 200 });
    return new Response(JSON.stringify([user]), { status: 200 });
  });
  renderRoute("/users");

  await userEvent.click(await screen.findByRole("button", { name: "Chỉnh sửa" }));
  const name = screen.getByLabelText("Họ tên");
  await userEvent.clear(name);
  await userEvent.type(name, "New Name");
  await userEvent.click(screen.getByRole("button", { name: "Lưu" }));

  expect(await screen.findByText("New Name")).toBeInTheDocument();
  const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ full_name: "New Name", phone: "0900", status: "active" });
});

test("assigns a device to a loaded user", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (init?.method === "POST") return new Response(JSON.stringify({ id: "d1", user_id: "u1" }), { status: 200 });
    if (url.includes("/users")) return new Response(JSON.stringify([{ id: "u1", full_name: "User One" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: "d1", device_code: "CANE-1", status: "online" }]), { status: 200 });
  });
  renderRoute("/devices");

  await userEvent.click(await screen.findByRole("button", { name: "Gán người dùng" }));
  await userEvent.selectOptions(screen.getByLabelText("Người dùng"), "u1");
  await userEvent.click(screen.getByRole("button", { name: "Lưu" }));

  await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) =>
    init?.method === "POST" && String(init.body) === JSON.stringify({ user_id: "u1" }),
  )).toBe(true));
});

test("keeps the user dialog open and shows a mutation error", async () => {
  const user = { id: "u1", full_name: "Old Name", phone: "0900", status: "active" };
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (init?.method === "PATCH") return new Response("failed", { status: 500 });
    return new Response(JSON.stringify(String(input).endsWith("/users/u1") ? user : [user]), { status: 200 });
  });
  renderRoute("/users");

  await userEvent.click(await screen.findByRole("button", { name: "Chỉnh sửa" }));
  await userEvent.click(screen.getByRole("button", { name: "Lưu" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải dữ liệu");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("shows empty and API error states", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("[]", { status: 200 }));
  const { unmount } = renderRoute("/alerts");
  expect(await screen.findByText("Không có dữ liệu")).toBeInTheDocument();
  unmount();

  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("failed", { status: 500 }));
  renderRoute("/image-requests");
  expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải dữ liệu");
});

test("renders missing optional fields neutrally and paginates a full page", async () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({ id: `a${index}` }));
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
  renderRoute("/alerts");

  expect(await screen.findAllByText("—")).not.toHaveLength(0);
  await userEvent.click(screen.getByRole("button", { name: "Sau" }));
  await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => String(input).includes("page=2"))).toBe(true));
});

test("renders the demo monitor with the latest frame and scene context", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({
      device_id: "pbl5-01",
      latest_sensor: {
        seq: 7,
        distance_cm: 72.4,
        obstacle_in_1m: true,
        alert_level: "warning",
        gps: { fix: false, lat: 16.047079, lng: 108.20623 },
      },
      latest_frame: {
        frame_id: "frame_45",
        image_url: "/uploads/frame_45.jpg",
      },
      scene_context: {
        type: "static_obstacle",
        risk_level: "warning",
        confidence: 0.76,
        age_ms: 1200,
        fresh: true,
      },
    }), { status: 200 }),
  );

  renderRoute("/demo-monitor");

  expect(await screen.findByRole("heading", { name: "Demo Monitor" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Latest ESP32-CAM frame" })).toHaveAttribute(
    "src",
    expect.stringContaining("/uploads/frame_45.jpg"),
  );
  expect(screen.getByText("static_obstacle")).toBeInTheDocument();
  expect(screen.getAllByText("warning").length).toBeGreaterThan(0);
  expect(screen.getByText("76%")).toBeInTheDocument();
});
