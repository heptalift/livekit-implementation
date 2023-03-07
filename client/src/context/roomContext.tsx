/* eslint-disable react-hooks/exhaustive-deps */
import React, {createContext, useCallback, useState, useEffect} from 'react';
import {ConnectionState, Room} from 'livekit-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {client} from '../network';
import {clear} from '../utils/storage';

const roomContextDefaultValue = {
  token: '',
  identity: '',
  currentRoom: null,
  joinOrCreateRoom: async (identity: string, roomName: string) => {
    identity;
    roomName;
  },
  deleteRoom: async (identity: string, roomName: string) => {
    identity;
    roomName;
  },
  reset: () => {},
};
export const roomContext = createContext<{
  token: string;
  identity: string;
  currentRoom: Room | null;
  joinOrCreateRoom: (identity: string, roomName: string) => Promise<void>;
  deleteRoom: (identity: string, roomName: string) => Promise<void>;
  reset: () => void;
}>(roomContextDefaultValue);
export function RoomContext({children}: any) {
  const [currentRoom] = useState(
    new Room({
      publishDefaults: {simulcast: false},
      adaptiveStream: true,
    }),
  );
  const [identity, setIdentity] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => {
      setToken((await AsyncStorage.getItem('token')) || '');
      setIdentity((await AsyncStorage.getItem('identity')) || '');
    })();
  }, []);

  const joinOrCreateRoom = useCallback(
    async (identity: string, roomName: string) => {
      if (!currentRoom || currentRoom.state === ConnectionState.Disconnected) {
        const {token} = await client.request('joinOrCreateRoom', {
          roomName,
          identity,
        });
        setToken(token);
        setIdentity(identity);
        try {
          await AsyncStorage.setItem('identity', identity);
          await AsyncStorage.setItem('token', token);
        } catch (error) {
          console.log(error);
        }
      }
    },
    [currentRoom],
  );
  const deleteRoom = useCallback(
    async (identity: string, roomName: string) => {
      if (currentRoom && currentRoom.state === ConnectionState.Connected) {
        await client.request('deleteRoom', {
          roomName,
          identity,
        });
      }
    },
    [currentRoom],
  );
  const reset = useCallback(async () => {
    await clear();
    setToken('');
    setIdentity('');
    if (currentRoom.state === ConnectionState.Connected) {
      currentRoom.disconnect();
    }
  }, [currentRoom]);
  return (
    <roomContext.Provider
      value={{
        identity,
        token,
        currentRoom,
        joinOrCreateRoom,
        deleteRoom,
        reset,
      }}>
      {children}
    </roomContext.Provider>
  );
}
