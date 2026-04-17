"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const dashboard_service_1 = require("../../src/modules/dashboard/dashboard.service");
const alert_schema_1 = require("../../src/database/schemas/alert.schema");
const device_schema_1 = require("../../src/database/schemas/device.schema");
const user_live_status_schema_1 = require("../../src/database/schemas/user-live-status.schema");
const live_status_service_1 = require("../../src/modules/realtime/live-status.service");
describe('DashboardService', () => {
    let service;
    let alertModelMock;
    let deviceModelMock;
    let liveStatusModelMock;
    let liveStatusServiceMock;
    beforeEach(async () => {
        alertModelMock = {
            countDocuments: jest.fn().mockResolvedValue(3),
            find: jest.fn().mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => [] }) }) }),
        };
        deviceModelMock = {
            findById: jest.fn().mockReturnValue({
                select: () => ({ lean: () => ({ serial_number: 'SN-001', status: 'active', last_seen_at: new Date(), last_battery: 80 }) }),
            }),
        };
        liveStatusModelMock = {
            findOne: jest.fn().mockReturnValue({ lean: () => ({ device_id: 'dev1', current_safety_status: 'safe', nearest_distance_cm: 200 }) }),
        };
        liveStatusServiceMock = {
            getDashboardStatus: jest.fn().mockResolvedValue({ nearest_distance_cm: 200, last_location: null, current_safety_status: 'safe' }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                dashboard_service_1.DashboardService,
                { provide: (0, mongoose_1.getModelToken)(alert_schema_1.Alert.name), useValue: alertModelMock },
                { provide: (0, mongoose_1.getModelToken)(device_schema_1.Device.name), useValue: deviceModelMock },
                { provide: (0, mongoose_1.getModelToken)(user_live_status_schema_1.UserLiveStatus.name), useValue: liveStatusModelMock },
                { provide: live_status_service_1.LiveStatusService, useValue: liveStatusServiceMock },
            ],
        }).compile();
        service = module.get(dashboard_service_1.DashboardService);
    });
    it('should return dashboard with is_safe=true when status is safe', async () => {
        const result = await service.getDashboard('6566f4e4b5b3bc76a1e4000b');
        expect(result.is_safe).toBe(true);
        expect(result.current_safety_status).toBe('safe');
        expect(result).toHaveProperty('today_alert_count');
        expect(result).toHaveProperty('recent_alerts');
        expect(result).toHaveProperty('last_location');
    });
    it('should return is_safe=false when status is danger', async () => {
        liveStatusServiceMock.getDashboardStatus.mockResolvedValue({ nearest_distance_cm: 50, last_location: null, current_safety_status: 'danger' });
        const result = await service.getDashboard('6566f4e4b5b3bc76a1e4000b');
        expect(result.is_safe).toBe(false);
        expect(result.current_safety_status).toBe('danger');
    });
});
//# sourceMappingURL=dashboard.service.spec.js.map