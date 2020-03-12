import {NativeModules} from "react-native";
import storage from "./storage.js";
import logger from "./logger.js";
import {Base64} from "js-base64";

export default (function() {
  async function _saveState(deviceId) {
    const state = await NativeModules.Bridge.getState();
    console.log(state);
    await storage.saveSignalInfo(deviceId, state);
  }

  async function _messagePayload(messageString) {
    return JSON.stringify({"type": "m", "version": "1", "data": messageString});
  }

  async function _addressString(deviceId) {
    return `${deviceId}`;
  }

  async function _atob(value) {
    if (typeof value !== "string") {
      throw new Error("Can only decode string to base64");
    } else {
      return Base64.atob(value);
    }
  }

  async function _btoa(value) {
    if (typeof value !== "string") {
      throw new Error("Can only encode string to base 64");
    } else {
      return Base64.btoa(value);
    }
  }

  async function _sendPayload(preKeyBundles, payload, deviceId) {
    const encryptedMessages = [];
    const preKeyBundleStructs = [];


    for (let i = 0; i < preKeyBundles.length; i++) {
      preKeyBundleStructs.push({
        "version": 1,
        "identityKey": await _btoa(preKeyBundles[i].attributes.identity_key),
        "preKeyPublicKey": await _btoa(preKeyBundles[i].attributes.pre_key_public_key),
        "preKeyId": preKeyBundles[i].attributes.pre_key_id,
        "signedPreKeyPublicKey": await _btoa(preKeyBundles[i].attributes.signed_pre_key_public_key),
        "signedPreKeyId": preKeyBundles[i].attributes.signed_pre_key_id,
        "signature": await _btoa(preKeyBundles[i].attributes.signed_pre_key_signature),
        "registrationId": preKeyBundles[i].attributes.registration_id,
        "deviceId": preKeyBundles[i].relationships.device.data.id,
      });
    }

    const encryptPayload = {
      "payload": payload,
      "preKeyBundles": preKeyBundleStructs,
    };

    const {messages} = JSON.parse(await NativeModules.Bridge.encryptPayload(JSON.stringify(encryptPayload)));
    if (messages.length != preKeyBundles.length) {
      throw new Error("Tried to encode wrong number of messages");
    }

    for (let i = 0; i < messages.length; i++) {
      messages[i].body = await _atob(messages[i].body);
    }

    for (let i = 0; i < messages.length; i++) {
      const encryptedPayload = {message: messages[i], deviceId: preKeyBundles[i].relationships.device.data.id};
      encryptedMessages.push(encryptedPayload);
    }

    await _saveState(deviceId);
    return encryptedMessages;
  }

  // Also used as the idempotency key
  async function _localMessageId(deviceId) {
    const randomPiece = Math.random().toString(36).substr(2).substring(0, 4);
    return `${deviceId}_${randomPiece}_${Math.floor(Date.now() / 1000)}`;
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
      console.log(deviceInfo);
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
    decryptMessage: async function(deviceId, senderDeviceId, encryptedMessage) {
      if (deviceId === senderDeviceId) {
        throw new Error("We should never send a message the same device");
      }

      payload = {deviceId: parseInt(senderDeviceId, 10), encryptedMessage: {body: await _btoa(encryptedMessage.attributes.body), type: encryptedMessage.attributes.type}};

      const decrypted = await NativeModules.Bridge.decryptPayload(JSON.stringify(payload));
      const decoded = JSON.parse(await _atob(decrypted));

      delete encryptedMessage.attributes.body;
      encryptedMessage.attributes.decryptedBody = decoded;

      logger.info("Decrypted message");
      logger.info(encryptedMessage);
      encryptedMessage.meta = {};

      await _saveState(deviceId);
      return encryptedMessage;
    },
    generateDeviceInfo: async function(deviceId) {
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
                  "identity_key": await _atob(bundle.identityKey),
                  "registration_id": bundle.registrationId,
                  "pre_key_id": bundle.preKeyId,
                  "pre_key_public_key": await _atob(bundle.preKeyPublicKey),
                  "signed_pre_key_id": bundle.signedPreKeyId,
                  "signed_pre_key_public_key": await _atob(bundle.signedPreKeyPublicKey),
                  "signed_pre_key_signature": await _atob(bundle.signature),
                },
              },
            },
          };
          break;
        default:
          throw new Error(`Could not interpret bundle version ${bundle.version}`);
      }
    },
    syncLocalMessageType: function() {
      return "local_message_v1";
    },
    syncLocalFileMessageType: function() {
      return "local_file_message_v1";
    },
    localFileMessage: async function({basename, filename}, userId, recipientUserId, deviceId) {
    },
    localMessage: async function(messageString, userId, recipientUserId, deviceId) {
      // TODO merge with signal.electron.js
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
    encryptFileMessages: async function(preKeyBundles, params, deviceId) {
    },
    encryptMessages: async function(preKeyBundles, messageString, deviceId) {
      const messagePayload = await _messagePayload(messageString);
      return _sendPayload(preKeyBundles, messagePayload, deviceId);
    },
  };
})();
