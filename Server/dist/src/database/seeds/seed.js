"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = require("mongoose");
const argon2 = require("argon2");
const app_enums_1 = require("../../common/enums/app.enums");
async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/pbl5?authSource=admin';
    await mongoose_1.default.connect(uri);
    const db = mongoose_1.default.connection.db;
    await Promise.all([
        db.collection('users').deleteMany({ email: { $in: ['admin@pbl5.dev', 'blind1@pbl5.dev', 'guardian1@pbl5.dev'] } }),
        db.collection('devices').deleteMany({ device_code: 'CANE-001' }),
        db.collection('care_links').deleteMany({}),
    ]);
    const [adminHash, blindHash, guardianHash] = await Promise.all([
        argon2.hash('Admin@123456'),
        argon2.hash('Blind@123456'),
        argon2.hash('Guardian@123456'),
    ]);
    const now = new Date();
    const [admin, blind, guardian] = await Promise.all([
        db.collection('users').insertOne({ email: 'admin@pbl5.dev', password_hash: adminHash, full_name: 'Admin PBL5', role: app_enums_1.UserRole.ADMIN, status: 'active', created_at: now, updated_at: now }),
        db.collection('users').insertOne({ email: 'blind1@pbl5.dev', password_hash: blindHash, full_name: 'Nguyen Van A (Blind)', role: app_enums_1.UserRole.BLIND_USER, status: 'active', created_at: now, updated_at: now }),
        db.collection('users').insertOne({ email: 'guardian1@pbl5.dev', password_hash: guardianHash, full_name: 'Tran Thi B (Guardian)', role: app_enums_1.UserRole.GUARDIAN, status: 'active', created_at: now, updated_at: now }),
    ]);
    const device = await db.collection('devices').insertOne({
        serial_number: 'SN-2024-001',
        device_code: 'CANE-001',
        owner_blind_user_id: blind.insertedId,
        name: 'Gay thong minh #1',
        firmware_version: '1.0.0',
        status: app_enums_1.DeviceStatus.ACTIVE,
        device_secret_hash: 'my-device-secret-CANE-001',
        created_at: now,
        updated_at: now,
    });
    await db.collection('care_links').insertOne({
        blind_user_id: blind.insertedId,
        guardian_user_id: guardian.insertedId,
        relation: 'family',
        status: 'active',
        can_view_live_location: true,
        can_receive_alert: true,
        created_at: now,
        updated_at: now,
    });
    await db.collection('user_live_status').updateOne({ blind_user_id: blind.insertedId }, { $set: { blind_user_id: blind.insertedId, device_id: device.insertedId, current_safety_status: 'safe', updated_at: now } }, { upsert: true });
    console.log('✅ Seed complete');
    console.log('  admin@pbl5.dev / Admin@123456');
    console.log('  blind1@pbl5.dev / Blind@123456');
    console.log('  guardian1@pbl5.dev / Guardian@123456');
    console.log('  Device: CANE-001 (secret: my-device-secret-CANE-001)');
    await mongoose_1.default.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map