import utility from "./utility.js"
import config from "./config.js"

let basePath = config.basePath();

let storage = (function() {
  async function _getItem(key) {
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
      const key = await userSessionKey();
      const sessionPayload = await getItem(key);

      return [null, null];
    },
    saveSession: async function(session) {
    },
    loadSignalInfo: async function(deviceId) {
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
