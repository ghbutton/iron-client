import utility from "./utility.js"
import config from "./config.js"

let basePath = config.basePath();

let storage = (function() {
  return {
    loadMessages: async function(deviceId) {
    },
    loadLastRead: async function(deviceId) {
    },
    saveLastRead: async function(deviceId, lastRead) {
    },
    init: async function() {
    },
    saveMessages: async function(deviceId, messages) {
    },
    loadCurrentSession: async function() {
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
