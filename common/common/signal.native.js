import { NativeModules } from 'react-native'

export default (function() {
  return {
    aesEncrypt: async function(data) {
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}) {
    },
    inspectStore: async function() {
    },
    infoLoaded: async function() {
    },
    loadDeviceInfoFromDisk: async function(deviceId) {
    },
    decryptMessage: async function(deviceId, senderDeviceId, encryptedMessage){
    },
    generateDeviceInfo: async function(deviceId){
      console.log("Generate DeviceInfo");
      const signal = await NativeModules.Bridge.initialize();
      console.log(signal);
    },
    getPreKeyBundle: async function() {
    },
    syncLocalMessageType: function() {
    },
    syncLocalFileMessageType: function() {
    },
    localFileMessage: async function({basename, filename}, userId, recipientUserId, deviceId) {
    },
    localMessage: async function(messageString, userId, recipientUserId, deviceId) {
    },
    encryptFileMessages: async function(preKeyBundles, params, deviceId) {
    },
    encryptMessages: async function(preKeyBundles, messageString, deviceId) {
    }
  }
})()
