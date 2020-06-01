import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {H2} from 'native-base';

import {Typography} from '../styles';
import UserAvatar from '../components/UserAvatar';
import TextButton from '../components/TextButton';

export default function SettingsScreen({navigation}) {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [version, setVersion] = useState(null);

  const handleEditUser = () => {
    navigation.navigate('UpdateUserScreen');
  };

  const handleClearData = async () => {
    Alert.alert(
      'Delete account',
      'WARNING\nThis will delete all data off of this device and log you out. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            await window.controller.clearData();
          },
          style: 'destructive',
        },
      ],
    );
  };

  const loadData = async function() {
    console.debug('Loading setting screen data');
    setUser(await window.controller.currentUser());
    setDevices(await window.controller.getDevices());
    setDeviceId(await window.controller.getDeviceId());
    setVersion(await window.controller.getVersion());
  };

  useFocusEffect(
    // useCallback here to prevent an infinite loop
    // See: https://reactnavigation.org/docs/use-focus-effect/#how-is-usefocuseffect-different-from-adding-a-listener-for-focus-event
    useCallback(() => {
      loadData();
    }, []),
  );

  return (
    <>
      {user && (
        <>
          <H2 style={Typography.headerPadding}>Personal</H2>
          <UserAvatar user={user} />
          <Text>Name: {user.attributes.name}</Text>
          <Text>Email: {user.attributes.email}</Text>
          <TextButton title="Edit" onPress={handleEditUser} />
        </>
      )}
      {devices.length > 0 && (
        <View>
          <H2 style={Typography.headerPadding}>Devices</H2>
          <FlatList
            data={devices}
            extraData={deviceId}
            renderItem={({item: device}) => (
              <Text>{window.view.deviceDisplay(device, deviceId)}</Text>
            )}
          />
        </View>
      )}
      {
        <>
          <H2 style={Typography.headerPadding}>Private Data</H2>
          <TextButton title="Delete account" onPress={handleClearData} danger />
        </>
      }
      {version && (
        <>
          <H2 style={Typography.headerPadding}>Misc</H2>
          <Text>Version: {version}</Text>
        </>
      )}
    </>
  );
}
