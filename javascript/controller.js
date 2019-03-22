"use strict";

// config
// wsProtocol
// wsUrl
// wsPort
// storage
// callbacks

let [userId, userSessionToken] = [null, null];

let applicationState = {
  state: {connectedUsers: [], messages: []},
  insertObject: function(key, value) {
    applicationState.state[`${key}_${value.id}`] = value;
    const all = applicationState.state[`${key}`] || new Set([]);
    applicationState.state[`${key}`] = all.add(value);
  },
  connectedUser: async function(user) {
    const connections = Array.from(applicationState.state[`connections`] || new Set([]));
    if(connections.some(function(connection){return _connected(connection, user, userId)})){
      applicationState.state.connectedUsers.push(user);
    }
  }
};

storage.setState(applicationState);

function _connected(connection, user, userId){
  return (connection.relationships.users.data[0].id == userId && connection.relationships.users.data[1].id == user.id) || (connection.relationships.users.data[1].id == userId && connection.relationships.users.data[0].id == user.id)
}

async function _sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function _sendApiPush(apiChannel, event, options) {
  let [ready, results] = [false, null];

  const response = apiChannel.push(event, options).receive("ok", pushResults => {
    results = pushResults;
    ready = true;
  });

  while(true) {
    if (ready) {
      break;
    } else {
      await _sleep(10);
    }
  }

  return results;
}

async function _normalizeLocalMessage(messageString, userId, recipientUserId, deviceId) {
  let object = {"type": "local_v1", "data": messageString};
  return {
    id: uuidv4(),  // Client generated id
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
}

async function _encryptMessage(store, address, messageString) {
  let object = JSON.stringify({"type": "m", "version": "1", "data": messageString});
  let messageBuffer = util.toArrayBuffer(object);

  let sessionCipher = new libsignal.SessionCipher(store, address);
  let message = await sessionCipher.encrypt(messageBuffer);
  return message;
}

async function _addressToSessionKey(addressString, deviceId) {
  return `session${addressString}.${deviceId}`
}

async function _storeHasSession(store, addressString, deviceId) {
  return (await _addressToSessionKey(addressString, deviceId) in store.store)
}


// Application.get_env(:iron, :javascript)[:logging]
const logging = true
var logger = (function() {
  return {
    info: function(value) {
      if(logging){
        console.log(value);
      }
    },
    error: function(value) {
      console.log("ERROR: " + value);
    }
  }
})();

async function _randomInteger(){
  return Math.floor(Math.random() * 1000000);
}
async function _nullOrUndefined(value){
  return value === undefined || value === null;
}

async function _initMessages(userId) {
  const key = `ironMessages_${userId}`;
  const messagesPayload = storage.getItem(key);
  if (await _nullOrUndefined(messagesPayload)) {
    return [];
  } else {
    return JSON.parse(messagesPayload);
  }
}

async function _initState(userId){
  // TODO HERE!!
  const key = `ironDeviceInfo_${userId}`;
  const deviceInfoPayload = storage.getItem(key);
  const messages = await _initMessages(userId);

  if (await _nullOrUndefined(deviceInfoPayload)) {
    const registrationId = KeyHelper.generateRegistrationId();
    const deviceId = await _randomInteger(); // calulcated by server...
    const keyId = 1; // should be random?
    const store = new SignalProtocolStore();
    await generateIdentity(store);

    logger.info("Generate pre key bundle");
    const bundle = await generatePreKeyBundle(store, keyId, keyId);

    logger.info(bundle);
    return [registrationId, deviceId, keyId, store, messages, bundle];
  } else {
    const deviceInfo = JSON.parse(deviceInfoPayload);
    switch(deviceInfo.version) {
      case 1:
        const payload = deviceInfo.payload;
        const registrationId = payload.registrationId;
        const deviceId = payload.deviceId;
        const keyId = payload.preKeyId;
        const store = new SignalProtocolStore();
        store.put("registrationId", payload.registrationId);
        store.put("identityKey", {pubKey: util.toArrayBuffer(payload.idPubKey), privKey: util.toArrayBuffer(payload.idPrivKey)});
        store.storePreKey(keyId, {pubKey: util.toArrayBuffer(payload.preKeyPub), privKey: util.toArrayBuffer(payload.preKeyPriv)});
        store.storeSignedPreKey(keyId, {pubKey: util.toArrayBuffer(payload.signedPreKeyPub), privKey: util.toArrayBuffer(payload.signedPreKeyPriv)});
        const bundle = await getPreKeyBundle(store, keyId, keyId, util.toArrayBuffer(payload.signedSignature));

        // restore the saved sessions
        for(let key of Object.keys(payload.sessions)){
          store.put(key, payload.sessions[key])
        }

        // restore the identity keys
        for(let key of Object.keys(payload.identityKeys)){
          store.put(key, payload.identityKeys[key])
        }
        return [registrationId, deviceId, keyId, store, messages, bundle];
    }
  }
}

async function _savePreKeyBundleToAPI(bundle, apiChannel) {
  logger.info(bundle);
  let payload = {
    "payload" : {
      "data": {
        "type": "pre_key_bundle",
        "attributes": {
          "identity_key": util.toString(bundle.identityKey),
          "registration_id": bundle.registrationId,
          "pre_key_id": bundle.preKey.keyId,
          "pre_key_public_key": util.toString(bundle.preKey.publicKey || ""), // The public pre key gets wiped out after decoding a message, not sure why...
          "signed_pre_key_id": bundle.signedPreKey.keyId,
          "signed_pre_key_public_key": util.toString(bundle.signedPreKey.publicKey),
          "signed_pre_key_signature": util.toString(bundle.signedPreKey.signature)
        }
      }
    }
  }

  return _sendApiPush(apiChannel, "POST:pre_key_bundles", payload);
}

async function _createNewInvitation(apiChannel, name, email){
  let payload = {
    "payload" : {
      "data": {
        "type": "invitation",
        "attributes": {
          "name": name,
          "email": email
        }
      }
    }
  }

  return _sendApiPush(apiChannel, "POST:invitations", payload);
}

async function _sendMessage(message, apiChannel, preKeyBundle, devicePreKeyBundle){
  let payload = {
    "payload" : {
      "data": {
        "type": "message",
        "attributes": {
          "type": message.type,
          "body": message.body,
          "pre_key_bundle_id": preKeyBundle.id,
          "sender_pre_key_bundle_id": devicePreKeyBundle.id
        }
      }
    }
  }

  return _sendApiPush(apiChannel, "POST:messages", payload);
}

async function _addressString(userId, deviceId) {
  return `${userId}_${deviceId}`
}

async function _searchIncludes(baseString, searchString) {
  baseString = baseString || "";
  baseString = baseString.toLowerCase();

  return baseString.includes(searchString);
}

async function _decryptMessage(store, deviceId, userId, payload) {
  let addressString = await _addressString(userId, deviceId);
  let address = new libsignal.SignalProtocolAddress(addressString, deviceId);
  let sessionCipher = new libsignal.SessionCipher(store, address);
  let hasSession = await _storeHasSession(store, addressString);
  let encryptedMessage = payload.data[0].attributes;

  let message = null;

  logger.info(`Encrypted message body ${encryptedMessage.body}`)

  if (encryptedMessage.type == 3) {
    message = await sessionCipher.decryptPreKeyWhisperMessage(encryptedMessage.body, "binary")
  } else {
    message = await sessionCipher.decryptWhisperMessage(encryptedMessage.body, "binary")
  }

  return JSON.parse(util.toString(message));
}

async function _displayMessageInUI() {
  callbacks.newMessage();
}

async function _saveMessagesToMemory(messages) {
  const key = `ironMessages_${userId}`;
  storage.setItem(key, JSON.stringify(messages));
}

async function _saveSessionToMemory(session) {
  const key = `ironUserSession`;
  storage.setItem(key, JSON.stringify(session));
}

async function _initUserSession() {
  const key = `ironUserSession`;
  const sessionPayload = storage.getItem(key);
  if (sessionPayload) {
    let session = JSON.parse(sessionPayload);
    return [session.relationships.user.data.id, session.attributes.token];
  } else {
    return [null, null];
  }
}

async function _saveStateToMemory(store, bundle, keyId, deviceId, userId) {
  const registrationId = await store.getLocalRegistrationId();
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
    if (key.startsWith("identityKey") && key != "identityKey"){
      identityKeys[key] = store.store[key];
    }
  }

  let storagePayload = {
      registrationId: registrationId,
      idPubKey: util.toString(idKeyPair.pubKey),
      idPrivKey: util.toString(idKeyPair.privKey),
      preKeyId: keyId,
      signedKeyId: keyId,
      deviceId: deviceId,
      addressString: await _addressString(userId, deviceId),
      signedPreKeyPub: util.toString(signedPreKeyPair.pubKey),
      signedPreKeyPriv: util.toString(signedPreKeyPair.privKey),
      signedSignature: util.toString(sig),
      sessions: sessions,
      identityKeys: identityKeys
    };

  if (preKeyPair && preKeyPair.pubKey) {
    storagePayload.preKeyPub = util.toString(preKeyPair.pubKey)
    storagePayload.preKeyPriv = util.toString(preKeyPair.privKey)
  }

  const ironStorage = {
    version: 1,
    payload: storagePayload
  }
  const key = `ironDeviceInfo_${userId}`;
  storage.setItem(key, JSON.stringify(ironStorage));
}

let controller = (function() {
  const clientVersion = "0.0.1"

  let [registrationId, deviceId, keyId, bundle, devicePreKeyBundle] = [null, null, null, null, null, null];
  let [socket, apiChannel, userDeviceChannel, loginChannel] = [null, null, null, null];
  // Need to store on disk or something
  let [store, messages] = [null, null];

  let [apiChannelReady, userDeviceChannelReady, loginChannelReady] = [false, false, false];
  let [failedToJoin] = [false];

  async function _waitForApiChannel() {
    while(true) {
      if (apiChannelReady || failedToJoin) {
        break;
      } else {
        await _sleep(10);
      }
    }
  }

  async function _waitForLoginChannel() {
    while(true) {
      if (loginChannelReady || failedToJoin) {
        break;
      } else {
        await _sleep(10);
      }
    }
  }

  return {
    asyncCall: async function() {
      logger.info("Init");

      [userId, userSessionToken] = await _initUserSession();

      await this.connectToServer();
    },
    inspectStore: async function() {
      return store;
    },
    connectToServer: async function() {
      logger.info("Connecting to server");
      [registrationId, deviceId, keyId, store, messages, bundle] = await _initState(userId);
      logger.info(`Device id ${deviceId}`);
      let url = `${wsProtocol}://${wsUrl}`;

      if (Number.isInteger(wsPort)) {
        url = url + `:${wsPort}`;
      }

      url = url + `/socket`;
      socket = new Phoenix.Socket(url,
        {
          params: {
            userId: userId,
            sessionToken: userSessionToken,
            clientVersion: clientVersion,
            deviceId: deviceId
          }
        }
      );
      userDeviceChannel = socket.channel(`user:device:connect:${userId}:${deviceId}`, {})
      apiChannel = socket.channel("api:connect", {})
      socket.connect();

      apiChannel.join()
        .receive("ok", async resp => {
          logger.info("Joined successfully", resp);
          logger.info("GET:pre_key_bundles");
          await _saveStateToMemory(store, bundle, keyId, deviceId, userId);
          let response = await _savePreKeyBundleToAPI(bundle, apiChannel);
          devicePreKeyBundle = response.payload.data[0];
          apiChannelReady = true;

          userDeviceChannel.join()
            .receive("ok", async resp => {
              logger.info("Joined successfully", resp);
              userDeviceChannelReady = true;
            })
          .receive("error", async resp => {
            logger.info("Unable to join user", resp)
            failedToJoin = true;
          })

        })
      .receive("error", async resp => {
        logger.info("Unable to join api", resp)
        failedToJoin = true;
      })


      loginChannel = socket.channel("login:connect", {})

      loginChannel.join()
        .receive("ok", async resp => {
          logger.info("Login joined successfully", resp);
          loginChannelReady = true;
        })
      .receive("error", async resp => { logger.info("Unable to join", resp) })

      userDeviceChannel.on("POST:messages", async (response) => {
        let encryptedMessage = response.payload.data[0]
        let preKeyBundleId = encryptedMessage.relationships.sender_pre_key_bundle.data.id;

        logger.info(`Got a message from ${preKeyBundleId}`);

        let senderPreKeyBundle = await this.getPreKeyBundlesById(preKeyBundleId);
        let senderDeviceId = senderPreKeyBundle.attributes.device_id;
        let senderUserId = senderPreKeyBundle.relationships.user.data.id;

        logger.info(`Got a message from device: ${senderDeviceId} user: ${senderUserId}`);

        let message = await _decryptMessage(store, senderDeviceId, senderUserId, response.payload);

        delete encryptedMessage.attributes.body
        encryptedMessage.attributes.decryptedBody = message;

        logger.info(`Decrypted message`);
        logger.info(encryptedMessage);

        await _saveStateToMemory(store, bundle, keyId, deviceId, userId);

        messages.push(encryptedMessage);
        await _saveMessagesToMemory(messages);
        await _displayMessageInUI();
      });
    },
    getMessages: async function(connectedUserId) {
      let connectedMessages = [];
      for (let i = 0; i < messages.length; i++) {
        let senderId = messages[i].relationships.sender.data.id;
        let receiverId = messages[i].relationships.receiver.data.id;
        if (senderId === connectedUserId.toString() || (senderId === userId.toString() && receiverId === connectedUserId.toString())) {
          connectedMessages.push(messages[i]);
        }
      }

      return connectedMessages;
    },
    currentUsersMessage: function (message) {
      return (message.relationships.sender.data.id === userId.toString())
    },
    currentUser: async function() {
      if (await this.notLoggedIn()) {
        return null;
      } else {
        return this.getUserById(userId);
      }
    },
    notLoggedIn: async function () {
      await _waitForApiChannel();
      return !!(socket) && failedToJoin
    },
    getUserById: async function(userId) {
      await _waitForApiChannel();

      let usersResp = await _sendApiPush(apiChannel, "GET:users", {id: userId});
      let user = usersResp.payload.data[0];
      applicationState.insertObject("users", user)
      applicationState.connectedUser(user);

      return user;
    },
    updateUser: async function({name}) {
      await _waitForApiChannel();
      let payload = {
        payload: {
          data: {
            type: "user",
            attributes: {
              name: name
            }
          }
        }
      }

      const updateResp = await _sendApiPush(apiChannel, `PATCH:users:${userId}`, payload);
      return updateResp;
    },
    getPreKeyBundlesByUserId: async function(userId) {
      await _waitForApiChannel();
      const preKeyBundlesResp = await _sendApiPush(apiChannel, "GET:pre_key_bundles", {"user_id": userId});
      return preKeyBundlesResp.payload.data
    },
    getPreKeyBundlesById: async function(id) {
      await _waitForApiChannel();
      const preKeyBundlesResp = await _sendApiPush(apiChannel, "GET:pre_key_bundles", {"id": id});
      return preKeyBundlesResp.payload.data[0]
    },
    sendVerificationCode: async function(email) {
      await _waitForLoginChannel();
      const verificationResp = await _sendApiPush(loginChannel, "POST:email_verifications", {email: email});
      return verificationResp;
    },
    login: async function(email, code) {
      await _waitForLoginChannel();
      const loginResp = await _sendApiPush(loginChannel, "POST:sessions", {email: email, code: code});

      if (loginResp.payload) {
        _saveSessionToMemory(loginResp.payload.data.sessions[0]);
      }

      return loginResp;
    },
    getConnectedUsers: async function() {
      await _waitForApiChannel();

      const connectionsResp = await _sendApiPush(apiChannel, "GET:connections", {});

      const connectedUsers = await Promise.all(connectionsResp.payload.data.map(async (connection) => {
        applicationState.insertObject("connections", connection)

        let connectedUserId = connection.relationships.users.data[0].id == userId ? connection.relationships.users.data[1].id : connection.relationships.users.data[0].id;
        const usersResp = await _sendApiPush(apiChannel, "GET:users", {"id": connectedUserId});
        let usersById = await Promise.all(usersResp.payload.data.map((user) => {
          applicationState.insertObject("users", user)
          applicationState.connectedUser(user);

          return user;
        }));
        return usersById[0];
      }));

      return connectedUsers;
    },
    connectedUsersSearch: async function(searchString) {
      let connectedUsers = await this.getConnectedUsers();
      searchString = searchString.toLowerCase();
      searchString = searchString.replace(/\s+/g, "");

      let searchResults = [];

      for(let i = 0; i < connectedUsers.length; i++) {
        let user = connectedUsers[i];

        if (await _searchIncludes(user.attributes.name, searchString) || await _searchIncludes(user.attributes.email, searchString)) {
          searchResults.push(user);
        }
      }

      return searchResults;
    },
    createNewInvitation: async function(name, email) {
      return _createNewInvitation(apiChannel, name, email);
    },
    sendMessage: async function(messageString, recipientUserId){
      logger.info(`Sending message ${messageString} to ${recipientUserId}`);
      const object = JSON.stringify({"type": "message", "version": "1", "data": messageString});
      const messageBuffer = util.toArrayBuffer(object);
      const preKeyBundles = await this.getPreKeyBundlesByUserId(recipientUserId);

      let localMessage = await _normalizeLocalMessage(messageString, userId, recipientUserId, deviceId)
      messages.push(localMessage);
      await _saveMessagesToMemory(messages);

      for (let preKeyBundle of preKeyBundles) {
        const bundleDeviceId = preKeyBundle.attributes.device_id
        const addressString = await _addressString(recipientUserId, bundleDeviceId)
        const address = new libsignal.SignalProtocolAddress(addressString, bundleDeviceId);
        if (!await _storeHasSession(store, addressString, bundleDeviceId)) {
          let sessionBuilder = new libsignal.SessionBuilder(store, address);
          let result = await sessionBuilder.processPreKey({
            registrationId: preKeyBundle.attributes.registration_id,
            identityKey: util.toArrayBuffer(preKeyBundle.attributes.identity_key),
            signedPreKey: {
                keyId     : preKeyBundle.attributes.signed_pre_key_id,
                publicKey : util.toArrayBuffer(preKeyBundle.attributes.signed_pre_key_public_key),
                signature : util.toArrayBuffer(preKeyBundle.attributes.signed_pre_key_signature)
            },
            preKey: {
                keyId     : preKeyBundle.attributes.pre_key_id,
                publicKey : util.toArrayBuffer(preKeyBundle.attributes.pre_key_public_key)
            }
          });

          await _saveStateToMemory(store, bundle, keyId, deviceId, userId);
        }

        let message = await _encryptMessage(store, address, messageString)
        await _saveStateToMemory(store, bundle, keyId, deviceId, userId);
        await _sendMessage(message, apiChannel, preKeyBundle, devicePreKeyBundle)
      }
    }
  }
})();

console.log(module);
module.exports = controller;
