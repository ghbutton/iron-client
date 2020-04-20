import React, {useCallback, useEffect, useState} from "react";
import {Alert, FlatList, StyleSheet, Text, View} from "react-native";
import {useFocusEffect} from "@react-navigation/native";

import {Typography} from "../styles";
import UserAvatar from "../components/UserAvatar";
import TextButton from "../components/TextButton";

export default function SettingsScreen({navigation}) {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [version, setVersion] = useState(null);

  const handleEditUser = () => {
    navigation.navigate("UpdateUserScreen");
  };

  const handleClearData = async () => {
    Alert.alert(
        "Delete account",
        "WARNING\nThis will delete all data off of this device and if this is your only device it will delete your account. Are you sure?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: async () => {
              await window.controller.clearData();
            },
            style: "destructive",
          },
        ],
    );
  };

  const loadData = async function() {
    console.debug("Loading setting screen data");
    setUser(await window.controller.currentUser());
    setDevices(await window.controller.getDevices());
    setDeviceId(await window.controller.getDeviceId());
    setVersion(await window.controller.getVersion());
  };

  useFocusEffect(
      // Nesting usecallback here to prevent an infinite loop
      // See: https://reactnavigation.org/docs/use-focus-effect/#how-is-usefocuseffect-different-from-adding-a-listener-for-focus-event
      useCallback(() => {
        loadData();
      }, []),
  );

  return (
    <View>
      {(user) && (
        <View>
          <Text style={Typography.header2}>Personal</Text>
          <UserAvatar user={user} />
          <Text>Name: {user.attributes.name}</Text>
          <Text>Email: {user.attributes.email}</Text>
          <TextButton
            title="Edit"
            onPress={handleEditUser}
          />
        </View>
      )}
      { devices.length > 0 && (
        <View>
          <Text style={Typography.header2}>Devices</Text>
          <FlatList
            data={devices}
            extraData={deviceId}
            renderItem={({item: device}) => (<Text>{window.view.deviceDisplay(device, deviceId)}</Text>)}
          />
        </View>
      )}
      <View>
        <Text style={Typography.header2}>Private Data</Text>
        <TextButton
          title="Delete account"
          onPress={handleClearData}
          danger
        />
      </View>
      { version && (
        <View>
          <Text style={Typography.header2}>Misc</Text>
          <Text>Version: {version}</Text>
        </View>
      )}
    </View>
  );
}
