import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CareLinksModule } from './modules/care-links/care-links.module';
import { DevicesModule } from './modules/devices/devices.module';
import { GpsModule } from './modules/gps/gps.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { ImageRequestsModule } from './modules/image-requests/image-requests.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { StorageModule } from './modules/storage/storage.module';
import { InternalModule } from './modules/internal/internal.module';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.get<string>('MONGODB_URI') }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: Number(config.get<string>('REDIS_PORT') || 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get<string>('REDIS_DB') || 0),
        },
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CareLinksModule,
    DevicesModule,
    GpsModule,
    TelemetryModule,
    ImageRequestsModule,
    AlertsModule,
    DashboardModule,
    NotificationsModule,
    RealtimeModule,
    StorageModule,
    InternalModule,
    AdminModule,
    JobsModule,
  ],
})
export class AppModule {}
