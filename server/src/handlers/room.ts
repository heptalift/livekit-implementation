import {AccessToken} from 'livekit-server-sdk';
import {config} from '../utils/config';
import {BaseModule} from '../common/base';

export class RoomHandler extends BaseModule {
  async joinOrCreateRoom({identity, roomName}: {identity: string; roomName: string}) {
    roomName = roomName.trim();
    const room = this.context.roomMap.get(roomName);
    console.log({roomName, identity});
    const at = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      ttl: 86400,
    });

    try {
      if (!room) {
        const existingRoom = this.context.rooms.find(r => r.admin === identity);
        if (existingRoom) {
          throw new Error('User cannot create more than 1 room');
        }

        const room = await this.context.roomManager.createRoom({
          name: roomName,
          maxParticipants: 20,
          emptyTimeout: 30,
        });

        this.context.roomMap.set(roomName, {
          ...room,
          admin: identity,
          participants: [
            {
              name: identity,
              isAdmin: true,
            },
          ],
        });
      }
      at.addGrant({roomJoin: true, room: roomName});
    } catch (error) {
      console.log(error);
      throw error;
    }

    return {token: at.toJwt()};
  }

  async deleteRoom({identity, roomName}: {identity: string; roomName: string}) {
    const room = this.context.roomMap.get(roomName);
    if (room?.admin === identity) {
      await this.context.roomManager.deleteRoom(roomName);
      this.context.roomMap.delete(roomName);
    }

    return {ok: true};
  }

  async listRoom() {
    return {rooms: this.context.rooms};
  }

  async getParticipants({roomName}: {roomName: string}) {
    const room = this.context.roomMap.get(roomName);
    if (!room) {
      throw new Error('No room found');
    }

    return {participants: room.participants};
  }
}
