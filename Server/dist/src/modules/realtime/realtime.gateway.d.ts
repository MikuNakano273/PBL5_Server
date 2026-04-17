import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoin(client: Socket, data: {
        blindUserId: string;
    }): {
        joined: string;
    };
    emitToBlindUser(blindUserId: string, event: string, payload: unknown): void;
}
