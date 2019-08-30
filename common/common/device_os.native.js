import DeviceInfo from 'react-native-device-info';

let deviceOS = (function() {
  return {
    deviceName: async function() {
      return DeviceInfo.getDeviceName();
    },
    osName: async function() {
      return DeviceInfo.getSystemName();
    }
  }
})()

export default deviceOS;
