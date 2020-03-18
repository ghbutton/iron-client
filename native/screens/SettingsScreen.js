import React, {useEffect, useState} from "react";
import {Alert, Button, FlatList, Image, StyleSheet, Text, View} from "react-native";
import {Typography} from "../styles";

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [version, setVersion] = useState(null);

  const clearData = async () => {
    Alert.alert(
      "Clear data",
      "Clearing this device of all data?",
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            await window.controller.clearData()
          },
          style: 'destructive',
        },
      ]
    )
  }

  useEffect(() => {
    async function loadData() {
      setUser(await window.controller.currentUser());
      setDevices(await window.controller.getDevices());
      setDeviceId(await window.controller.getDeviceId());
      setVersion(await window.controller.getVersion());
    }

    loadData();
  }, []);

  return (
    <View>
      {user && (
        <View>
          <Text style={Typography.header2}>Personal</Text>
          <Text>Name: {user.attributes.name}</Text>
          <Text>Email: {user.attributes.email}</Text>
          <Text>TODO edit user</Text>
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
        <Button
          title="Clear data"
          color="#e50000"
          onPress={clearData}
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
