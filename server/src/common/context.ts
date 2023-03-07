import {RoomServiceClient} from 'livekit-server-sdk';
import {config} from '../utils/config';
import {Room} from './interfaces';

export class Context {
  roomManager: RoomServiceClient;
  roomMap: Map<string, Room>;

  constructor() {
    this.roomManager = new RoomServiceClient(config.livekitHost, config.apiKey, config.apiSecret);
    this.roomMap = new Map();
  }

  get rooms() {
    const result = [];
    const it = this.roomMap.values();
    while (true) {
      const next = it.next();
      if (next.done) {
        break;
      } else {
        result.push(next.value);
      }
    }
    return result;
  }
}
