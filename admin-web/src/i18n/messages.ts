export const messages = {
  vi: {
    loginTitle: "Đăng nhập quản trị", password: "Mật khẩu", login: "Đăng nhập", dashboard: "Tổng quan",
    users: "Người dùng", devices: "Thiết bị", imageRequests: "Yêu cầu ảnh", alerts: "Cảnh báo",
    demoMonitor: "Giám sát demo", pictures: "Thư viện ảnh",
    logout: "Đăng xuất", loadedTotals: "Bản ghi đã tải", loading: "Đang tải...", empty: "Không có dữ liệu",
    error: "Không thể tải dữ liệu", previous: "Trước", next: "Sau", refresh: "Làm mới", edit: "Chỉnh sửa",
    assign: "Gán người dùng", save: "Lưu", cancel: "Hủy", fullName: "Họ tên", phone: "Điện thoại",
    status: "Trạng thái", user: "Người dùng", success: "Đã lưu thay đổi",
  },
  en: {
    loginTitle: "Admin login", password: "Password", login: "Login", dashboard: "Dashboard",
    users: "Users", devices: "Devices", imageRequests: "Image requests", alerts: "Alerts",
    demoMonitor: "Demo monitor", pictures: "Pictures",
    logout: "Logout", loadedTotals: "Loaded records", loading: "Loading...", empty: "No data",
    error: "Unable to load data", previous: "Previous", next: "Next", refresh: "Refresh", edit: "Edit",
    assign: "Assign user", save: "Save", cancel: "Cancel", fullName: "Full name", phone: "Phone",
    status: "Status", user: "User", success: "Changes saved",
  },
} as const;

export type Language = keyof typeof messages;
export type MessageKey = keyof typeof messages.vi;
