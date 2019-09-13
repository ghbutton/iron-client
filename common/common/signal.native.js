import { NativeModules } from 'react-native'
import storage from "./storage.js"
import logger from "./logger.js"
import { Base64 } from 'js-base64';

export default (function() {
  async function _saveState(deviceId) {
    const state = await NativeModules.Bridge.getState();
    await storage.saveSignalInfo(deviceId, state);
  }

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
      logger.info("Loading signal device info from disk");
      const deviceInfo = await storage.loadSignalInfo(deviceId);
      if (deviceInfo === null) {
        return false;
      } else {
        const success = await NativeModules.Bridge.loadFromDisk(deviceInfo);
        if (success) {
          return true;
        } else {
          throw new Error("Could not load react native data");
        }
      }
    },
    decryptMessage: async function(deviceId, senderDeviceId, encryptedMessage){
    },
    generateDeviceInfo: async function(deviceId){
      await NativeModules.Bridge.initialize();
      await _saveState(deviceId);
    },
    getPreKeyBundle: async function() {
      const bundle = JSON.parse(await NativeModules.Bridge.getPreKeyBundle());
      switch (bundle.version) {
        case 1:
          return {
            "payload": {
              "data": {
                "type": "pre_key_bundle",
                "attributes": {
                  "identity_key": Base64.atob(bundle.identityKey),
                  "registration_id": bundle.registrationId,
                  "pre_key_id": bundle.preKeyId,
                  "pre_key_public_key": Base64.atob(bundle.preKeyPublicKey),
                  "signed_pre_key_id": bundle.signedPreKeyId,
                  "signed_pre_key_public_key": Base64.atob(bundle.signedPreKeyPublicKey),
                  "signed_pre_key_signature": Base64.atob(bundle.signature)
                }
              }
            }
          }
          break;
        default:
          throw new Error(`Could not interpret bundle version ${bundle.version}`);
      }
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
