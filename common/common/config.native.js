const isDev = __DEV__;
const API_VERSION = 5;
const IOS = "ios";
const RNFS = require("react-native-fs");

import {NativeModules} from "react-native";
import DeviceInfo from "react-native-device-info";


const config = (function() {
  return {
    isDev: function() {
      return isDev;
    },
    isElectron: function() {
      return false
    },
    isReactNative: function() {
      return true
    },
    isIOS: function() {
      return Platform.OS === IOS
    },
    wsProtocol: function() {
      if (isDev) {
        return "ws";
      } else {
        return "wss";
      }
    },
    wsUrl: function() {
      if (isDev) {
        return "localhost";
//        return "192.168.5.16";
      } else {
        return "www.ironnotice.com";
      }
    },
    wsPort: function() {
      if (isDev) {
        return 4000;
      } else {
        return null;
      }
    },
    privateDataPath: function() {
      if (Platform.OS === IOS) {
        return `${RNFS.LibraryDirectoryPath}/Application Support/storage`;
      } else {
        throw "iOS only for now";
      }
    },
    defaultDownloadDirectory: function() {
      return `${RNFS.DocumentDirectoryPath}`;
    },
    apiVersion: function() {
      return API_VERSION;
    },
    isSimulator: async function(){
      return await NativeModules.BridgeUtils.isSimulator();
    }
  };
})();

export default config;
