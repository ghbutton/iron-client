import callbacks from "./callbacks.js";
import api from "./api.js";
import signal from "./signal.js";
import storage from "./storage.js";
import logger from "./logger.js";
import fileSystem from "./file_system.js";

let applicationState = (function() {
  let state = {connectedUsers: [], messages: []}

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

  return {
    insertObject: async function(key, value) {
      state[`${key}_${value.id}`] = value;
      const all = state[`${key}`] || new Set([]);
      state[`${key}`] = all.add(value);
    },
    connectedUser: async function(user) {
      await addDedup(state.connectedUsers, user);
    },
    connectedUsers: async function() {
      return state.connectedUsers;
    },
    messages: async function() {
      return state.messages;
    },
    addMessage: async function(message) {
      state.messages.push(message)
    },
    initMessages: async function(messages) {
      state.messages = messages;
    }
  }
})();

window.applicationState = applicationState;

let controller = (function() {
  let [userId, userSessionToken, preKeyBundleId, deviceId] = [null, null, null, null];
  const clientVersion = "0.0.1"

  async function _searchIncludes(baseString, searchString) {
    baseString = baseString || "";
    baseString= baseString.replace(/\s+/g, "");
    baseString = baseString.toLowerCase();

    return baseString.includes(searchString);
  }

  async function _apiChannelCallback(resp) {
    logger.info("Joined api channel successfully", resp);
    let bundle = await signal.getPreKeyBundle();
    let response = await api.sendPreKeyBundle(bundle);
    preKeyBundleId = response.payload.data[0].id;
    logger.info("Done with api channel");
  }

  async function _userDeviceChannelCallback(resp) {
    logger.info("Joined user device successfully", resp);
  }

  async function _loginChannelCallback(resp) {
    logger.info("Joined login successfully", resp);
  }

  async function _receiveMessagesCallback(response) {
    let encryptedMessage = response.payload.data[0]
    let senderPreKeyBundleId = encryptedMessage.relationships.sender_pre_key_bundle.data.id;

    logger.info(`Got a message from ${senderPreKeyBundleId}`);

    let senderPreKeyBundle = await api.getPreKeyBundlesById(senderPreKeyBundleId);
    let senderDeviceId = senderPreKeyBundle.relationships.device.data.id;

    logger.info(`Got a message from device: ${senderDeviceId}`);

    let message = await signal.decryptMessage(deviceId, senderDeviceId, response.payload);
    await applicationState.addMessage(message);
    await storage.saveMessages(deviceId, await applicationState.messages());
    callbacks.newMessage();
  };

  async function _uploadFile(filename, recipientUserId) {
    logger.info(`Sending file ${filename} to ${recipientUserId}`);
    let basename = await fileSystem.basename(filename);
    let bytes = await fileSystem.readBytes(filename);
    let {encrypted, hmacExported, sIv, signature, aesExported} = await signal.aesEncrypt(bytes);
    logger.info(`Encrypted`);

    let fileUpload = await api.uploadFile({encrypted, deviceId});
    logger.info(`Uploaded`);

    // Save a local version to memory and storage
    let localFileMessage = await signal.localFileMessage(basename, userId, recipientUserId, deviceId)
    await applicationState.addMessage(localFileMessage);
    await storage.saveMessages(deviceId, await applicationState.messages());

    // TODO use a queue system to send messages to the server
    const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);
    let encryptedMessages = await signal.encryptFileMessages(preKeyBundles, {hmacExported, sIv, signature, aesExported, basename, fileUploadId: fileUpload.id}, deviceId);
    await api.sendEncryptedMessages(encryptedMessages, preKeyBundleId);
  }

  return {
    init: async function(){
      logger.info("Async init");
      [userId, userSessionToken] = await storage.loadCurrentSession();

      deviceId = await storage.getDeviceId(userId);

      if (deviceId !== null) {
        applicationState.initMessages(await storage.loadMessages(deviceId));
      }

      return null;
    },
    connectToServer: async function() {
      logger.info("Connect to server");
      await api.connect(userId, userSessionToken, clientVersion, deviceId);
      await api.joinLoginChannel(_loginChannelCallback);

      if (userId && deviceId === null) {
        if (deviceId === null) {
          let device = await api.getDeviceId(userId, userSessionToken, 2000);
          // TODO additional security around device id?
          // So that a device can only get the messages for the device it is on
          // EG some kind of device secret that can be passed to the server when
          // connecting
          await storage.saveDeviceId(userId, device.id);
          deviceId = device.id;
          // TODO reconnect to socket if you get a new device id
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
      }
    },
    showOpenDialog: async function() {
    },
    inspectStore: async function() {
      return signal.inspectStore();
    },
    getMessages: async function(connectedUserId) {
      // TODO keep track of which message we are on.
      // Dedup messages
      let messages = await applicationState.messages();
      let connectedMessages = [];

      for (let i = 0; i < messages.length; i++) {
        let message = messages[i];
        if(message.attributes.decryptedBody.type === signal.syncLocalMessageType() || message.attributes.decryptedBody.type === signal.syncLocalFileMessageType()) {
          if (message.relationships.receiver.data.id === connectedUserId.toString()) {
            connectedMessages.push(message);
          }
        } else {
          let senderPreKeyBundleId = message.relationships.sender_pre_key_bundle.data.id;
          let receiverPreKeyBundleId = message.relationships.pre_key_bundle.data.id;

          let senderUser = await api.getUserByPreKeyBundleId(senderPreKeyBundleId);
          let receiverUser = await api.getUserByPreKeyBundleId(receiverPreKeyBundleId);

          if (senderUser.id === connectedUserId.toString() || (senderUser.id === userId.toString() && receiverUser.id === connectedUserId.toString())) {
            connectedMessages.push(message);
          }
        }
      }
      return connectedMessages;
    },
    // TODO make async
    currentUsersMessage: function(message) {
      if(message.attributes.decryptedBody.type === signal.syncLocalMessageType() || message.attributes.decryptedBody.type === signal.syncLocalFileMessageType()) {
        return (message.relationships.sender.data.id === userId.toString());
      } else {
        return (preKeyBundleId === message.relationships.sender_pre_key_bundle.data.id);
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
      let user = await api.getUserById(userId, 2000);
      await applicationState.insertObject("users", user);
      return user;
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
      const resp = await api.login(email, code, 2000);

      if (resp.payload) {
        storage.saveSession(resp.payload.data.sessions[0]);
      }

      return resp
    },
    getConnectedUsers: async function() {
      let [connections, connectedUsers] = await api.connectedUsers(2000, userId);
      for(let i = 0; i < connections.length; i++) {
        await applicationState.insertObject("connections", connections[i]);
      }

      for(let i = 0; i < connectedUsers.length; i++) {
        await applicationState.insertObject("users", connectedUsers[i]);
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

      for(let i = 0; i < fileNames.length; i++) {
        _uploadFile(fileNames[i], recipientUserId);
      }


    },
    downloadFile: async function(message) {
      console.log("Downloading file");
      console.log(message);

      let {hmacExported, sIv, signature, aesExported, basename, fileUploadId} = message.attributes.decryptedBody.data
      let fileUpload = await api.downloadFile(fileUploadId);

      let decrypted = await signal.aesDecrypt({encrypted: fileUpload.attributes.data, hmacExported, sIv, signature, aesExported});
      let path = await fileSystem.showSaveDialog(basename);

      if (path === undefined) return;

      console.log(decrypted);
      return fileSystem.writeBytes(path, decrypted);
    },
    sendMessage: async function(messageString, recipientUserId){
      logger.info(`Sending message ${messageString} to ${recipientUserId}`);
      const preKeyBundles = await api.getPreKeyBundlesByUserId(recipientUserId);

      // Save a local version to memory and storage
      let localMessage = await signal.localMessage(messageString, userId, recipientUserId, deviceId)
      await applicationState.addMessage(localMessage);
      await storage.saveMessages(deviceId, await applicationState.messages());

      // TODO use a queue system to send messages to the server
      let encryptedMessages = await signal.encryptMessages(preKeyBundles, messageString, deviceId);
      await api.sendEncryptedMessages(encryptedMessages, preKeyBundleId);
    }
  }
})();

export default controller;
