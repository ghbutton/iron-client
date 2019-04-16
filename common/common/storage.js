import utility from "./utility.js"
import config from "./config.js"
// const app = window.app;
const fs = window.fs;

let basePath = config.basePath();

let storage = (function() {
  async function setItem(key, value) {
    return fs.writeFileSync(`${basePath}/${key}`, value);
  }
  async function getItem(key) {
    return new Promise(function(resolve, reject) {
      fs.readFile(`${basePath}/${key}`, (err, data) => {
        if (err) {
          if (err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
            resolve(null);
          } else {
            throw(err);
          }
        } else {
          resolve(data);
        }
      });
    });
  }
  async function userSessionKey() {
    return `ironUserSession`;
  }

  async function lastReadKey() {
    return `ironLastRead`;
  }

  async function messagesKey(deviceId) {
    return `ironMessages_${deviceId}`;
  }

  async function signalInfoKey(deviceId) {
    return `ironSignalInfo_${deviceId}`;
  }

  async function deviceKey(userId) {
    return `ironDeviceId_${userId}`;
  }

  return {
    loadMessages: async function(deviceId) {
      const key = await messagesKey(deviceId);
      const messagesPayload = await getItem(key);
      if (await utility.nullOrUndefined(messagesPayload)) {
        return [];
      } else {
        return JSON.parse(messagesPayload);
      }
    },
    loadLastRead: async function(deviceId) {
      const key = await lastReadKey(deviceId);
      const messagesPayload = await getItem(key);

      if (await utility.nullOrUndefined(messagesPayload)) {
        return {};
      } else {
        return JSON.parse(messagesPayload);
      }
    },
    saveLastRead: async function(deviceId, lastRead) {
      const key = await lastReadKey(deviceId);
      return setItem(key, JSON.stringify(lastRead));
    },
    init: async function() {
      let folders = basePath.split("/");
      let currentPath = "";
      if (folders[0] === "") {
        // Remove the leading slash
        folders.shift();

        let first = folders.shift();
        currentPath= `/${first}`
      } else {
        currentPath = `${folders.shift()}`
      }

      while(folders.length > 0) {
        let current = folders.shift();
        currentPath = `${currentPath}/${current}`;
        if (!fs.existsSync(currentPath)) {
          fs.mkdirSync(currentPath);
        }
      }
    },
    saveMessages: async function(deviceId, messages) {
      const key = await messagesKey(deviceId);
      return setItem(key, JSON.stringify(messages));
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
      return setItem(key, JSON.stringify(session));
    },
    loadSignalInfo: async function(deviceId) {
      const key = await signalInfoKey(deviceId);
      const deviceInfoPayload = await getItem(key);
      if (await utility.nullOrUndefined(deviceInfoPayload)) {
        return null;
      } else {
        const deviceInfo = JSON.parse(deviceInfoPayload);
        return deviceInfo;
      }
    },
    saveSignalInfo: async function(deviceId, payload) {
      const key = await signalInfoKey(deviceId);
      return setItem(key, payload);
    },
    getDevice: async function(userId) {
      const key = await deviceKey(userId);
      const devicePayload = await getItem(key);
      const device = JSON.parse(devicePayload);
      return (device) || null;
    },
    saveDevice: async function(userId, device) {
      const key = await deviceKey(userId);
      return setItem(key, JSON.stringify(device));
    }
  }
})()

export default storage;
