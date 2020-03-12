import logger from "./logger.js";
import storage from "./storage.js";
import engine from "./signal_engine.js";

// Rename to Crypto
export default (function() {
  async function _messagePayload(messageString) {
    return JSON.stringify({"type": "m", "version": "1", "data": messageString});
  }

  async function _fileMessagePayload({hmacExported, sIv, signature, aesExported, fileUploadId, basename}) {
    return JSON.stringify({"type": "fm", "version": "1", "data": {hmacExported, sIv, signature, aesExported, fileUploadId, basename}});
  }

  async function _sendPayload(toDeviceId, payload, myDeviceId) {
    const message = await engine.encryptMessage(toDeviceId, payload);
    const encryptedPayload = {message: message, deviceId: toDeviceId};
    await _saveState(myDeviceId);
    return encryptedPayload;
  }

  // TODO, move this non signal stuff out of this module
  // Also used as the idempotency key
  async function _localMessageId(deviceId) {
    const randomPiece = Math.random().toString(36).substr(2).substring(0, 4);
    return `${deviceId}_${randomPiece}_${Math.floor(Date.now() / 1000)}`;
  }

  async function _saveState(deviceId) {
    const storagePayload = await engine.getState(deviceId);
    const ironStorage = {
      version: 1,
      payload: storagePayload,
    };

    await storage.saveSignalInfo(deviceId, ironStorage);
  }

  return {
    aesEncrypt: async function(data64) {
      const {encrypted, hmacExported, sIv, signature, aesExported} = await engine.aesEncrypt(data64);
      return {encrypted, hmacExported, sIv, signature, aesExported};
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}) {
      return engine.aesDecrypt({encrypted, hmacExported, sIv, signature, aesExported});
    },
    inspectStore: async function() {
      return engine.store();
    },
    infoLoaded: async function() {
      return engine.loaded();
    },
    loadDeviceInfoFromDisk: async function(deviceId) {
      logger.info("Loading signal device info from disk");
      const deviceInfo = await storage.loadSignalInfo(deviceId);
      logger.debug("Device Info", deviceInfo);
      if (deviceInfo === null) {
        return false;
      } else {
        switch (deviceInfo.version) {
          case 1:
            await engine.loadFromDisk(deviceInfo.payload);

            return true;
          default:
            throw new Error("Do not recognize the device info version");
        }
      }
    },
    decryptMessage: async function(deviceId, senderDeviceId, encryptedMessage) {
      if (deviceId === senderDeviceId) {
        throw new Error("We should never send a message the same device");
      }
      const message = await engine.decryptMessage(senderDeviceId, encryptedMessage);
      delete encryptedMessage.attributes.body;

      encryptedMessage.attributes.decryptedBody = message;
      logger.info("Decrypted message");
      logger.debug(encryptedMessage);
      encryptedMessage.meta = {};
      await _saveState(deviceId);
      return encryptedMessage;
    },
    generateDeviceInfo: async function(deviceId) {
      await engine.generateDeviceInfo();
      await _saveState(deviceId);
      return true;
    },
    getIdentityPublicKey: async function() {
      return engine.getIdentityPublicKey();
    },
    generateSignedPreKey: async function(deviceId) {
      const {signature, keyId, publicKey} = await engine.generateSignedPreKey(deviceId);
      await _saveState(deviceId);
      return {keyId, signature, publicKey};
    },
    generatePreKeys: async function(deviceId, number) {
      const keys = await engine.generatePreKeys(deviceId, number);
      await _saveState(deviceId);

      return keys;
    },
    getRegistrationId: async function() {
      return engine.getRegistrationId();
    },
    syncLocalMessageType: function() {
      return "local_message_v1";
    },
    syncLocalFileMessageType: function() {
      return "local_file_message_v1";
    },
    localFileMessage: async function({basename, filename}, userId, recipientUserId, deviceId) {
      const object = {"type": "local_file_message_v1", "data": {filename, basename}};

      return {
        id: await _localMessageId(deviceId),
        attributes: {
          decryptedBody: object,
        },
        meta: {
          sent_at: null,
          delivered_at: null,
          errored_at: null,
          sending_at: Date.now(),
        },
        relationships: {
          sender: {
            data: {
              type: "user",
              id: userId,
            },
          },
          receiver: {
            data: {
              type: "user",
              id: recipientUserId,
            },
          },
        },
      };
    },
    localMessage: async function(messageString, userId, recipientUserId, deviceId) {
      const object = {"type": "local_message_v1", "data": messageString};

      return {
        id: await _localMessageId(deviceId),
        attributes: {
          decryptedBody: object,
        },
        meta: {
          sent_at: null,
          delivered_at: null,
          errored_at: null,
          sending_at: Date.now(),
        },
        relationships: {
          sender: {
            data: {
              type: "user",
              id: userId,
            },
          },
          receiver: {
            data: {
              type: "user",
              id: recipientUserId,
            },
          },
        },
      };
    },
    encryptFileMessage: async function(toDeviceId, params, myDeviceId) {
      const fileMessagePayload = await _fileMessagePayload(params);
      return _sendPayload(toDeviceId, fileMessagePayload, myDeviceId);
    },
    encryptMessage: async function(toDeviceId, messageString, myDeviceId) {
      const messagePayload = await _messagePayload(messageString);
      return _sendPayload(toDeviceId, messagePayload, myDeviceId);
    },
    hasSession: async function(deviceId) {
      return engine.hasSession(deviceId);
    },
    buildSession: async function(deviceId, identityKey, signedPreKey, preKey, myDeviceId) {
      logger.info("Building new session");
      await engine.buildSession(deviceId, identityKey, signedPreKey, preKey);
      await _saveState(myDeviceId);
    },
  };
})();
