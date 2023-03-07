import {Room as livekitRoom} from 'livekit-server-sdk';
export interface Participant {
  name: string;
  isAdmin: boolean;
}
export interface Room extends livekitRoom {
  admin: string;
  participants: Participant[];
}
