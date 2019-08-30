import api from "./api.js";
import callbacks from "./callbacks.js";
import deviceOS from "./device_os.js";
import logger from "./logger.js";
import fileSystem from "./file_system.js";
import signal from "./signal.js";
import storage from "./storage.js";
import utility from "./utility.js";

const applicationState = (function() {
  let state = {connectedUsers: [], messages: [], lastRead: {}, downloads: []}

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

  async function _getMessagesToBeSent(type) {
    let messages = [];

    for(let i = 0; i< state.messages.length; i++){
      if (state.messages[i].meta.sent_at === null && state.messages[i].attributes.decryptedBody.type === type) {
        messages.push(state.messages[i]);
      }
    }

    return messages;
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
    addMessageMetadata: async function(localMessage, metaData) {
      for(let i = 0; i< state.messages.length; i++){
        if (localMessage.id === state.messages[i].id) {
          state.messages[i].meta.data = metaData;
        }
      }
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
    },
    getFilesToBeSent: async function() {
      return _getMessagesToBeSent("local_file_message_v1");
    },
    getMessagesToBeSent: async function() {
      return _getMessagesToBeSent("local_message_v1");
    },
    addDownload: async function(path, message, basename) {
      state.downloads.push({path, message, basename});
    },
    downloads: async function() {
      return state.downloads;
    }
  }
})();

window.applicationState = applicationState;
window.storage = storage;

const worker = (function() {
  const MESSAGES_TIME = 100;
  let needToGetMessages = false;

  async function _sendAndReceiveMessages(time) {
    const {status} = await _sendMessages();
    if (status !== "ok") {
      // exp backoff
      return setTimeout(_sendAndReceiveMessages, time * 2, time * 2);
    }

    const {status: statusFiles} = await _sendFiles();
    if (statusFiles !== "ok") {
      // exp backoff
      return setTimeout(_sendAndReceiveMessages, time * 2, time * 2);
    }

    const {status: statusMessages} = await _getMessages();
    if (statusMessages !== "ok") {
      // exp backoff
      return setTimeout(_sendAndReceiveMessages, time * 2, time * 2);
    }

    return setTimeout(_sendAndReceiveMessages, MESSAGES_TIME, MESSAGES_TIME);
  }

  async function _sendFiles() {
    const files = await applicationState.getFilesToBeSent();

    for (let i = 0; i < files.length; i++) {
      const localFile = files[i];

      if (localFile.meta.data !== undefined) {
        controller.uploadLocalFile(localFile);
      }
    }

    return {status: "ok"}
  }

  async function _sendMessages() {
    const messages = await applicationState.getMessagesToBeSent();

    for (let i = 0; i < messages.length; i++) {
      const localMessage = messages[i];
      const {status} = await controller.uploadLocalMessage(localMessage);
      if (status !== "ok") {
        return {status: "error"};
      }
    }
    return {status: "ok"}
  }

  async function _getMessages(){
    if (needToGetMessages){
      needToGetMessages = false;
      const messages = await api.getMessages();

      for(let i = 0; i < messages.length; i++) {
        const encryptedMessage = messages[i];
        await controller.decryptMessage(encryptedMessage)
      }
      callbacks.newMessage();
      return {status: "ok"}
    } else {
      return {status: "ok"}
    }
  }

  return {
    init: async function() {
      _sendAndReceiveMessages(MESSAGES_TIME)
    },
    getMessages: async function() {
      needToGetMessages = true;
      _getMessages();
    }
  };
})();

let controller = (function() {
  let [userId, userSessionToken, deviceId, deviceSecret] = [null, null, null, null, null];

  async function resetState(){
    [userId, userSessionToken, deviceId, deviceSecret] = [null, null, null, null, null];
  }

  async function _messageErrored(message) {
    await applicationState.messageErrored(message);
    await storage.saveMessages(deviceId, applicationState.messages());
    callbacks.newMessage();
  }

  async function _uploadFileContent(localFileMessage) {
    const {basename, filename} = localFileMessage.attributes.decryptedBody.data;

    const bytes = await fileSystem.readBytes(filename);
    const {encrypted, hmacExported, sIv, signature, aesExported} = await signal.aesEncrypt(bytes);


    const fileUpload = await api.uploadFile({encrypted, deviceId});

    if (!fileUpload) {
      await _messageErrored(localFileMessage);
      return;
    }

    await applicationState.addMessageMetadata(localFileMessage, {encrypted, hmacExported, sIv, signature, aesExported, basename, fileUploadId: fileUpload.id})
    await storage.saveMessages(deviceId, applicationState.messages());
  }

  async function _markDelivered(idempotencyKey) {
    await applicationState.messageDelivered(idempotencyKey);
    await storage.saveMessages(deviceId, applicationState.messages());
  }

  async function _searchIncludes(baseString, searchString) {
    baseString = baseString || "";
    baseString= baseString.replace(/\s+/g, "");
    baseString = baseString.toLowerCase();

    return baseString.includes(searchString);
  }

  async function _userDeviceChannelCallback(resp) {
    logger.debug("Joined user device successfully", resp);
    worker.getMessages();
  }

  async function _receiveMessagesCallback(response) {
    worker.getMessages();
  };

  async function _receiveMessagePackagesCallback(response) {
    let messagePackage = response.payload.data[0]

    _markDelivered(messagePackage.attributes.idempotency_key);
    callbacks.newMessage();
  };

  async function _uploadFile(filename, recipientUserId) {
    logger.debug(`Sending file ${filename} to ${recipientUserId}`);
    let basename = await fileSystem.basename(filename);
    let localFileMessage = await signal.localFileMessage({basename, filename}, userId, recipientUserId, deviceId);
    await applicationState.addMessage(localFileMessage);
    await storage.saveMessages(deviceId, applicationState.messages());

    _uploadFileContent(localFileMessage);
    return null;
  }

  return {
    init: async function(){
      logger.debug("Init");
      await storage.init();

      logger.debug("Worker");
      worker.init();

      logger.info("Storaged initialized");
      [userId, userSessionToken] = await storage.loadCurrentSession();

      let device = await storage.loadDevice(userId);

      if (device) {
        logger.debug("Device present");
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

      const _onSocketOpen = async () => {
        logger.info("Socket open");
        api.joinChannel("login", _onLoginChannelOk, _onLoginChannelError);
      }

      const _onApiChannelOk = async (resp) => {
        logger.debug("Joined api channel successfully", resp);
        // Create pre key bundle before joining device channel
        let bundle = await signal.getPreKeyBundle();
        await api.sendPreKeyBundle(bundle);

        await api.joinChannel("userDevice", _userDeviceChannelCallback);
        await api.userDeviceChannelReceiveMessages(_receiveMessagesCallback);
        await api.userDeviceChannelReceiveMessagePackages(_receiveMessagePackagesCallback);
        logger.debug("Done with api channel");

      }
      const _onLoginChannelOk = async () => {
        logger.debug("Login ok");

        if (!!userId && deviceId === null) {
          // TODO fix for native
          const name = await deviceOS.deviceName();
          const osName = await deviceOS.osName();

          let device = await api.createDevice(userId, userSessionToken, name, osName, 2000);
          await storage.saveDevice(userId, device);
          deviceId = device.id;
          await api.reconnect(userId, userSessionToken, deviceId, deviceSecret, _onSocketOpen);
        }

        const loaded = await signal.infoLoaded();

        if (!loaded) {
          const success = await signal.loadDeviceInfoFromDisk(deviceId);
          if (!success && userId) {
            await signal.generateDeviceInfo(deviceId);
          }
        }

        if (userId && deviceId) {
          await api.joinChannel("api", _onApiChannelOk);
        }
      }
      const _onLoginChannelError = async (resp) => {
        logger.debug("Login error", resp);
        if (resp.type === "force_upgrade") {
          callbacks.forceUpgrade();
        }
      }
      await api.connect(userId, userSessionToken, deviceId, deviceSecret, _onSocketOpen);
    },
    inspectStore: async function() {
      return signal.inspectStore();
    },
    getMessages: async function(connectedUserId) {
      return applicationState.connectedMessages(userId, connectedUserId);
    },

    uploadLocalFile: async function(localFileMessage) {
      const recipientUserId = localFileMessage.relationships.receiver.data.id;
      const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);

      if (!preKeyBundles) {
        await _messageErrored(localFileMessage);
        return;
      }
      const {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = localFileMessage.meta.data;

      let encryptedMessages = await signal.encryptFileMessages(preKeyBundles, {hmacExported, sIv, signature, aesExported, basename, fileUploadId}, deviceId);

      const {status} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localFileMessage.id);

      if(status === "ok") {
        await applicationState.messageSent(localFileMessage);
        await storage.saveMessages(deviceId, applicationState.messages());
        callbacks.newMessage();
      }
    },

    uploadLocalMessage: async function(localMessage) {
      const recipientUserId = localMessage.relationships.receiver.data.id;
      const senderUserId = localMessage.relationships.sender.data.id;
      const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);
      const myBundles = await api.getPreKeyBundlesByUserId(senderUserId);

      if (!preKeyBundles || !myBundles) {
        return {status: "error"};
      }

      // Send message to all of my other devices as well
      let extraBundles = [];
      for(let i = 0; i < myBundles.length; i++) {
        // Dont send it to this device
        if (! await utility.idsEqual(myBundles[i].relationships.device.data.id, deviceId)) {
          extraBundles.push(myBundles[i]);
        }
      }

      const combinedBundles = preKeyBundles.concat(extraBundles);

      // Send to receiver
      let encryptedMessages = await signal.encryptMessages(combinedBundles, localMessage.attributes.decryptedBody.data, deviceId);
      let {status} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localMessage.id);

      if(status === "ok") {
        await applicationState.messageSent(localMessage);
        await storage.saveMessages(deviceId, applicationState.messages());
        callbacks.newMessage();
        return {status: "ok"};
      } else {
        return {status: "error"};
      }
    },
    decryptMessage: async function(encryptedMessage) {
      let senderDeviceId = encryptedMessage.relationships.sender_device.data.id;

      logger.debug(`Got a message from ${senderDeviceId}`);

      // Dedup messages that we already have
      if (!await applicationState.hasMessage(encryptedMessage)) {
        let message = await signal.decryptMessage(deviceId, senderDeviceId, encryptedMessage);
        // Needs to happen atomically
        await applicationState.addMessage(message);
        await storage.saveMessages(deviceId, applicationState.messages());
        // END
      }

      await api.messageDelivered(encryptedMessage.id);
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
    currentUserId: function() {
      return userId;
    },
    currentDeviceId: function() {
      return deviceId;
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
        storage.saveSession(resp.payload.data[0]);
      }

      return {status, resp}
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
      let fileNames = await fileSystem.multiSelectFiles();
      if (fileNames === []) return;

      return await Promise.all(
        fileNames.map(
          fileName =>
            _uploadFile(fileName, recipientUserId)
        )
      )
    },
    // Only used by Electron
    downloadDirectory: async function(){
      const downloadDirectory = await storage.loadDownloadDirectory();
      if (!downloadDirectory) {
        const defaultDirectory = await fileSystem.defaultDownloadDirectory();
        return defaultDirectory;
      } else {
        return downloadDirectory;
      }
    },
    updateDownloadDirectory: async function() {
      const directories = await fileSystem.selectDirectory();
      if (!directories) {
        return;
      }
      const directory = directories[0];
      const defaultDirectory = await fileSystem.defaultDownloadDirectory();
      if(directory === defaultDirectory) {
        await storage.deleteDownloadDirectory();
      } else {
        await storage.saveDownloadDirectory(directory);
      }
    },
    getDownloads: async function() {
      return applicationState.downloads();
    },
    openDownload: async function(download) {
      // TODO make sure it is the same file with a checksum or something
      fileSystem.openItem(download.path);
    },
    openExternal: async function(website) {
      fileSystem.openExternal(website);
    },
    downloadFile: async function(message) {
      logger.info("Downloading file");

      await applicationState.messageDownloading(message);
      await storage.saveMessages(deviceId, applicationState.messages());
      callbacks.newDownload();

      const {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = message.attributes.decryptedBody.data
      const fileUpload = await api.downloadFile(fileUploadId);

      const decrypted = await signal.aesDecrypt({encrypted: fileUpload.attributes.data, hmacExported, sIv, signature, aesExported});
      const directory = await this.downloadDirectory();
      const {type, path, basename: newBasename} = await fileSystem.fileDownloadPath(directory, basename);


      if (type === "ok") {
        await fileSystem.writeBytes(path, decrypted);
        await applicationState.messageDownloadFinished(message);
        await storage.saveMessages(deviceId, applicationState.messages());
        await applicationState.addDownload(path, message, newBasename);
        callbacks.newDownload();

        return fileSystem.downloadFinished(path);
      } else {
        // TODO throw error
      }
    },
    sendMessage: async function(messageString, recipientUserId){
      logger.info(`Sending message ${messageString} to ${recipientUserId}`);

      // Save a local version to memory and storage
      let localMessage = await signal.localMessage(messageString, userId, recipientUserId, deviceId)
      await applicationState.addMessage(localMessage);
      await storage.saveMessages(deviceId, applicationState.messages());


      return null;
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
    getVersion: async function() {
      return window.app.getVersion();
    },
  }
})();

export default controller;
