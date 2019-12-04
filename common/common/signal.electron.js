import utility from "./utility.js"
import logger from "./logger.js"
import storage from "./storage.js"

const KeyHelper = window.libsignal.KeyHelper;
const libsignal = window.libsignal;

// Rename to Crypto
export default (function() {
  let [store] = [null];

  async function _addressToSessionKey(addressString, deviceId) {
    // Function of the store library
    return `session${addressString}.${deviceId}`
  }

  async function _messagePayload(messageString) {
    return JSON.stringify({"type": "m", "version": "1", "data": messageString});
  }

  async function _fileMessagePayload({hmacExported, sIv, signature, aesExported, fileUploadId, basename}) {
    return JSON.stringify({"type": "fm", "version": "1", "data": {hmacExported, sIv, signature, aesExported, fileUploadId, basename}});
  }


  async function _sendPayload(toDeviceId, payload, myDeviceId) {
    const addressString = await _addressString(toDeviceId)
    const address = new libsignal.SignalProtocolAddress(addressString, toDeviceId);

    let message = await _encryptMessage(store, address, payload);
    let encryptedPayload = {message: message, deviceId: toDeviceId};
    await _saveState(myDeviceId);
    return encryptedPayload;
  }

  async function _encryptMessage(store, address, messagePayload) {
    // Encode using UTF8
    let buffer = await _sToUtf8(messagePayload);
    let sessionCipher = new libsignal.SessionCipher(store, address);
    let message = await sessionCipher.encrypt(buffer);
    return message;
  }

  async function _storeHasSession(store, addressString, deviceId) {
    return (await _addressToSessionKey(addressString, deviceId) in store.store)
  }

  async function _addressString(deviceId) {
    return `${deviceId}`
  }

  async function _keyToS(key) {
    return {pubKey: await _bToS(key.pubKey), privKey: (await _bToS(key.privKey))}
  }

  async function _keyToB(key) {
    return {pubKey: await _sToB(key.pubKey), privKey: await _sToB(key.privKey)}
  }

  async function _bToS(binary) {
    let string = window.util.toString(binary);
    return string;
  }

  async function _sToB(string) {
    return window.util.toArrayBuffer(string);
  }

  async function _sToUtf8(string) {
    return new TextEncoder("utf-8").encode(string);
  }

  async function _utf8ToS(buffer) {
    return new TextDecoder().decode(buffer);
  }

  // Also used as the idempotency key
  async function _localMessageId(deviceId){
    const randomPiece = Math.random().toString(36).substr(2).substring(0, 4);
    return `${deviceId}_${randomPiece}_${Math.floor(Date.now() / 1000)}`
  }

  async function _saveState(deviceId) {
    const idKeyPair = await store.getIdentityKeyPair();
    const registrationId = await store.getLocalRegistrationId();
    const currentSignedKeyId = await store.get("currentSignedKeyId");
    const currentPreKeyId = await store.get("currentPreKeyId");
    const sessions = {};
    const identityKeys = {};
    const signedKeys = {};
    const preKeys = {};

    for (let key of Object.keys(store.store)) {
      // save the current sessions
      if (key.startsWith("session")){
        sessions[key] = store.store[key];
      }
      // save the current identity keys
      if (key.startsWith("identityKey") && key !== "identityKey"){
        identityKeys[key] = await _bToS(store.store[key]);
      }

      // save the current identity keys
      if (key.startsWith("25519KeysignedKey")){
        signedKeys[key] = await _keyToS(store.store[key]);
      }

      if (key.startsWith("25519KeypreKey")) {
        preKeys[key] = await _keyToS(store.store[key]);
      }
    }

    let storagePayload = {
      currentSignedKeyId,
      currentPreKeyId,
      registrationId,
      signedKeys,
      preKeys,
      idPubKey: await _bToS(idKeyPair.pubKey),
      idPrivKey: await _bToS(idKeyPair.privKey),
      deviceId: deviceId,
      addressString: await utility.addressString(deviceId),
      sessions: sessions,
      identityKeys: identityKeys
    };

    const ironStorage = {
      version: 1,
      payload: storagePayload
    };

    await storage.saveSignalInfo(deviceId, ironStorage);
  }

  return {
    aesEncrypt: async function(data) {
      let aesKey = await window.crypto.subtle.generateKey(
        {
          name: "AES-CBC",
          length: 256, //can be  128, 192, or 256
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
      )
      let aesExported = await _bToS(await window.crypto.subtle.exportKey("raw", aesKey));
      let iv = window.crypto.getRandomValues(new Uint8Array(16));
      let sIv = await _bToS(iv);
      let bEncrypted = await window.crypto.subtle.encrypt( { name: "AES-CBC", iv: iv}, aesKey, await _sToB(data));
      let encrypted = await _bToS(bEncrypted);

      let hmacKey = await window.crypto.subtle.generateKey({name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      let hmacExported = await _bToS(await window.crypto.subtle.exportKey("raw", hmacKey));
      let signature = await _bToS(await window.crypto.subtle.sign({name: "HMAC"}, hmacKey, bEncrypted));

      return {encrypted, hmacExported, sIv, signature, aesExported}
    },
    aesDecrypt: async function({encrypted, hmacExported, sIv, signature, aesExported}) {
      // Return string values
      let hmacKey = await window.crypto.subtle.importKey("raw", await _sToB(hmacExported), {name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      let verified = await window.crypto.subtle.verify({name: "HMAC"}, hmacKey, await _sToB(signature), await _sToB(encrypted));

      if (!verified) {
        throw new Error("Error, file not verified.");
      }

      let aesKey = await window.crypto.subtle.importKey("raw", await _sToB(aesExported), {name: "AES-CBC"}, true, ["encrypt", "decrypt"]);
      let decrypted = await window.crypto.subtle.decrypt({name: "AES-CBC", iv: await _sToB(sIv)}, aesKey, await _sToB(encrypted));
      let sDecrypted = await _bToS(decrypted);
      return sDecrypted;
    },
    inspectStore: async function() {
      return store;
    },
    infoLoaded: async function() {
      return store !== null
    },
    loadDeviceInfoFromDisk: async function(deviceId) {
      logger.info("Loading signal device info from disk");
      const deviceInfo = await storage.loadSignalInfo(deviceId);
      if (deviceInfo === null) {
        return false;
      } else {
        switch(deviceInfo.version) {
          case 1:
            const payload = deviceInfo.payload;
            //            registrationId = payload.registrationId;
            //           keyId = payload.preKeyId;
            store = new window.SignalProtocolStore();
            store.put("currentSignedKeyId", payload.currentSignedKeyId);
            store.put("currentPreKeyId", payload.currentPreKeyId);
            store.put("registrationId", payload.registrationId);
            store.put("identityKey", {pubKey: await _sToB(payload.idPubKey), privKey: await _sToB(payload.idPrivKey)});
            //            store.storePreKey(keyId, {pubKey: await _sToB(payload.preKeyPub), privKey: await _sToB(payload.preKeyPriv)});
            //            store.storeSignedPreKey(keyId, {pubKey: await _sToB(payload.signedPreKeyPub), privKey: await _sToB(payload.signedPreKeyPriv)});

            // restore the saved sessions
            for(let key of Object.keys(payload.sessions)){
              store.put(key, payload.sessions[key]);
            }

            // restore the identity keys
            for(let key of Object.keys(payload.identityKeys)){
              store.put(key, await _sToB(payload.identityKeys[key]));
            }

            for(let key of Object.keys(payload.signedKeys)){
              store.put(key, await _keyToB(payload.signedKeys[key]));
            }

            for(let key of Object.keys(payload.preKeys)){
              store.put(key, await _keyToB(payload.preKeys[key]));
            }

            return true;
          default:
            throw new Error("Do not recognize the device info version");
        }
      }
    },
    decryptMessage: async function(deviceId, senderDeviceId, encryptedMessage){
      if (deviceId === senderDeviceId) {
        throw new Error("We should never send a message the same device");
      }
      let addressString = await utility.addressString(senderDeviceId);
      let address = new libsignal.SignalProtocolAddress(addressString, senderDeviceId);
      let sessionCipher = new libsignal.SessionCipher(store, address);

      let message = null;

      logger.debug(`Encrypted message body ${encryptedMessage.attributes.body}`)

      if (encryptedMessage.attributes.type === 3) {
        message = await sessionCipher.decryptPreKeyWhisperMessage(encryptedMessage.attributes.body, "binary")
      } else {
        message = await sessionCipher.decryptWhisperMessage(encryptedMessage.attributes.body, "binary")
      }

      // Decode using UTF8
      message = JSON.parse(await _utf8ToS(message));
      delete encryptedMessage.attributes.body

      encryptedMessage.attributes.decryptedBody = message;
      logger.info(`Decrypted message`);
      logger.info(encryptedMessage);
      encryptedMessage.meta = {};
      await _saveState(deviceId);
      return encryptedMessage;
    },
    generateDeviceInfo: async function(deviceId){
      store = new window.SignalProtocolStore();
      store.put("currentSignedKeyId", 1);
      store.put("currentPreKeyId", 1);
      await window.generateIdentity(store);

      await _saveState(deviceId);
      return true
    },
    getIdentityPublicKey: async function(){
      const idKeyPair = await store.getIdentityKeyPair();
      return await _bToS(idKeyPair.pubKey)
    },
    generateSignedPreKey: async function(deviceId){
      const currentSignedKeyId = store.get("currentSignedKeyId");
      const {signedPreKey: {signature, keyId, publicKey}} = await window.generateSignedPreKey(store, currentSignedKeyId);
      store.put("currentSignedKeyId", currentSignedKeyId + 1);

      await _saveState(deviceId);
      return {keyId, signature: await _bToS(signature), publicKey: await _bToS(publicKey)}
    },
    generatePreKeys: async function(deviceId, number){
      const currentPreKeyId = store.get("currentPreKeyId");
      let keys = [];

      for(let i = 0; i < number; i++) {
        const key = await KeyHelper.generatePreKey(currentPreKeyId + i);
        keys.push({keyId: key.keyId, publicKey: await _bToS(key.keyPair.pubKey)});
        store.storePreKey(currentPreKeyId + i, key.keyPair);

      }
      store.put("currentPreKeyId", currentPreKeyId + number);

      await _saveState(deviceId);
      return keys
    },
    getRegistrationId: async function(){
      return store.getLocalRegistrationId()
    },
    syncLocalMessageType: function() {
      return "local_message_v1";
    },
    syncLocalFileMessageType: function() {
      return "local_file_message_v1";
    },
    localFileMessage: async function({basename, filename}, userId, recipientUserId, deviceId) {
      let object = {"type": "local_file_message_v1", "data": {filename, basename}};

      return {
        id: await _localMessageId(deviceId),
        attributes: {
          decryptedBody: object,
        },
        meta:{
          sent_at: null,
          delivered_at: null,
          errored_at: null,
          sending_at: Date.now(),
        },
        relationships: {
          sender: {
            data: {
              type: "user",
              id: userId
            }
          },
          receiver: {
            data: {
              type: "user",
              id: recipientUserId
            }
          }
        }
      }
    },
    localMessage: async function(messageString, userId, recipientUserId, deviceId) {
      let object = {"type": "local_message_v1", "data": messageString};

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
              id: userId
            }
          },
          receiver: {
            data: {
              type: "user",
              id: recipientUserId
            }
          }
        }
      }
    },
    encryptFileMessage: async function(toDeviceId, params, myDeviceId) {
      let fileMessagePayload = await _fileMessagePayload(params);
      return _sendPayload(toDeviceId, fileMessagePayload, myDeviceId);
    },
    encryptMessage: async function(toDeviceId, messageString, myDeviceId) {
      let messagePayload = await _messagePayload(messageString);
      return _sendPayload(toDeviceId, messagePayload, myDeviceId);
    },
    hasSession: async function(deviceId) {
      const addressString = await _addressString(deviceId);

      return _storeHasSession(store, addressString, deviceId);
    },
    buildSession: async function(deviceId, identityKey, signedPreKey, preKey, myDeviceId) {
      const addressString = await _addressString(deviceId)
      const address = new libsignal.SignalProtocolAddress(addressString, deviceId);

      console.log("Building new session");
      let sessionBuilder = new libsignal.SessionBuilder(store, address);
      let attributes = {
        registrationId: identityKey.attributes.registration_id,
        identityKey: await _sToB(identityKey.attributes.public_key),
        signedPreKey: {
          keyId     : signedPreKey.attributes.key_id,
          publicKey : await _sToB(signedPreKey.attributes.public_key),
          signature : await _sToB(signedPreKey.attributes.signature)
        },
      }
      if (preKey) {
        attributes.preKey = {
          keyId     : preKey.attributes.key_id,
          publicKey : await _sToB(preKey.attributes.public_key)
        }
      }
      await sessionBuilder.processPreKey(attributes);
      await _saveState(myDeviceId);
    }
  }
})()
