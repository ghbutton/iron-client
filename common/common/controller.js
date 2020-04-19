import api from "./api.js";
import config from "./config.js";
import callbacks from "./callbacks.js";
import deviceOS from "./device_os.js";
import logger from "./logger.js";
import fileSystem from "./file_system.js";
import signal from "./signal.js";
import storage from "./storage.js";
import utility from "./utility.js";

const applicationState = (function() {
  let state = null;

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
    const messages = [];

    for (let i = 0; i< state.messages.length; i++) {
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
    init: async function() {
      state = {connectedUsers: [], messages: [], lastRead: {}, downloads: []};
    },
    insertUser: async function(user) {
      return insertObject("users", user);
    },
    insertConnection: async function(connection) {
      return insertObject("connections", connection);
    },
    connectedUser: async function(user) {
      await addDedup(state.connectedUsers, user);
    },
    connectedUsers: async function() {
      return state.connectedUsers;
    },
    connectedMessages: function(userId, connectedUserId) {
      const connectedMessages = [];

      for (let i = 0; i < state.messages.length; i++) {
        const message = state.messages[i];
        if (message.attributes.decryptedBody.type === signal.syncLocalMessageType() || message.attributes.decryptedBody.type === signal.syncLocalFileMessageType()) {
          if (message.relationships.receiver.data.id === connectedUserId.toString()) {
            connectedMessages.push(message);
          }
        } else {
          const senderUserId = message.relationships.sender_user.data.id;
          const receiverUserId = message.relationships.receiver_user.data.id;

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
      state.messages.push(message);
    },
    initMessages: async function(messages) {
      state.messages = messages;
    },
    initLastRead: async function(lastRead) {
      state.lastRead = lastRead;
    },
    hasMessage: async function(message) {
      return state.messages.some((thisMessage) => {
        return thisMessage.id === message.id;
      });
    },
    addMessageMetadata: async function(localMessage, metaData) {
      for (let i = 0; i< state.messages.length; i++) {
        if (localMessage.id === state.messages[i].id) {
          state.messages[i].meta.data = metaData;
        }
      }
    },
    messageSent: async function(localMessage) {
      // TODO, should the server send something back to say the message has been received?
      for (let i = 0; i< state.messages.length; i++) {
        if (localMessage.id === state.messages[i].id) {
          state.messages[i].meta.sent_at = Date.now();
        }
      }
    },
    messageDelivered: async function(id) {
      for (let i = 0; i< state.messages.length; i++) {
        if (id === state.messages[i].id) {
          state.messages[i].meta.delivered_at = Date.now();
        }
      }
    },
    // TODO refactor for loops into a single method.
    messageDownloadFinished: async function(message) {
      for (let i = 0; i< state.messages.length; i++) {
        if (message.id === state.messages[i].id) {
          state.messages[i].meta.downloading_at = null;
          state.messages[i].meta.downloaded_at = Date.now();
        }
      }
    },
    // TODO refactor for loops into a single method.
    messageDownloading: async function(message) {
      for (let i = 0; i< state.messages.length; i++) {
        if (message.id === state.messages[i].id) {
          state.messages[i].meta = state.messages[i].meta || {};
          state.messages[i].meta.downloading_at = Date.now();
        }
      }
    },
    getMessageById: async function(id) {
      for (let i = 0; i< state.messages.length; i++) {
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
    },
    inspectState: async function() {
      return state;
    },
  };
})();

window.applicationState = applicationState;
window.storage = storage;

const worker = (function() {
  const MESSAGES_TIME = 100;
  let needToGetMessages = false;
  let initialized = false;

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

    return {status: "ok"};
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
    return {status: "ok"};
  }

  async function _getMessages() {
    if (needToGetMessages) {
      needToGetMessages = false;
      const messages = await api.getMessages();

      for (let i = 0; i < messages.length; i++) {
        const encryptedMessage = messages[i];
        await controller.decryptMessage(encryptedMessage);
      }
      callbacks.newMessage();
      return {status: "ok"};
    } else {
      return {status: "ok"};
    }
  }

  return {
    init: async function() {
      needToGetMessages = true;
      if (!initialized) {
        initialized = true;
        _sendAndReceiveMessages(MESSAGES_TIME);
      }
    },
    getMessages: async function() {
      // Messages will be handled by the worker thread, just set the flag
      needToGetMessages = true;
    },
  };
})();

const controller = (function() {
  let [userId, userSessionToken, deviceId, deviceSecret, initialized] = [null, null, null, null, null, false];

  async function resetState() {
    logger.info("Resetting controller state");
    [userId, userSessionToken, deviceId, deviceSecret, initialized] = [null, null, null, null, null, false];
  }

  async function _messageErrored(message) {
    await applicationState.messageErrored(message);
    await storage.saveMessages(deviceId, applicationState.messages());
    callbacks.newMessage();
  }

  async function _uploadFileContent(localFileMessage) {
    const {basename, filename} = localFileMessage.attributes.decryptedBody.data;

    const data64 = await fileSystem.readBase64(filename);
    const {encrypted, hmacExported, sIv, signature, aesExported} = await signal.aesEncrypt(data64);

    const fileUpload = await api.uploadFile({encrypted, deviceId});

    if (!fileUpload) {
      await _messageErrored(localFileMessage);
      return;
    }

    await applicationState.addMessageMetadata(localFileMessage, {encrypted, hmacExported, sIv, signature, aesExported, basename, fileUploadId: fileUpload.id});
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

  async function _userChannelCallback(resp) {
    logger.debug("Joined user successfully", resp);
  }

  async function _receiveMessagesCallback(response) {
    worker.getMessages();
  }

  async function _receiveConnectionsCallback(response) {
    callbacks.newConnection();
  }

  async function _receiveMessagePackagesCallback(response) {
    const messagePackage = response.payload.data[0];

    _markDelivered(messagePackage.attributes.idempotency_key);
    callbacks.newMessage();
  }

  async function _buildSession(recipientDeviceId, myDeviceId) {
    logger.info(`No session for device id ${recipientDeviceId}`);
    const {status: statusIdentity, identityKey} = await api.getIdentityKey(recipientDeviceId);
    const {status: statusSigned, signedPreKey} = await api.getSignedPreKey(recipientDeviceId);
    const {status: statusPre, preKey} = await api.getPreKey(recipientDeviceId);

    if (statusIdentity === "ok" && statusSigned === "ok" && statusPre === "ok") {
      await signal.buildSession(recipientDeviceId, identityKey, signedPreKey, preKey, myDeviceId);
      return {status: "ok"};
    } else {
      return {status: "error"};
    }
  }

  async function _recipientDevices(recipientUserId, senderUserId, myDeviceId) {
    const {status: devicesStatus, devices} = await api.getDevicesByUserId(recipientUserId);
    const {status: myDevicesStatus, devices: myDevices} = await api.getDevicesByUserId(senderUserId);

    if (devicesStatus !== "ok" || myDevicesStatus !== "ok") {
      return {status: "error"};
    }

    // Send message to all of my other devices as well
    const extraDevices = [];
    for (let i = 0; i < myDevices.length; i++) {
      // Dont send it to this device
      if (!await utility.idsEqual(myDevices[i].id, myDeviceId)) {
        extraDevices.push(myDevices[i]);
      }
    }

    return {status: "ok", devices: devices.concat(extraDevices)};
  }

  async function _numUnread() {
    const connectedUsers = await applicationState.connectedUsers();
    let numUnread = 0;
    for (let i = 0; i < connectedUsers.length; i++) {
      const connectedUser = connectedUsers[i];
      const lastRead = applicationState.userLastRead(connectedUser.id);
      const messages = applicationState.connectedMessages(userId, connectedUser.id);

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.attributes.inserted_at) {
          const insertedAt = new Date(message.attributes.inserted_at).getTime() / 1000;
          if (insertedAt > lastRead) {
            numUnread = numUnread + 1;
          }
        }
      }
    }

    return numUnread;
  }

  async function _uploadFile(filename, recipientUserId) {
    logger.debug(`Sending file ${filename} to ${recipientUserId}`);
    const basename = await fileSystem.basename(filename);
    const localFileMessage = await signal.localFileMessage({basename, filename}, userId, recipientUserId, deviceId);
    await applicationState.addMessage(localFileMessage);
    await storage.saveMessages(deviceId, applicationState.messages());

    _uploadFileContent(localFileMessage);
    return null;
  }

  return {
    init: async function() {
      logger.debug("Init");
      await storage.init();
      await applicationState.init();

      [userId, userSessionToken] = await storage.loadCurrentSession();

      const device = await storage.loadDevice(userId);

      logger.info("Storaged initialized");
      initialized = true;

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
    resetComponents: async function() {
      await storage.reset();
      await applicationState.init();
    },
    connectToServer: async function() {
      logger.info("Connect to server");

      const _onSocketOpen = async () => {
        logger.info("Socket open");
        api.joinChannel("login", _onLoginChannelOk, _onLoginChannelError);
      };

      const _onApiChannelOk = async (resp) => {
        logger.debug("Joined api channel successfully", resp);
        // Create pre key bundle before joining device channel
        const preKeyStatus = await api.getPreKeyStatus();
        const loaded = await signal.infoLoaded();

        if (!loaded) {
          const success = await signal.loadDeviceInfoFromDisk(deviceId);
          if (!success && userId) {
            await signal.generateDeviceInfo(deviceId);
          }
        }

        // TODO
        // Needs to be successful before sending messages...
        if (preKeyStatus.attributes.need_identity_key === true) {
          // TODO make idempotent, dont generate a bunch of keys and throw an error
          const publicKey = await signal.getIdentityPublicKey();
          const registrationId = await signal.getRegistrationId();

          // TODO: Make sure this succeeds
          await api.sendIdentityKey(publicKey, registrationId, 5000);
        }

        if (preKeyStatus.attributes.need_signed_pre_key === true) {
          // generate and upload signed pre key
          // TODO make idempotent, dont generate a bunch of keys and throw an error
          const {keyId, signature, publicKey} = await signal.generateSignedPreKey(deviceId);
          await api.sendSignedPreKey(publicKey, keyId, signature, 5000);
        }

        if (preKeyStatus.attributes.need_pre_keys === true) {
          // generate and upload 100 pre keys
          // TODO make idempotent, dont generate a bunch of keys and throw an error
          const preKeys = await signal.generatePreKeys(deviceId, 100);
          for (let i = 0; i < preKeys.length; i++) {
            const preKey = preKeys[i];
            await api.sendPreKey(preKey.publicKey, preKey.keyId, 5000);
          }
        }

        logger.debug("Worker");
        worker.init();

        await api.joinChannel("userDevice", _userDeviceChannelCallback);
        await api.joinChannel("user", _userChannelCallback);
        await api.userDeviceChannelReceiveMessages(_receiveMessagesCallback);
        await api.userDeviceChannelReceiveMessagePackages(_receiveMessagePackagesCallback);
        await api.userChannelReceiveConnections(_receiveConnectionsCallback);
        callbacks.loadedWithUser();
        logger.debug("Done with api channel");
      };
      const _onLoginChannelOk = async () => {
        logger.debug("Login ok");

        if (!!userId && deviceId === null) {
          // TODO fix for native
          const name = await deviceOS.deviceName();
          const osName = await deviceOS.osName();

          const device = await api.createDevice(userId, userSessionToken, name, osName, 2000);
          await storage.saveDevice(userId, device);
          deviceId = device.id;
          await api.disconnect();
          await api.connect(userId, userSessionToken, deviceId, deviceSecret, _onSocketOpen);
        }

        if (userId && deviceId) {
          // TODO
          // This should only run once or should be idempotent
          // Or have some kind of clean up because it is called multiple times
          await api.joinChannel("api", _onApiChannelOk);
        } else {
          callbacks.loadedNoUser();
        }
      };
      const _onLoginChannelError = async (resp) => {
        logger.debug("Login error", resp);
        if (resp.type === "force_upgrade") {
          callbacks.forceUpgrade();
        }
      };
      await api.connect(userId, userSessionToken, deviceId, deviceSecret, _onSocketOpen);
    },
    disconnectFromServer: async function() {
      await api.disconnect();
    },
    inspectSignalStore: async function() {
      // Debugging only
      return signal.inspectStore();
    },
    inspectApplicationState: async function() {
      // Debugging only
      return applicationState.inspectState();
    },
    getMessages: async function(connectedUserId) {
      return applicationState.connectedMessages(userId, connectedUserId);
    },

    uploadLocalFile: async function(localFileMessage) {
      const recipientUserId = localFileMessage.relationships.receiver.data.id;
      const senderUserId = localFileMessage.relationships.sender.data.id;
      const {status, devices: combinedDevices} = await _recipientDevices(recipientUserId, senderUserId, deviceId);

      if (status !== "ok") {
        return {status};
      }

      // Send to receiver
      for (let i = 0; i < combinedDevices.length; i++) {
        if (!await signal.hasSession(combinedDevices[i].id)) {
          const {status: sessionStatus} = await _buildSession(combinedDevices[i].id, deviceId);
          if (sessionStatus !== "ok") {
            return {status: sessionStatus};
          }
        }
      }

      const {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = localFileMessage.meta.data;
      const encryptedMessages = [];

      for (let i = 0; i < combinedDevices.length; i++) {
        const encryptedMessage = await signal.encryptFileMessage(combinedDevices[i].id, {hmacExported, sIv, signature, aesExported, basename, fileUploadId}, deviceId);
        encryptedMessages.push(encryptedMessage);
      }

      const {status: messageStatus} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localFileMessage.id);

      if (messageStatus === "ok") {
        await applicationState.messageSent(localFileMessage);
        await storage.saveMessages(deviceId, applicationState.messages());
        callbacks.newMessage();
      }
    },

    uploadLocalMessage: async function(localMessage) {
      const recipientUserId = localMessage.relationships.receiver.data.id;
      const senderUserId = localMessage.relationships.sender.data.id;
      const {status, devices: combinedDevices} = await _recipientDevices(recipientUserId, senderUserId, deviceId);

      if (status !== "ok") {
        return {status};
      }

      // Send to receiver
      for (let i = 0; i < combinedDevices.length; i++) {
        if (!await signal.hasSession(combinedDevices[i].id)) {
          const {status: sessionStatus} = await _buildSession(combinedDevices[i].id, deviceId);

          if (sessionStatus !== "ok") {
            return {status: sessionStatus};
          }
        }
      }

      const encryptedMessages = [];

      for (let i = 0; i < combinedDevices.length; i++) {
        const encryptedMessage = await signal.encryptMessage(combinedDevices[i].id, localMessage.attributes.decryptedBody.data, deviceId);
        encryptedMessages.push(encryptedMessage);
      }

      const {status: messageStatus} = await api.sendEncryptedMessages(encryptedMessages, deviceId, userId, recipientUserId, localMessage.id);

      if (messageStatus === "ok") {
        await applicationState.messageSent(localMessage);
        await storage.saveMessages(deviceId, applicationState.messages());
        callbacks.newMessage();
        return {status: "ok"};
      } else {
        return {status: "error"};
      }
    },
    decryptMessage: async function(encryptedMessage) {
      const senderDeviceId = encryptedMessage.relationships.sender_device.data.id;

      logger.debug(`Got a message from ${senderDeviceId}`);

      // Dedup messages that we already have
      if (!await applicationState.hasMessage(encryptedMessage)) {
        const message = await signal.decryptMessage(deviceId, senderDeviceId, encryptedMessage);
        // START Needs to happen atomically
        await applicationState.addMessage(message);
        await storage.saveMessages(deviceId, applicationState.messages());
        // END
      }

      await api.messageDelivered(encryptedMessage.id);
      const numUnread = await _numUnread();
      callbacks.updateNumUnread(numUnread);
    },
    hasUnreadMessages: function(connectedUserId) {
      const lastRead = applicationState.userLastRead(connectedUserId);
      const messages = applicationState.connectedMessages(userId, connectedUserId);

      for (let i = 0; i < messages.length; i++) {
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

      for (let i = 0; i < messages.length; i++) {
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
      const numUnread = await _numUnread();
      console.log(numUnread);
      callbacks.updateNumUnread(numUnread);
    },
    // TODO make async ??
    currentUserId: function() {
      return userId;
    },
    currentDeviceId: function() {
      return deviceId;
    },
    currentUser: async function() {
      if (await this.notLoggedIn()) {
        return null;
      } else {
        return this.getUserById(userId);
      }
    },
    currentUserHasName: async function() {
      const currentUser = await window.controller.currentUser();
      return !(currentUser && (currentUser.attributes.name === "" || currentUser.attributes.name == null));
    },
    notLoggedIn: async function() {
      await utility.pollForCondition(() => initialized, 5000);
      return userId === null;
    },
    getUserById: async function(userId) {
      const {status, resp} = await api.getUserById(userId, 2000);
      if (status === "ok") {
        await applicationState.insertUser(resp);
        return resp;
      } else {
        return null;
      }
    },
    getUserByEmail: async function(email) {
      const {status, resp} = await api.getUserByEmail(email, 2000);
      if (status === "ok") {
        await applicationState.insertUser(resp);
        return resp;
      } else {
        return null;
      }
    },
    getOrganizationMembershipByUserId: async function(userId) {
      const {status, resp} = await api.getOrganizationMembershipByUserId(userId, 2000);
      if (status === "ok") {
        return resp;
      } else {
        return null;
      }
    },
    getOrganizationById: async function(id) {
      const {status, resp} = await api.getOrganizationById(id, 2000);
      if (status === "ok") {
        return resp;
      } else {
        return null;
      }
    },
    updateUser: async function(params) {
      return api.updateUser(userId, params);
    },
    sendVerificationCode: async function(email) {
      const resp = await api.sendVerificationCode(email, 2000);
      return resp;
    },
    login: async function(email, code) {
      const {status, resp} = await api.login(email, code, 2000);

      if (status === "ok" && resp.payload) {
        await storage.saveSession(resp.payload.data[0]);
      }

      return {status, resp};
    },
    getConnectedUsers: async function() {
      const [connections, connectedUsers] = await api.connectedUsers(2000, userId);
      for (let i = 0; i < connections.length; i++) {
        await applicationState.insertConnection(connections[i]);
      }

      for (let i = 0; i < connectedUsers.length; i++) {
        await applicationState.insertUser(connectedUsers[i]);
        await applicationState.connectedUser(connectedUsers[i]);
      }

      return applicationState.connectedUsers();
    },
    connectedUsersSearch: async function(searchString) {
      const connectedUsers = await this.getConnectedUsers();
      searchString = searchString.toLowerCase();
      searchString = searchString.replace(/\s+/g, "");


      const searchResults = [];

      for (let i = 0; i < connectedUsers.length; i++) {
        const user = connectedUsers[i];

        if (await _searchIncludes(user.attributes.name, searchString) || await _searchIncludes(user.attributes.email, searchString)) {
          searchResults.push(user);
        }
      }

      return searchResults;
    },
    createNewInvitation: async function(name, email) {
      return api.sendInvitation(name, email, 2000);
    },
    createNewConnection: async function(user) {
      return api.createConnection(user, 2000);
    },
    readAvatar: async function(filename) {
      const base64 = await fileSystem.readBase64(filename);
      const extname = await fileSystem.extname(filename);
      if ([".jpg", ".png"].includes(extname.toLowerCase())) {
        return {status: "ok", bytes: base64, extname};
      } else {
        return {status: "error", resp: "only support .jpg and .png files."};
      }
    },
    selectFiles: async function() {
      const filenames = await fileSystem.multiSelectFiles();
      return filenames;
    },
    selectFile: async function() {
      const filename = await fileSystem.selectFile();
      return filename;
    },
    uploadFiles: async function(recipientUserId, filenames) {
      if (filenames === []) return;

      return await Promise.all(
        filenames.map(
          (filename) =>
            _uploadFile(filename, recipientUserId),
        ),
      );
    },
    downloadDirectory: async function() {
      // Electron only
      //      const downloadDirectory = await storage.loadDownloadDirectory();
      //      if (!downloadDirectory) {
      //        const defaultDirectory = config.defaultDownloadDirectory();
      //        return defaultDirectory;
      //      } else {
      //        return downloadDirectory;
      //      }
      const defaultDirectory = config.defaultDownloadDirectory();
      return defaultDirectory;
    },
    //    updateDownloadDirectory: async function() {
    //      // Electron only
    //      const directories = await fileSystem.selectDirectory();
    //      if (!directories) {
    //        return;
    //      }
    //      const directory = directories[0];
    //      const defaultDirectory = config.defaultDownloadDirectory();
    //      if (directory === defaultDirectory) {
    //        await storage.deleteDownloadDirectory();
    //      } else {
    //        await storage.saveDownloadDirectory(directory);
    //      }
    //    },
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

      const {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = message.attributes.decryptedBody.data;
      const fileUpload = await api.downloadFile(fileUploadId);

      const decrypted64 = await signal.aesDecrypt({encrypted: fileUpload.attributes.data, hmacExported, sIv, signature, aesExported});
      const directory = await this.downloadDirectory();
      const {type, path, basename: newBasename} = await fileSystem.fileDownloadPath(directory, basename);

      if (type === "ok") {
        await fileSystem.writeBase64(path, decrypted64);
        await applicationState.messageDownloadFinished(message);
        await storage.saveMessages(deviceId, applicationState.messages());
        await applicationState.addDownload(path, message, newBasename);
        callbacks.newDownload();

        return fileSystem.downloadFinished(path);
      } else {
        // TODO throw error
      }
    },
    sendMessage: async function(messageString, recipientUserId) {
      logger.info(`Sending message ${messageString} to ${recipientUserId}`);

      // Save a local version to memory and storage
      const localMessage = await signal.localMessage(messageString, userId, recipientUserId, deviceId);
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
      return this.reset();
    },
    getVersion: async function() {
      return deviceOS.getClientVersion();
    },
    reset: async function() {
      await this.disconnectFromServer();
      await this.resetComponents();
      await resetState();
      await this.init();
      await this.connectToServer();
    },
    emitLoggedIn: async function() {
      return callbacks.loadedWithUser();
    },
    isEmail: async function(email) {
      const re = /\S+@\S+\.\S+/;
      return re.test(email);
    },
  };
})();

export default controller;
