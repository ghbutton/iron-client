import DeviceInfo from "react-native-device-info";
import pkg from "../package.json";

const deviceOS = (function() {
  return {
    deviceName: async function() {
      return DeviceInfo.getDeviceName();
    },
    osName: async function() {
      return DeviceInfo.getSystemName();
    },
    getClientVersion: function() {
      //      return `${DeviceInfo.getVersion()}-${DeviceInfo.getBuildNumber()}`;
      return pkg.version
    },
  };
})();

export default deviceOS;
