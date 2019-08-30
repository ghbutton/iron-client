import utility from "./utility.js"
import engine from "./storage_engine.js"

let storage = (function() {
  async function _userSessionKey() {
    return "ironUserSession";
  }

  async function downloadDirectoryKey() {
    return "ironDownloadDirectory";
  }

  async function lastReadKey(deviceId) {
    return `ironLastRead_${deviceId}`;
  }

  async function messagesKey(deviceId) {
    return `ironMessages_${deviceId}`;
  }

  async function signalInfoKey(deviceId) {
    return `ironSignalInfo_${deviceId}`;
  }

  async function _deviceKey(userId) {
    return `ironDeviceId_${userId}`;
  }

  return {
    loadMessages: async function(deviceId) {
      const key = await messagesKey(deviceId);
      const messagesPayload = await engine.getItem(key);
      if (await utility.nullOrUndefined(messagesPayload)) {
        return [];
      } else {
        return JSON.parse(messagesPayload);
      }
    },
    loadLastRead: async function(deviceId) {
      const key = await lastReadKey(deviceId);
      const messagesPayload = await engine.getItem(key);

      if (await utility.nullOrUndefined(messagesPayload)) {
        return {};
      } else {
        return JSON.parse(messagesPayload);
      }
    },
    saveLastRead: async function(deviceId, lastRead) {
      const key = await lastReadKey(deviceId);
      return engine.setItem(key, JSON.stringify(lastRead));
    },
    init: async function() {
      return engine.init();
    },
    saveMessages: async function(deviceId, messages) {
      const key = await messagesKey(deviceId);
      return engine.setItem(key, JSON.stringify(messages));
    },
    loadCurrentSession: async function() {
      const key = await _userSessionKey();
      const sessionPayload = await engine.getItem(key);

      if (sessionPayload) {
        const session = JSON.parse(sessionPayload);
        return [session.relationships.user.data.id, session.attributes.token];
      } else {
        return [null, null];
      }
    },
    saveSession: async function(session) {
      const key = await _userSessionKey();
      return engine.setItem(key, JSON.stringify(session));
    },
    loadSignalInfo: async function(deviceId) {
      const key = await signalInfoKey(deviceId);
      const deviceInfoPayload = await engine.getItem(key);
      if (await utility.nullOrUndefined(deviceInfoPayload)) {
        return null;
      } else {
        const deviceInfo = JSON.parse(deviceInfoPayload);
        return deviceInfo;
      }
    },
    saveSignalInfo: async function(deviceId, payload) {
      const key = await signalInfoKey(deviceId);
      return engine.setItem(key, payload);
    },
    loadDevice: async function(userId) {
      const key = await _deviceKey(userId);
      const devicePayload = await engine.getItem(key);
      const device = JSON.parse(devicePayload);
      return (device) || null;
    },
    saveDevice: async function(userId, device) {
      const key = await _deviceKey(userId);
      return engine.setItem(key, JSON.stringify(device));
    },
    clearData: async function() {
      return engine.clearAllData();
    },
    saveDownloadDirectory: async function(directory){
      const key = await downloadDirectoryKey();
      return engine.setItem(key, JSON.stringify(directory));
    },
    deleteDownloadDirectory: async function() {
      const key = await downloadDirectoryKey();
      return engine.deleteItem(key);
    },
    loadDownloadDirectory: async function() {
      const key = await downloadDirectoryKey();
      const directoryPayload = await engine.getItem(key);
      const downloadDirectory = JSON.parse(directoryPayload);
      return (downloadDirectory) || null;
    }
  }
})()

export default storage;
