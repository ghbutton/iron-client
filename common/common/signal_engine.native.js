import {NativeModules} from "react-native";
import utility from "./utility.js";
import logger from "./logger.js";

const Buffer = require("buffer").Buffer;

const engine = (function() {
  const [store] = [null];

  async function _bToS(binary) {
    return window.util.toString(binary);
  }

  async function _sToB(string) {
    return window.util.toArrayBuffer(string);
  }

  async function _sToUtf8(string) {
    return new TextEncoder("utf-8").encode(string);
  }

  async function _64ToS(base64) {
    const buff = new Buffer(base64, "base64");
    const string = buff.toString();
    return string;
  }

  // TODO remove if unused
  async function _64ToB(string) {
    const buff = new Buffer(string, "base64");
    const ascii = buff.toString();
    return window.util.toArrayBuffer(ascii);
  }

  async function _utf8ToS(buffer) {
    return new TextDecoder().decode(buffer);
  }

  async function _keyTo64(key) {
    return {pubKey: await _bTo64(key.pubKey), privKey: (await _bTo64(key.privKey))};
  }

  async function _bTo64(binary) {
    const string = window.util.toString(binary);
    const buff = new Buffer(string, "binary");
    const base64data = buff.toString("base64");
    return base64data;
  }


  async function _sTo64(string) {
    const buff = new Buffer(string, "binary");
    const base64data = buff.toString("base64");
    return base64data;
  }

  return {
    encryptMessage: async function(toDeviceId, messagePayload) {
      const response = JSON.parse(await NativeModules.Bridge.encryptPayload(messagePayload, Number(toDeviceId)));
      return response;
    },
    getState: async function(deviceId) {
      const state = await NativeModules.Bridge.getState();
      return state;
    },

    decryptMessage: async function(senderDeviceId, encryptedMessage) {
      const message = await NativeModules.Bridge.decryptMessage(Number(senderDeviceId), encryptedMessage.attributes.body, encryptedMessage.attributes.type);
      const decrypted = JSON.parse(await _64ToS(message));
      return decrypted;
    },
    store: async function() {
      const state = await NativeModules.Bridge.getState();
      return JSON.parse(state);
    },
    loaded: async function() {
      return store !== null;
    },
    buildSession: async function(deviceId, identityKey, signedPreKey, preKey) {
      const attributes = {
        registrationId: identityKey.attributes.registration_id,
        identityKey: {
          publicKey: identityKey.attributes.public_key,
        },
        signedPreKey: {
          keyId: signedPreKey.attributes.key_id,
          publicKey: signedPreKey.attributes.public_key,
          signature: signedPreKey.attributes.signature,
        },
      };

      if (preKey) {
        attributes.preKey = {
          keyId: preKey.attributes.key_id,
          publicKey: preKey.attributes.public_key,
        };
      }

      const result = await NativeModules.Bridge.processPreKeyBundle(Number(deviceId), JSON.stringify(attributes));

      if (result === true) {
        return {status: "ok"};
      } else {
        return {status: "error"};
      }
    },
    generateDeviceInfo: async function() {
      // identity key and registration id
      await NativeModules.Bridge.initialize();
    },
    getIdentityPublicKey: async function() {
      const publicKey = await NativeModules.Bridge.getIdentityPublicKey();
      return publicKey;
    },
    generateSignedPreKey: async function(deviceId) {
      const timestamp = Date.now();
      const {signature, keyId, publicKey} = JSON.parse(await NativeModules.Bridge.generateSignedPreKey(timestamp));
      return {signature, keyId, publicKey};
    },
    generatePreKeys: async function(deviceId, number) {
      const keys = JSON.parse(await NativeModules.Bridge.generatePreKeys(number));

      return keys;
    },
    getRegistrationId: async function() {
      const id = await NativeModules.Bridge.getRegistrationId();
      return id;
    },
    hasSession: async function(deviceId) {
      return NativeModules.Bridge.hasSession(Number(deviceId));
    },
    aesEncrypt: async function(data) {
      const aesKey = await window.crypto.subtle.generateKey(
          {
            name: "AES-CBC",
            length: 256, // can be  128, 192, or 256
          },
          true, // whether the key is extractable (i.e. can be used in exportKey)
          ["encrypt", "decrypt"] // can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
      );
      const aesExported = await _bTo64(await window.crypto.subtle.exportKey("raw", aesKey));
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      const sIv = await _bTo64(iv);
      const bEncrypted = await window.crypto.subtle.encrypt( {name: "AES-CBC", iv: iv}, aesKey, await _sToB(data));
      const encrypted = await _bTo64(bEncrypted);

      const hmacKey = await window.crypto.subtle.generateKey({name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      const hmacExported = await _bTo64(await window.crypto.subtle.exportKey("raw", hmacKey));
      const signature = await _bTo64(await window.crypto.subtle.sign({name: "HMAC"}, hmacKey, bEncrypted));

      return {encrypted, hmacExported, sIv, signature, aesExported};
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}) {
      // Return string values
      const hmacKey = await window.crypto.subtle.importKey("raw", await _64ToB(hmacExported), {name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      const verified = await window.crypto.subtle.verify({name: "HMAC"}, hmacKey, await _64ToB(signature), await _64ToB(encrypted));

      if (!verified) {
        throw new Error("Error, file not verified.");
      }

      const aesKey = await window.crypto.subtle.importKey("raw", await _64ToB(aesExported), {name: "AES-CBC"}, true, ["encrypt", "decrypt"]);
      const decrypted = await window.crypto.subtle.decrypt({name: "AES-CBC", iv: await _64ToB(sIv)}, aesKey, await _64ToB(encrypted));
      const sDecrypted = await _bToS(decrypted);
      return sDecrypted;
    },
    loadFromDisk: async function(payload) {
      const success = await NativeModules.Bridge.loadFromDisk(payload);
      if (success) {
        return true;
      } else {
        throw new Error("Could not load react native data");
      }
    },
  };
})();

export default engine;
