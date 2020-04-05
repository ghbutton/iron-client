import {NativeModules} from "react-native";
import utility from "./utility.js";
import logger from "./logger.js";
import RNSimpleCrypto from "react-native-simple-crypto";

const Buffer = require("buffer").Buffer;

const engine = (function() {
  const [store] = [null];

  async function _hTo64(hexString) {
    return Buffer.from(hexString, 'hex').toString('base64')
  }

  async function _64ToS(base64) {
    const buff = new Buffer(base64, "base64");
    const string = buff.toString();
    return string;
  }

  // TODO remove if unused
  async function _64ToUtf8(string) {
    var buff = Buffer.from(string, 'base64');
    return buff.toString("utf8");
  }

  // TODO remove if unused
  async function _64ToB(string) {
    var buff = Buffer.from(string, 'base64');
    return buff.buffer;
  }

  async function _utf8ToS(buffer) {
    return new TextDecoder().decode(buffer);
  }

  async function _keyTo64(key) {
    return {pubKey: await _bTo64(key.pubKey), privKey: (await _bTo64(key.privKey))};
  }

  async function _bTo64(binary) {
    const buffer = Buffer.from(binary);
    return buffer.toString('base64');
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
      // 32 bytes is 256 bits
      const key = await RNSimpleCrypto.utils.randomBytes(32);

      const iv = await RNSimpleCrypto.utils.randomBytes(16);
      const cipher = await RNSimpleCrypto.AES.encrypt(await _64ToB(data), key, iv);

      // 64 bytes is 512 bits
      const hmacKey = await RNSimpleCrypto.utils.randomBytes(64);

      // HMAC here takes a UTF8 string
      const signature = await RNSimpleCrypto.HMAC.hmac256(cipher, hmacKey);

      return {encrypted: await _bTo64(cipher), hmacExported: await _bTo64(hmacKey), sIv: await _bTo64(iv), signature: await _bTo64(signature), aesExported: await _bTo64(key)};
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}) {
      // Return string values
      const hmacKey = await _64ToB(hmacExported);
      const cipher = await _64ToB(encrypted);

      // HMAC here takes a UTF8 string
      const calculatedSignature = await RNSimpleCrypto.HMAC.hmac256(cipher, hmacKey);

      if (await _bTo64(calculatedSignature) !== signature) {
        throw new Error("Error, file not verified.");
      }

      const aesKey = await _64ToB(aesExported);
      const iv = await _64ToB(sIv);

      const decrypted = await RNSimpleCrypto.AES.decrypt(cipher, aesKey, iv);

      return await _bTo64(decrypted);
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
