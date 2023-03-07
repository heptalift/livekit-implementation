import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clear() {
  const asyncStorageKeys = await AsyncStorage.getAllKeys();
  if (asyncStorageKeys.length > 0) {
    if (Platform.OS === 'android') {
      await AsyncStorage.clear();
    }
    if (Platform.OS === 'ios') {
      await AsyncStorage.multiRemove(asyncStorageKeys);
    }
  } else {
    await AsyncStorage.clear();
  }
}
