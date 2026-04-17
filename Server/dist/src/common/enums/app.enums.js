"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertType = exports.AlertRiskLevel = exports.ImageRequestStatus = exports.DeviceStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["BLIND_USER"] = "blind_user";
    UserRole["GUARDIAN"] = "guardian";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ACTIVE"] = "active";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["DISABLED"] = "disabled";
    DeviceStatus["MAINTENANCE"] = "maintenance";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var ImageRequestStatus;
(function (ImageRequestStatus) {
    ImageRequestStatus["CREATED"] = "created";
    ImageRequestStatus["UPLOADED"] = "uploaded";
    ImageRequestStatus["QUEUED"] = "queued";
    ImageRequestStatus["PROCESSING"] = "processing";
    ImageRequestStatus["DONE"] = "done";
    ImageRequestStatus["FAILED"] = "failed";
})(ImageRequestStatus || (exports.ImageRequestStatus = ImageRequestStatus = {}));
var AlertRiskLevel;
(function (AlertRiskLevel) {
    AlertRiskLevel["LOW"] = "low";
    AlertRiskLevel["MEDIUM"] = "medium";
    AlertRiskLevel["HIGH"] = "high";
})(AlertRiskLevel || (exports.AlertRiskLevel = AlertRiskLevel = {}));
var AlertType;
(function (AlertType) {
    AlertType["OBSTACLE_DANGER"] = "obstacle_danger";
    AlertType["LOW_BATTERY"] = "low_battery";
    AlertType["DEVICE_OFFLINE"] = "device_offline";
    AlertType["NO_SIGNAL"] = "no_signal";
    AlertType["AI_DETECTION_WARNING"] = "ai_detection_warning";
})(AlertType || (exports.AlertType = AlertType = {}));
//# sourceMappingURL=app.enums.js.map