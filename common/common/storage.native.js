import utility from "./utility.js"
import config from "./config.js"
const RNFS = require('react-native-fs');

let basePath = config.basePath();

const UTF8 = "utf8";

let storage = (function() {
  async function _getItem(key) {
    try {
      return await RNFS.readFile(RNFS.DocumentDirectoryPath + `/${key}`, UTF8);
    } catch (err) {
      if (err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
        return null
      } else {
        throw(err);
      }
    }
  }

  async function _userSessionKey() {
    return "ironUserSession";
  }

  return {
    loadMessages: async function(deviceId) {
    },
    loadLastRead: async function(deviceId) {
    },
    saveLastRead: async function(deviceId, lastRead) {
    },
    init: async function() {
      // Do nothing
    },
    saveMessages: async function(deviceId, messages) {
    },
    loadCurrentSession: async function() {
      const key = await _userSessionKey();
      const sessionPayload = await _getItem(key);

      if (sessionPayload) {
        // TODO fix
        return [null, null];
      } else {
        return [null, null];
      }
    },
    saveSession: async function(session) {
    },
    loadSignalInfo: async function(deviceId) {
      return null;
    },
    saveSignalInfo: async function(deviceId, payload) {
    },
    loadDevice: async function(userId) {
      return null;
    },
    saveDevice: async function(userId, device) {
    },
    clearData: async function() {
    },
    saveDownloadDirectory: async function(directory){
    },
    deleteDownloadDirectory: async function() {
    },
    loadDownloadDirectory: async function() {
    }
  }
})()

export default storage;
