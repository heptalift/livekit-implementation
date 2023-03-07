import {BaseModule} from '../common/base';
import {Context} from '../common/context';
import {Participant} from '../common/interfaces';
import {RoomHandler} from './room';
export default class Handler extends BaseModule implements RoomHandler {
  private roomHandler;

  constructor(context: Context) {
    super(context);
    this.roomHandler = new RoomHandler(context);
  }
  getParticipants({roomName}: {roomName: string}) {
    return this.roomHandler.getParticipants({roomName});
  }
  joinOrCreateRoom({identity, roomName}: {identity: string; roomName: string}) {
    return this.roomHandler.joinOrCreateRoom({identity, roomName});
  }
  deleteRoom({identity, roomName}: {identity: string; roomName: string}) {
    return this.roomHandler.deleteRoom({identity, roomName});
  }
  listRoom() {
    return this.roomHandler.listRoom();
  }
}
