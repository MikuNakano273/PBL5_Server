import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:blind-user')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { blindUserId: string }) {
    const room = `blind-user:${data.blindUserId}`;
    client.join(room);
    this.logger.debug(`${client.id} joined room ${room}`);
    return { joined: room };
  }

  emitToBlindUser(blindUserId: string, event: string, payload: unknown) {
    this.logger.debug(`Emit ${event} for blindUser ${blindUserId}`);
    this.server.to(`blind-user:${blindUserId}`).emit(event, payload);
  }
}
