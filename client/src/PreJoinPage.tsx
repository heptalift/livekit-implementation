import * as React from 'react';
import {useState, useEffect, useContext} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {StyleSheet, View, TextInput, Text, Button} from 'react-native';
import type {RootStackParamList} from './App';
import {useTheme} from '@react-navigation/native';
import {roomContext} from './context/roomContext';

export const PreJoinPage = ({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'PreJoinPage'>) => {
  const {token, reset, joinOrCreateRoom} = useContext(roomContext);
  const {colors} = useTheme();

  const [roomName, setRoomName] = useState('');
  const [identity, setIdentity] = useState('');

  useEffect(() => {
    if (token) {
      navigation.push('RoomPage');
    }
  }, [navigation, token]);
  return (
    <View style={styles.container}>
      <Text style={{color: colors.text}}>Room name:</Text>
      <TextInput
        style={{
          color: colors.text,
          borderColor: colors.border,
          ...styles.input,
        }}
        onChangeText={setRoomName}
        value={roomName}
      />

      <Text style={{color: colors.text}}>Identity: </Text>
      <TextInput
        style={{
          color: colors.text,
          borderColor: colors.border,
          ...styles.input,
        }}
        onChangeText={setIdentity}
        value={identity}
      />

      <Button
        title="Connect"
        onPress={() => {
          joinOrCreateRoom(identity, roomName);
        }}
      />

      <View style={styles.spacer} />

      <Button
        title="Reset Values"
        onPress={() => {
          reset();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    width: '100%',
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  spacer: {
    height: 10,
  },
});
