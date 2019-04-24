import api from "./api.js";
import callbacks from "./callbacks.js";
import deviceOS from "./device_os.js";
import logger from "./logger.js";
import fileSystem from "./file_system.js";
import signal from "./signal.js";
import storage from "./storage.js";

let applicationState = (function() {
  let state = {connectedUsers: [], messages: [], lastRead: {}}

  async function addDedup(list, object) {
    let isDup = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === object.id && list[i].type === object.type) {
        list[i] = object;
        isDup = true;
      }
    }

    if (!isDup) {
      list.push(object);
    }
  }

  async function insertObject(key, value) {
    state[`${key}_${value.id}`] = value;
    const all = state[`${key}`] || new Set([]);
    state[`${key}`] = all.add(value);
  }

  return {
    insertUser: async function(user){
      return insertObject("users", user);
    },
    insertConnection: async function(connection){
      return insertObject("connections", connection);
    },
    connectedUser: async function(user) {
      await addDedup(state.connectedUsers, user);
    },
    connectedUsers: async function() {
      return state.connectedUsers;
    },
    connectedMessages: function(userId, connectedUserId) {
      let connectedMessages = [];

      for (let i = 0; i < state.messages.length; i++) {
        let message = state.messages[i];
        if(message.attributes.decryptedBody.type === signal.syncLocalMessageType() || message.attributes.decryptedBody.type === signal.syncLocalFileMessageType()) {
          if (message.relationships.receiver.data.id === connectedUserId.toString()) {
            connectedMessages.push(message);
          }
        } else {
          let senderUserId = message.relationships.sender_user.data.id;
          let receiverUserId = message.relationships.receiver_user.data.id;

          if (senderUserId === connectedUserId.toString() || (senderUserId === userId.toString() && receiverUserId === connectedUserId.toString())) {
            connectedMessages.push(message);
          }
        }
      }
      return connectedMessages;
    },
    messages: function() {
      return state.messages;
    },
    lastRead: function() {
      return state.lastRead;
    },
    userLastRead: function(userId) {
      return state.lastRead[userId] || 0;
    },
    updateLastRead: function(userId, lastRead) {
      if (userId) {
        state.lastRead[userId] = lastRead;
      }
    },
    addMessage: async function(message) {
      state.messages.push(message)
    },
    initMessages: async function(messages) {
      state.messages = messages;
    },
    initLastRead: async function(lastRead) {
      state.lastRead = lastRead;
    },
    hasMessage: async function(message) {
      return state.messages.some((thisMessage) => { return thisMessage.id === message.id })
    },
    messageSent: async function(localMessage) {
      // TODO, should the server send something back to say the message has been received?
      for(let i = 0; i< state.messages.length; i++){
        if (localMessage.id === state.messages[i].id) {
          state.messages[i].meta.sent_at = Date.now();
        }
      }
    },
    messageDelivered: async function(id) {
      for(let i = 0; i< state.messages.length; i++){
        if (id === state.messages[i].id) {
          state.messages[i].meta.delivered_at = Date.now();
        }
      }
    },
    messageErrored: async function(localMessage) {
      for(let i = 0; i< state.messages.length; i++){
        if (localMessage.id === state.messages[i].id) {
          state.messages[i].meta.errored_at = Date.now();
        }
      }
    },
    messageResending: async function(message) {
      for(let i = 0; i< state.messages.length; i++){
        if (message.id === state.messages[i].id) {
          state.messages[i].meta = state.messages[i].meta || {}
          state.messages[i].meta.errored_at = null;
          state.messages[i].meta.sending_at = Date.now();
        }
      }
    },
    // TODO refactor for loops into a single method.
    messageDownloadFinished: async function(message) {
      for(let i = 0; i< state.messages.length; i++){
        if (message.id === state.messages[i].id) {
          state.messages[i].meta.downloading_at = null;
          state.messages[i].meta.downloaded_at = Date.now();
        }
      }
    },
    // TODO refactor for loops into a single method.
    messageDownloading: async function(message) {
      for(let i = 0; i< state.messages.length; i++){
        if (message.id === state.messages[i].id) {
          state.messages[i].meta = state.messages[i].meta || {};
          state.messages[i].meta.downloading_at = Date.now();
        }
      }
    },
    getMessageById: async function(id) {
      for(let i = 0; i< state.messages.length; i++){
        if (id === state.messages[i].id) {
          return state.messages[i];
        }
      }
      return null;
    }
  }
})();

window.applicationState = applicationState;
window.storage = storage;

let controller = (function() {
  let [userId, userSessionToken, deviceId, deviceSecret] = [null, null, null, null, null];
  const clientVersion = "0.0.1"

  async function resetState(){
    [userId, userSessionToken, deviceId, deviceSecret] = [null, null, null, null, null];
  }

  async function _messageErrored(message) {
    await applicationState.messageErrored(message);
    await storage.saveMessages(deviceId, applicationState.messages());
    callbacks.newMessage();
  }

  async function _sendLocalFile(localFileMessage) {
    const {basename, filename} = localFileMessage.attributes.decryptedBody.data;

    const bytes = await fileSystem.readBytes(filename);
    const {encrypted, hmacExported, sIv, signature, aesExported} = await signal.aesEncrypt(bytes);

    const fileUpload = await api.uploadFile({encrypted, deviceId});

    if (!fileUpload) {
      await _messageErrored(localFileMessage);
      return;
    }

    const recipientUserId = localFileMessage.relationships.receiver.data.id;
    const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);

    if (!preKeyBundles) {
      await _messageErrored(localFileMessage);
      return;
    }

    let encryptedMessages = await signal.encryptFileMessages(preKeyBundles, {hmacExported, sIv, signature, aesExported, basename, fileUploadId: fileUpload.id}, deviceId);

    // add to queue
    const {status} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localFileMessage.id);

    if(status === "ok") {
      await applicationState.messageSent(localFileMessage);
    } else {
      await applicationState.messageErrored(localFileMessage);
    }

    await storage.saveMessages(deviceId, applicationState.messages());
    callbacks.newMessage();
  }

  async function _sendLocalMessage(localMessage) {
    const recipientUserId = localMessage.relationships.receiver.data.id;
    const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);

    if (!preKeyBundles) {
      await applicationState.messageErrored(localMessage);
      await storage.saveMessages(deviceId, applicationState.messages());
      callbacks.newMessage();
      return;
    }

    // Send to receiver
    let encryptedMessages = await signal.encryptMessages(preKeyBundles, localMessage.attributes.decryptedBody.data, deviceId);
    let {status} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localMessage.id);

    if(status === "ok") {
      await applicationState.messageSent(localMessage);
    } else {
      await applicationState.messageErrored(localMessage);
    }

    await storage.saveMessages(deviceId, applicationState.messages());
    callbacks.newMessage();
  }

  async function _markDelivered(idempotencyKey) {
    await applicationState.messageDelivered(idempotencyKey);
    await storage.saveMessages(deviceId, applicationState.messages());
  }

  async function _decryptMessage(encryptedMessage) {
    let senderDeviceId = encryptedMessage.relationships.sender_device.data.id;

    logger.info(`Got a message from ${senderDeviceId}`);

    // Dedup messages that we already have
    if (!await applicationState.hasMessage(encryptedMessage)) {
      let message = await signal.decryptMessage(deviceId, senderDeviceId, encryptedMessage);
      // Needs to happen atomically
      await applicationState.addMessage(message);
      await storage.saveMessages(deviceId, applicationState.messages());
      // END
    }

    await api.messageDelivered(encryptedMessage.id);
  }

  async function _searchIncludes(baseString, searchString) {
    baseString = baseString || "";
    baseString= baseString.replace(/\s+/g, "");
    baseString = baseString.toLowerCase();

    return baseString.includes(searchString);
  }

  async function _apiChannelCallback(resp) {
    logger.info("Joined api channel successfully", resp);
    let bundle = await signal.getPreKeyBundle();
    await api.sendPreKeyBundle(bundle);
    logger.info("Done with api channel");
  }

  async function _userDeviceChannelCallback(resp) {
    logger.info("Joined user device successfully", resp);
    const messages = await api.getMessages();

    for(let i = 0; i < messages.length; i++) {
      const encryptedMessage = messages[i];
      _decryptMessage(encryptedMessage)
    }
    callbacks.newMessage();
  }

  async function _loginChannelCallback(resp) {
    logger.info("Joined login successfully", resp);
  }

  async function _receiveMessagesCallback(response) {
    let encryptedMessage = response.payload.data[0]

    await _decryptMessage(encryptedMessage);

    callbacks.newMessage();
  };

  async function _receiveMessagePackagesCallback(response) {
    let messagePackage = response.payload.data[0]

    _markDelivered(messagePackage.attributes.idempotency_key);
    callbacks.newMessage();
  };

  async function _uploadFile(filename, recipientUserId) {
    logger.info(`Sending file ${filename} to ${recipientUserId}`);
    let basename = await fileSystem.basename(filename);
    let localFileMessage = await signal.localFileMessage({basename, filename}, userId, recipientUserId, deviceId);
    await applicationState.addMessage(localFileMessage);
    await storage.saveMessages(deviceId, applicationState.messages());

    _sendLocalFile(localFileMessage);
    return null;
  }

  return {
    init: async function(){
      logger.info("Init");
      await storage.init();

      logger.info("Storaged initialized");
      [userId, userSessionToken] = await storage.loadCurrentSession();

      let device = await storage.getDevice(userId);

      if (device) {
        deviceId = device.id;
        deviceSecret = device.secret;
      }

      if (deviceId !== null) {
        applicationState.initMessages(await storage.loadMessages(deviceId));
        applicationState.initLastRead(await storage.loadLastRead(deviceId));
      }

      return null;
    },
    connectToServer: async function() {
      logger.info("Connect to server");
      await api.connect(userId, userSessionToken, clientVersion, deviceId, deviceSecret);
      await api.joinLoginChannel(_loginChannelCallback);

      if (userId && deviceId === null) {
        if (deviceId === null) {
          const name = await deviceOS.deviceName();
          const osName = await deviceOS.osName();

          let device = await api.createDevice(userId, userSessionToken, name, osName, 2000);
          await storage.saveDevice(userId, device);
          deviceId = device.id;
          await api.reconnect(userId, userSessionToken, clientVersion, deviceId, deviceSecret);
        }
      }

      if (userId && deviceId) {
        let loaded = await signal.loadSignalInfo(deviceId);

        if (!loaded && userId) {
          await signal.generateDeviceInfo(deviceId);
        }

        await api.joinApiChannel(_apiChannelCallback);
        await api.joinUserDeviceChannel(_userDeviceChannelCallback);
        await api.userDeviceChannelReceiveMessages(_receiveMessagesCallback);
        await api.userDeviceChannelReceiveMessagePackages(_receiveMessagePackagesCallback);
      }
    },
    inspectStore: async function() {
      return signal.inspectStore();
    },
    // TODO get messages from API
    getMessages: async function(connectedUserId) {
      return applicationState.connectedMessages(userId, connectedUserId);
    },
    hasUnreadMessages: function(connectedUserId) {
      const lastRead = applicationState.userLastRead(connectedUserId);
      const messages = applicationState.connectedMessages(userId, connectedUserId);

      for(let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.attributes.inserted_at) {
          const insertedAt = new Date(message.attributes.inserted_at).getTime() / 1000;
          if (insertedAt > lastRead) {
            return true;
          }
        }
      }
      return false;
    },
    setLastRead: async function(connectedUserId) {
      let lastRead = applicationState.userLastRead(connectedUserId);
      const messages = applicationState.connectedMessages(userId, connectedUserId);

      for(let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.attributes.inserted_at) {
          const insertedAt = new Date(message.attributes.inserted_at).getTime() / 1000;
          if (insertedAt > lastRead) {
            lastRead = insertedAt;
          }
        }
      }

      await applicationState.updateLastRead(connectedUserId, lastRead);
      await storage.saveLastRead(deviceId, applicationState.lastRead());
    },
    // TODO make async ??
    currentUsersMessage: function(message) {
      if(message.attributes.decryptedBody.type === signal.syncLocalMessageType() || message.attributes.decryptedBody.type === signal.syncLocalFileMessageType()) {
        return (message.relationships.sender.data.id === userId.toString());
      } else {
        return (deviceId === message.relationships.sender_device.data.id);
      }
    },
    currentUser: async function(message) {
      if (await this.notLoggedIn()) {
        return null;
      } else {
        return this.getUserById(userId);
      }
    },
    notLoggedIn: async function() {
      return userId === null;
    },
    getUserById: async function(userId) {
      let {status, resp} = await api.getUserById(userId, 2000);
      if (status === "ok") {
        await applicationState.insertUser(resp);
        return resp;
      } else {
        return null;
      }
    },
    updateUser: async function(params) {
      return api.updateUser(userId, params);
    },
    getPreKeyBundlesById: async function(id) {
      return null;
    },
    sendVerificationCode: async function(email) {
      const resp = await api.sendVerificationCode(email, 2000);
      return resp;
    },
    login: async function(email, code) {
      const {status, resp} = await api.login(email, code, 2000);

      if (status === "ok" && resp.payload) {
        storage.saveSession(resp.payload.data.sessions[0]);
      }

      return resp
    },
    getConnectedUsers: async function() {
      let [connections, connectedUsers] = await api.connectedUsers(2000, userId);
      for(let i = 0; i < connections.length; i++) {
        await applicationState.insertConnection(connections[i]);
      }

      for(let i = 0; i < connectedUsers.length; i++) {
        await applicationState.insertUser(connectedUsers[i]);
        await applicationState.connectedUser(connectedUsers[i]);
      }

      return applicationState.connectedUsers();
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
      return api.sendInvitation(name, email, 2000);
    },
    uploadFiles: async function(recipientUserId) {
      let fileNames = await fileSystem.showOpenDialog();
      if (fileNames === undefined) return;

      return await Promise.all(
        fileNames.map(
          fileName =>
            _uploadFile(fileName, recipientUserId)
        )
      )
    },
    downloadFile: async function(message) {
      logger.info("Downloading file");

      await applicationState.messageDownloading(message);
      await storage.saveMessages(deviceId, applicationState.messages());
      callbacks.newMessage();

      let {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = message.attributes.decryptedBody.data
      let fileUpload = await api.downloadFile(fileUploadId);

      let decrypted = await signal.aesDecrypt({encrypted: fileUpload.attributes.data, hmacExported, sIv, signature, aesExported});
      let path = await fileSystem.downloadPath(basename);

      await fileSystem.writeBytes(path, decrypted);

      await applicationState.messageDownloadFinished(message);
      await storage.saveMessages(deviceId, applicationState.messages());
      callbacks.newMessage();

      return fileSystem.downloadFinished(path);
    },
    // TODO sync messages to all users devices
    sendMessage: async function(messageString, recipientUserId){
      logger.info(`Sending message ${messageString} to ${recipientUserId}`);

      // Save a local version to memory and storage
      let localMessage = await signal.localMessage(messageString, userId, recipientUserId, deviceId)
      await applicationState.addMessage(localMessage);
      await storage.saveMessages(deviceId, applicationState.messages());

      // This will be done async
      _sendLocalMessage(localMessage);

      return null;
    },
    resendMessage: async function(messageId) {
      let message = await applicationState.getMessageById(messageId);
      await applicationState.messageResending(message);
      await storage.saveMessages(deviceId, applicationState.messages());
      callbacks.newMessage();

      // This will be done async
      // TODO put all message types together
      if (message.attributes.decryptedBody.type === "local_file_message_v1") {
        _sendLocalFile(message)
      } else {
        _sendLocalMessage(message);
      }
    },
    getDevices: async function() {
      const {status, resp}= await api.getDevices(userId, 2000);
      if (status === "ok") {
        return resp;
      } else {
        return [];
      }
    },
    getDeviceId: async function() {
      return deviceId;
    },
    clearData: async function() {
      await storage.clearData();
      resetState();
    },
  }
})();

export default controller;
