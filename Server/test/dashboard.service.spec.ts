import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { Alert } from '../../src/database/schemas/alert.schema';
import { Device } from '../../src/database/schemas/device.schema';
import { UserLiveStatus } from '../../src/database/schemas/user-live-status.schema';
import { LiveStatusService } from '../../src/modules/realtime/live-status.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let alertModelMock: any;
  let deviceModelMock: any;
  let liveStatusModelMock: any;
  let liveStatusServiceMock: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken(Alert.name), useValue: alertModelMock },
        { provide: getModelToken(Device.name), useValue: deviceModelMock },
        { provide: getModelToken(UserLiveStatus.name), useValue: liveStatusModelMock },
        { provide: LiveStatusService, useValue: liveStatusServiceMock },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
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
