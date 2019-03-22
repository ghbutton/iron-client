let crypto = (function() {
  async function addressToSessionKey(addressString, deviceId) {
      return `session${addressString}.${deviceId}`
    }

  return {
    uuidv4: async function() {
      return window.uuidv4();
    },
    encryptMessage: async function (store, address, messageString) {
      let object = JSON.stringify({"type": "m", "version": "1", "data": messageString});
      let messageBuffer = window.util.toArrayBuffer(object);

      let sessionCipher = new window.libsignal.SessionCipher(store, address);
      let message = await sessionCipher.encrypt(messageBuffer);
      return message;
    },
    addressToSessionKey: async function(addressString, deviceId) {
      return addressToSessionKey(addressString, deviceId);
    },
    storeHasSession: async function(store, addressString, deviceId) {
      return (await addressToSessionKey(addressString, deviceId) in store.store)
    }
  }
})()

export default crypto;
