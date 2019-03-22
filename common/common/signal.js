import utility from "./utility.js"
import logger from "./logger.js"
import storage from "./storage.js"

// Rename to Crypto
let signal = (function() {
  let [registrationId, keyId, store, bundle, oldDeviceInfo] = [null, null, null, null, null, null];

  // Ephemeral hash to store ciphers
  let ciphers = {};

  async function _addressToSessionKey(addressString, deviceId) {
    // Function of the store library
    return `session${addressString}.${deviceId}`
  }

  async function _getCipher(store, address) {
    // TODO figure why we aren't sending any messages of type 1
    if (ciphers[address.toString()]) {
      return ciphers[address.toString()];
    } else {
      let cipher = new window.libsignal.SessionCipher(store, address);
      ciphers[address.toString()] = cipher;
      return cipher;
    }
  }

  async function _encryptMessage(store, address, messageString) {
    let object = JSON.stringify({"type": "m", "version": "1", "data": messageString});
    let messageBuffer = window.util.toArrayBuffer(object);

    let sessionCipher = await _getCipher(store, address);
    let message = await sessionCipher.encrypt(messageBuffer);
    return message;
  }

  async function _storeHasSession(store, addressString, deviceId) {
    return (await _addressToSessionKey(addressString, deviceId) in store.store)
  }

  async function _addressString(deviceId) {
    return `${deviceId}`
  }

  async function _bToS(binary) {
    let string = window.util.toString(binary);
    return string;
  }

  async function _sToB(string) {
    return window.util.toArrayBuffer(string);
  }

  async function _saveState(deviceId) {
    const idKeyPair = await store.getIdentityKeyPair();
    const preKeyPair = await store.loadPreKey(keyId);
    const signedPreKeyPair = await store.loadSignedPreKey(keyId);
    const sig = await bundle.signedPreKey.signature;
    const sessions = {};
    const identityKeys = {};

    for (let key of Object.keys(store.store)) {
      // save the current sessions
      if (key.startsWith("session")){
        sessions[key] = store.store[key];
      }
      // save the current identity keys
      if (key.startsWith("identityKey") && key !== "identityKey"){
        identityKeys[key] = await _bToS(store.store[key]);
      }
    }

    let storagePayload = {
      registrationId: registrationId,
      idPubKey: await _bToS(idKeyPair.pubKey),
      idPrivKey: await _bToS(idKeyPair.privKey),
      preKeyId: keyId,
      signedKeyId: keyId,
      deviceId: deviceId,
      addressString: await utility.addressString(deviceId),
      signedPreKeyPub: await _bToS(signedPreKeyPair.pubKey),
      signedPreKeyPriv: await _bToS(signedPreKeyPair.privKey),
      signedSignature: await _bToS(sig),
      sessions: sessions,
      identityKeys: identityKeys
    };

    if (preKeyPair && preKeyPair.pubKey) {
      storagePayload.preKeyPub = await _bToS(preKeyPair.pubKey)
      storagePayload.preKeyPriv = await _bToS(preKeyPair.privKey)
    } else {
      storagePayload.preKeyPub = oldDeviceInfo.payload.preKeyPub;
      storagePayload.preKeyPriv = oldDeviceInfo.payload.preKeyPriv;
    }

    const ironStorage = {
      version: 1,
      payload: storagePayload
    };

    await storage.saveSignalInfo(deviceId, JSON.stringify(ironStorage));
    oldDeviceInfo = ironStorage;
  }

  return {
    aesEncrypt: async function(data) {
      let bData = await _sToB(data);
      let key = await window.crypto.subtle.generateKey(
        {
          name: "AES-CBC",
          length: 256, //can be  128, 192, or 256
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
      )
      let exported = await _bToS(await window.crypto.subtle.exportKey("raw", key));
      let iv = window.crypto.getRandomValues(new Uint8Array(16));
      let sIv = await _bToS(iv);
      let bEncrypted = await window.crypto.subtle.encrypt( { name: "AES-CBC", iv: iv},key, bData);
      let encrypted = await _bToS(bEncrypted);
      console.log(sIv);
      console.log(exported);
      console.log(encrypted);

      console.log("HMAC");
      let hmacKey = await window.crypto.subtle.generateKey({name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      let hmacExported = await _bToS(await window.crypto.subtle.exportKey("raw", hmacKey));
      console.log(hmacExported);
      let signature = await _bToS(await window.crypto.subtle.sign({name: "HMAC"}, hmacKey, bEncrypted));
      console.log(signature);

      // Return string values

      let key2 = await window.crypto.subtle.importKey("raw", await _sToB(exported), {name: "AES-CBC"}, true, ["encrypt", "decrypt"]);
      let decrypted = await window.crypto.subtle.decrypt({name: "AES-CBC", iv: await _sToB(sIv)}, key2, await _sToB(encrypted));
      let sDecrypted = await _bToS(decrypted);

      let hmacKey2 = await window.crypto.subtle.importKey("raw", await _sToB(hmacExported), {name: "HMAC", hash: {name: "SHA-256"}}, true, ["sign", "verify"]);
      let verified = await window.crypto.subtle.verify({name: "HMAC"}, hmacKey2, await _sToB(signature), await _sToB(encrypted));
      console.log(sDecrypted);
      console.log(verified);
    },
    inspectStore: async function() {
      return store;
    },
    loadSignalInfo: async function(deviceId) {
      const deviceInfo = await storage.loadSignalInfo(deviceId);
      oldDeviceInfo = deviceInfo;
      if (deviceInfo === null) {
        return false;
      } else {
        switch(deviceInfo.version) {
          case 1:
            const payload = deviceInfo.payload;
            registrationId = payload.registrationId;
            keyId = payload.preKeyId;
            store = new window.SignalProtocolStore();
            store.put("registrationId", payload.registrationId);
            store.put("identityKey", {pubKey: await _sToB(payload.idPubKey), privKey: await _sToB(payload.idPrivKey)});
            store.storePreKey(keyId, {pubKey: await _sToB(payload.preKeyPub), privKey: await _sToB(payload.preKeyPriv)});
            store.storeSignedPreKey(keyId, {pubKey: await _sToB(payload.signedPreKeyPub), privKey: await _sToB(payload.signedPreKeyPriv)});
            bundle = await window.getPreKeyBundle(store, keyId, keyId, await _sToB(payload.signedSignature));

            // restore the saved sessions
            for(let key of Object.keys(payload.sessions)){
              store.put(key, payload.sessions[key]);
            }

            // restore the identity keys
            for(let key of Object.keys(payload.identityKeys)){
              store.put(key, await _sToB(payload.identityKeys[key]));
            }

            return true;
          default:
            return false;
        }
      }
    },
    decryptMessage: async function(deviceId, senderDeviceId, payload){
      let addressString = await utility.addressString(deviceId);
      let address = new window.libsignal.SignalProtocolAddress(addressString, deviceId);
      let sessionCipher = new window.libsignal.SessionCipher(store, address);
      let encryptedMessage = payload.data[0];

      let message = null;

      logger.info(`Encrypted message body ${encryptedMessage.attributes.body}`)

      if (encryptedMessage.attributes.type === 3) {
        message = await sessionCipher.decryptPreKeyWhisperMessage(encryptedMessage.attributes.body, "binary")
      } else {
        message = await sessionCipher.decryptWhisperMessage(encryptedMessage.attributes.body, "binary")
      }

      message = JSON.parse(await _bToS(message));
      delete encryptedMessage.attributes.body

      encryptedMessage.attributes.decryptedBody = message;
      logger.info(`Decrypted message`);
      logger.info(encryptedMessage);
      _saveState(deviceId);
      return encryptedMessage;
    },
    generateDeviceInfo: async function(deviceId){
      registrationId = window.KeyHelper.generateRegistrationId();
      keyId = 1; // should be random?
      store = new window.SignalProtocolStore();
      await window.generateIdentity(store);

      logger.info("Generate pre key bundle");
      bundle = await window.generatePreKeyBundle(store, keyId, keyId);

      logger.info(bundle);
      _saveState(deviceId);
      return true
    },
    getPreKeyBundle: async function() {
      // TODO pass an object here and serialize it in api.js
      let payload = {
        "payload" : {
          "data": {
            "type": "pre_key_bundle",
            "attributes": {
              "identity_key": await _bToS(bundle.identityKey),
              "registration_id": bundle.registrationId,
              "pre_key_id": bundle.preKey.keyId,
              "pre_key_public_key": await _bToS(bundle.preKey.publicKey), // The public pre key gets wiped out after decoding a message, not sure why...
              "signed_pre_key_id": bundle.signedPreKey.keyId,
              "signed_pre_key_public_key": await _bToS(bundle.signedPreKey.publicKey),
              "signed_pre_key_signature": await _bToS(bundle.signedPreKey.signature)
            }
          }
        }
      }
      return payload;
    },
    syncLocalMessageType: function() {
      return "local_message_v1";
    },
    localMessage: async function(messageString, userId, recipientUserId, deviceId) {
      let object = {"type": "local_message_v1", "data": messageString};

      return {
        id: `local_${Date.now()}`,
        attributes: {
          decryptedBody: object
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
    encryptMessages: async function(preKeyBundles, messageString, deviceId) {
      let encryptedMessages = [];

      for (let preKeyBundle of preKeyBundles) {
        const bundleDeviceId = preKeyBundle.relationships.device.data.id
        const addressString = await _addressString(bundleDeviceId)
        const address = new window.libsignal.SignalProtocolAddress(addressString, bundleDeviceId);
        if (!await _storeHasSession(store, addressString, bundleDeviceId)) {
          let sessionBuilder = new window.libsignal.SessionBuilder(store, address);
          await sessionBuilder.processPreKey({
            registrationId: preKeyBundle.attributes.registration_id,
            identityKey: await _sToB(preKeyBundle.attributes.identity_key),
            signedPreKey: {
                keyId     : preKeyBundle.attributes.signed_pre_key_id,
                publicKey : await _sToB(preKeyBundle.attributes.signed_pre_key_public_key),
                signature : await _sToB(preKeyBundle.attributes.signed_pre_key_signature)
            },
            preKey: {
                keyId     : preKeyBundle.attributes.pre_key_id,
                publicKey : await _sToB(preKeyBundle.attributes.pre_key_public_key)
            }
          });

        }

        let message = await _encryptMessage(store, address, messageString);
        let payload = {message: message, preKeyBundleId: preKeyBundle.id};
        encryptedMessages.push(payload);
      }

      await _saveState(deviceId);
      return encryptedMessages;
    }
  }
})()

export default signal;
