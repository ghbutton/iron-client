import utility from "./utility.js";
import logger from "./logger.js";

const libsignal = window.libsignal;
window.buffer = Buffer;

const engine = (function() {
  let [store] = [null];

  async function _bToUtf8(buffer) {
    return new TextDecoder().decode(buffer);
  }

  async function _addressToSessionKey(addressString, deviceId) {
    // Function of the store library
    return `session${addressString}.${deviceId}`;
  }


  async function _addressString(deviceId) {
    return `${deviceId}`;
  }

  async function _64ToB(string) {
    const buff = new Buffer(string, "base64");
    return buff.buffer;
  }

  async function _bTo64(binary) {
    const buff = new Buffer(binary);
    const base64data = buff.toString("base64");
    return base64data;
  }

  async function _sTo64(string) {
    const buff = new Buffer(string, "binary");
    const base64data = buff.toString("base64");
    return base64data;
  }

  async function _deprecated64ToB(string) {
    const buff = new Buffer(string, "base64");
    const ascii = buff.toString();
    return window.util.toArrayBuffer(ascii);
  }


  return {
    encryptMessage: async function(toDeviceId, messagePayload) {
      const addressString = await _addressString(toDeviceId);
      const address = new libsignal.SignalProtocolAddress(addressString, toDeviceId);
      const sessionCipher = new libsignal.SessionCipher(store, address);
      const message = await sessionCipher.encrypt(messagePayload, "utf8");

      // Change body to base64
      message.body = await _sTo64(message.body);

      return message;
    },
    getState: async function(deviceId) {
      const idKeyPair = await store.getIdentityKeyPair();
      const registrationId = await store.getLocalRegistrationId();
      const currentSignedKeyId = await store.get("currentSignedKeyId");
      const currentPreKeyId = await store.get("currentPreKeyId");
      const sessions = {};
      const identityKeys = {};
      const signedKeys = {};
      const preKeys = {};

      for (const key of Object.keys(store.store)) {
        // save the current sessions
        if (key.startsWith("session")) {
          sessions[key] = store.store[key];
        }
        // save the current identity keys
        if (key.startsWith("identityKey") && key !== "identityKey") {
          identityKeys[key] = await _bTo64(store.store[key]);
        }

        // save the current identity keys
        if (key.startsWith("25519KeysignedKey")) {
          const value = store.store[key];
          signedKeys[key] = {pubKey: await _bTo64(value.pubKey), privKey: (await _bTo64(value.privKey))};
        }

        if (key.startsWith("25519KeypreKey")) {
          const value = store.store[key];
          preKeys[key] = {pubKey: await _bTo64(value.pubKey), privKey: (await _bTo64(value.privKey))};
        }
      }

      const storagePayload = {
        currentSignedKeyId,
        currentPreKeyId,
        registrationId,
        signedKeys,
        preKeys,
        idPubKey: await _bTo64(idKeyPair.pubKey),
        idPrivKey: await _bTo64(idKeyPair.privKey),
        deviceId: deviceId,
        addressString: await utility.addressString(deviceId),
        sessions: sessions,
        identityKeys: identityKeys,
      };

      return storagePayload;
    },

    generatePreKeys: async function(deviceId, number) {
      const currentPreKeyId = store.get("currentPreKeyId");
      const keys = [];

      for (let i = 0; i < number; i++) {
        const key = await libsignal.KeyHelper.generatePreKey(currentPreKeyId + i);
        keys.push({keyId: key.keyId, publicKey: await _bTo64(key.keyPair.pubKey)});
        store.storePreKey(currentPreKeyId + i, key.keyPair);
      }
      store.put("currentPreKeyId", currentPreKeyId + number);

      return keys;
    },

    decryptMessage: async function(senderDeviceId, encryptedMessage) {
      const addressString = await utility.addressString(senderDeviceId);
      const address = new libsignal.SignalProtocolAddress(addressString, senderDeviceId);
      const sessionCipher = new libsignal.SessionCipher(store, address);

      let message = null;

      logger.debug(`Encrypted message body ${encryptedMessage.attributes.body}`);

      if (encryptedMessage.attributes.type === 3) {
        message = await sessionCipher.decryptPreKeyWhisperMessage(encryptedMessage.attributes.body, "base64");
      } else {
        message = await sessionCipher.decryptWhisperMessage(encryptedMessage.attributes.body, "base64");
      }

      // Decode using UTF8
      message = JSON.parse(await _bToUtf8(message));
      return message;
    },
    store: async function() {
      return store;
    },
    loaded: async function() {
      return store !== null;
    },
    buildSession: async function(deviceId, identityKey, signedPreKey, preKey) {
      const addressString = await _addressString(deviceId);
      const address = new libsignal.SignalProtocolAddress(addressString, deviceId);
      const sessionBuilder = new libsignal.SessionBuilder(store, address);

      const attributes = {
        registrationId: identityKey.attributes.registration_id,
        identityKey: await _64ToB(identityKey.attributes.public_key),
        signedPreKey: {
          keyId: signedPreKey.attributes.key_id,
          publicKey: await _64ToB(signedPreKey.attributes.public_key),
          signature: await _64ToB(signedPreKey.attributes.signature),
        },
      };

      if (preKey) {
        attributes.preKey = {
          keyId: preKey.attributes.key_id,
          publicKey: await _64ToB(preKey.attributes.public_key),
        };
      }

      await sessionBuilder.processPreKey(attributes);
    },
    generateDeviceInfo: async function() {
      // identity key and registration id
      store = new window.SignalProtocolStore();
      store.put("currentSignedKeyId", 1);
      store.put("currentPreKeyId", 1);
      await window.generateIdentity(store);
    },
    getIdentityPublicKey: async function() {
      const idKeyPair = await store.getIdentityKeyPair();
      return await _bTo64(idKeyPair.pubKey);
    },
    generateSignedPreKey: async function(deviceId) {
      const currentSignedKeyId = store.get("currentSignedKeyId");
      const {signedPreKey: {signature, keyId, publicKey}} = await window.generateSignedPreKey(store, currentSignedKeyId);
      store.put("currentSignedKeyId", currentSignedKeyId + 1);
      return {signature: await _bTo64(signature), keyId, publicKey: await _bTo64(publicKey)};
    },
    getRegistrationId: async function() {
      return store.getLocalRegistrationId();
    },
    hasSession: async function(deviceId) {
      const addressString = await _addressString(deviceId);

      return (await _addressToSessionKey(addressString, deviceId) in store.store);
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
      const bEncrypted = await window.crypto.subtle.encrypt( {name: "AES-CBC", iv: iv}, aesKey, await _64ToB(data));
      const encrypted = await _bTo64(bEncrypted);

      const hmacKey = await window.crypto.subtle.generateKey({name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      const hmacExported = await _bTo64(await window.crypto.subtle.exportKey("raw", hmacKey));
      const signature = await _bTo64(await window.crypto.subtle.sign({name: "HMAC"}, hmacKey, bEncrypted));

      return {encrypted, hmacExported, sIv, signature, aesExported};
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}){
      // Return string values
      const hmacKey = await window.crypto.subtle.importKey("raw", await _64ToB(hmacExported), {name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      const verified = await window.crypto.subtle.verify({name: "HMAC"}, hmacKey, await _64ToB(signature), await _64ToB(encrypted));

      if (!verified) {
        throw new Error("Error, file not verified.");
      }

      const aesKey = await window.crypto.subtle.importKey("raw", await _64ToB(aesExported), {name: "AES-CBC"}, true, ["encrypt", "decrypt"]);
      const decrypted = await window.crypto.subtle.decrypt({name: "AES-CBC", iv: await _64ToB(sIv)}, aesKey, await _64ToB(encrypted));
      const sDecrypted = await _bTo64(decrypted);
      return sDecrypted;
    },
    loadFromDisk: async function(payload) {
      let __64ToB = _64ToB;

      // HACK for invalid key store
      const buff = new Buffer(payload.idPubKey, "base64");
      if (buff.length > 33) {
        __64ToB = _deprecated64ToB;
      }

      store = new window.SignalProtocolStore();
      store.put("currentSignedKeyId", payload.currentSignedKeyId);
      store.put("currentPreKeyId", payload.currentPreKeyId);
      store.put("registrationId", payload.registrationId);
      store.put("identityKey", {pubKey: await __64ToB(payload.idPubKey), privKey: await __64ToB(payload.idPrivKey)});

      // restore the saved sessions
      for (const key of Object.keys(payload.sessions)) {
        store.put(key, payload.sessions[key]);
      }

      // restore the identity keys
      for (const key of Object.keys(payload.identityKeys)) {
        store.put(key, await __64ToB(payload.identityKeys[key]));
      }

      for (const key of Object.keys(payload.signedKeys)) {
        const value = {pubKey: await __64ToB(payload.signedKeys[key].pubKey), privKey: await __64ToB(payload.signedKeys[key].privKey)}
        store.put(key, value);
      }

      for (const key of Object.keys(payload.preKeys)) {
        const value = {pubKey: await __64ToB(payload.preKeys[key].pubKey), privKey: await __64ToB(payload.preKeys[key].privKey)}
        store.put(key, value);
      }
    }
  }
})();

export default engine;
