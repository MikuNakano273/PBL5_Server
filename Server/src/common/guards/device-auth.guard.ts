import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from 'src/database/schemas/device.schema';
import * as argon2 from 'argon2';

const TIMESTAMP_TOLERANCE_MS = 30_000;

/**
 * Validates HMAC-SHA256 signature on cane device requests.
 * Headers required:
 *   x-device-code, x-timestamp, x-signature
 * Signature = HMAC-SHA256(method + '\n' + path + '\n' + rawBody + '\n' + timestamp, device_secret)
 */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const deviceCode: string | undefined = req.headers['x-device-code'];
    const timestamp: string | undefined = req.headers['x-timestamp'];
    const signature: string | undefined = req.headers['x-signature'];

    if (!deviceCode || !timestamp || !signature) {
      throw new UnauthorizedException('Missing device auth headers');
    }

    const ts = Number(timestamp);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      throw new UnauthorizedException('Timestamp out of range');
    }

    const device = await this.deviceModel
      .findOne({ device_code: deviceCode, status: { $ne: 'disabled' } })
      .lean();
    if (!device || !device.device_secret_hash) {
      throw new UnauthorizedException('Unknown device');
    }

    // device_secret_hash stores the raw secret (hashed). We store the plaintext secret
    // hashed via argon2 at registration and verify here; but for HMAC we need plaintext.
    // So we store the plaintext secret separately for HMAC; here we use a shared secret strategy:
    // device_secret_hash is used as the HMAC key directly (it IS the secret, not a hash of it).
    const rawBody: string = req.rawBody || JSON.stringify(req.body) || '';
    const message = [req.method, req.originalUrl, rawBody, timestamp].join('\n');
    const expected = createHmac('sha256', device.device_secret_hash)
      .update(message)
      .digest('hex');

    if (expected !== signature) throw new UnauthorizedException('Invalid signature');

    // Attach device to request for downstream use
    req.device = device;
    return true;
  }
}
