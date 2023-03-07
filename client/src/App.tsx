import * as React from 'react';

import {DarkTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PreJoinPage} from './PreJoinPage';
import {RoomPage} from './RoomPage';
import {RoomContext} from './context/roomContext';
import Toast from 'react-native-toast-message';
import {client} from './network';

const Stack = createNativeStackNavigator();
export default function App() {
  React.useEffect(() => {
    client.getSocket().connect();
  }, []);
  return (
    <>
      <NavigationContainer theme={DarkTheme}>
        <RoomContext>
          <Stack.Navigator>
            <Stack.Screen name="PreJoinPage" component={PreJoinPage as any} />
            <Stack.Screen name="RoomPage" component={RoomPage as any} />
          </Stack.Navigator>
        </RoomContext>
      </NavigationContainer>
      <Toast />
    </>
  );
}

export type RootStackParamList = {
  PreJoinPage: undefined;
  RoomPage: undefined;
};
