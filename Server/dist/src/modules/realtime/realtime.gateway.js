"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    logger = new common_1.Logger(RealtimeGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.debug(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }
    handleJoin(client, data) {
        const room = `blind-user:${data.blindUserId}`;
        client.join(room);
        this.logger.debug(`${client.id} joined room ${room}`);
        return { joined: room };
    }
    emitToBlindUser(blindUserId, event, payload) {
        this.logger.debug(`Emit ${event} for blindUser ${blindUserId}`);
        this.server.to(`blind-user:${blindUserId}`).emit(event, payload);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:blind-user'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleJoin", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/realtime', cors: { origin: '*' } })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map