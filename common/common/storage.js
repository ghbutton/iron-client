import utility from "./utility.js"

let storage = (function() {
  async function setItem(key, value) {
    return window.localStorage.setItem(key, value);
  }
  async function getItem(key) {
    return window.localStorage.getItem(key);
  }
  async function userSessionKey() {
    return `ironUserSession`;
  }
  return {
    loadMessages: async function(deviceId) {
      const key = `ironMessages_${deviceId}`;
      const messagesPayload = await getItem(key);
      if (await utility.nullOrUndefined(messagesPayload)) {
        return [];
      } else {
        return JSON.parse(messagesPayload);
      }
    },
    saveMessages: async function(deviceId, messages) {
      const key = `ironMessages_${deviceId}`;
      setItem(key, JSON.stringify(messages));
    },
    loadCurrentSession: async function() {
      const key = await userSessionKey();
      const sessionPayload = await getItem(key);

      if (sessionPayload) {
        let session = JSON.parse(sessionPayload);
        return [session.relationships.user.data.id, session.attributes.token];
      } else {
        return [null, null];
      }
    },
    saveSession: async function(session) {
      const key = await userSessionKey();
      setItem(key, JSON.stringify(session));
    },
    loadSignalInfo: async function(deviceId) {
      const key = `ironSignalInfo_${deviceId}`;
      const deviceInfoPayload = await getItem(key);
      if (await utility.nullOrUndefined(deviceInfoPayload)) {
        return null;
      } else {
        const deviceInfo = JSON.parse(deviceInfoPayload);
        return deviceInfo;
      }
    },
    saveSignalInfo: async function(deviceId, payload) {
      const key = `ironSignalInfo_${deviceId}`;
      await setItem(key, payload);
    },
    getDevice: async function(userId) {
      const key = `ironDeviceId_${userId}`;
      const devicePayload = await getItem(key);
      const device = JSON.parse(devicePayload);
      return (device) || null;
    },
    saveDevice: async function(userId, device) {
      const key = `ironDeviceId_${userId}`;
      return setItem(key, JSON.stringify(device));
    }
  }
})()

export default storage;
