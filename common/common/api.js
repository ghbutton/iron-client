import utility from "./utility.js";
import config from "./config.js";
import logger from "./logger.js";
import socket from "./socket.js";

const Socket = socket.socket();

const api = (function() {
  let [socket, apiChannel, loginChannel, userChannel, userDeviceChannel] = [null, null, null, null, null];
  let [apiChannelReady, loginChannelReady, userChannelReady, userDeviceChannelReady] = [false, false, false, false];

  async function _resetState() {
    [socket, apiChannel, loginChannel, userChannel, userDeviceChannel] = [null, null, null, null, null];
    [apiChannelReady, loginChannelReady, userChannelReady, userDeviceChannelReady] = [false, false, false, false];
  }

  async function jsonApiPayload(type, attributes){
    return {
      payload: {
        data: {
          type: type,
          attributes: attributes,
        },
      }
    };
  }

  async function _sendPush(channel, topic, payload, timeout = 10000) {
    let [ready, results] = [false, null];

    channel.push(topic, payload, timeout).receive("ok", (pushResults) => {
      results = {status: "ok", resp: pushResults};
      ready = true;
    }).receive("error", (resp) => {
      results = {status: "error", resp: resp};
      ready = true;
    }).receive("timeout",
        () => {
          results = {status: "error", resp: JSON.parse("{\"message\": \"Server timeout, try again later\"}")};
          ready = true;
        },
    );

    while (true) {
      if (ready) {
        break;
      } else {
        await utility.sleep(10);
      }
    }

    return results;
  }

  async function _hasBinding(channel, event) {
    for (let i = 0; i < channel.bindings.length; i++) {
      if (channel.bindings[i].event === event) {
        return true;
      }
    }
    return false;
  }

  async function _waitForLoginChannel(_timeout) {
    await utility.pollForCondition(() => loginChannelReady, _timeout);
  }

  async function _waitForApiChannel(_timeout) {
    await utility.pollForCondition(() => apiChannelReady, _timeout);
  }

  return {
    connect: async function(userId, userSessionToken, deviceId, deviceSecret, onSocketOpen) {
      let url = `${config.wsProtocol()}://${config.wsUrl()}`;

      const wsPort = config.wsPort();
      const apiVersion = config.apiVersion();

      if (Number.isInteger(wsPort)) {
        url = url + `:${wsPort}`;
      }

      url = url + "/socket";

      socket = new Socket(url,
          {
            params: {
              user_id: userId || "",
              session_token: userSessionToken || "",
              api_version: apiVersion,
              device_id: deviceId || "",
              device_secret: deviceSecret || "",
            },
          },
      );

      userDeviceChannel = socket.channel(`device:connect:${deviceId}`, {});
      userChannel = socket.channel(`user:connect:${userId}`, {});
      apiChannel = socket.channel("api:connect", {});
      loginChannel = socket.channel("login:connect", {});

      socket.onOpen(() =>
        onSocketOpen(),
      );
      socket.onError( (err) => logger.error(err));
      socket.onClose( () => {
        apiChannelReady = false;
        loginChannelReady = false;
        userDeviceChannelReady = false;
        userChannelReady = false;

        logger.info("Socket Closed");
      });
      socket.connect();
    },
    disconnect: async function(...args) {
      logger.info("Disconnecting to the API");
      for (let i = 0; i < socket.channels.length; i++) {
        await socket.channels[i].leave();
      }
      await socket.disconnect();
      await _resetState();
    },
    joinChannel: async function(type, onOk, onError, onTimeout) {
      let channel = null;
      if (type === "login") {
        channel = loginChannel;
      } else if (type === "userDevice") {
        channel = userDeviceChannel;
      } else if (type === "user") {
        channel = userChannel;
      } else if (type === "api") {
        channel = apiChannel;
      } else {
        throw new Error(`Unrecognized channel type ${type}`);
      }

      const joined = (resp) => {
        if (type === "login") {
          if (!loginChannelReady && onOk) {
            onOk(resp);
          }
          loginChannelReady = true;
        } else if (type === "api") {
          if (!apiChannelReady && onOk) {
            onOk(resp);
          }
          apiChannelReady = true;
        } else if (type === "userDevice") {
          if (!userDeviceChannelReady && onOk) {
            onOk(resp);
          }
          userDeviceChannelReady = true;
        } else if (type === "user") {
          if (!userChannelReady && onOk) {
            onOk(resp);
          }
          userChannelReady = true;
        }
      };

      if (channel.joinedOnce) {
        joined();
      } else {
        channel.join()
            .receive("ok", async (resp) => {
              joined(resp);
            })
            .receive("error", async (resp) => {
              if (onError) {
                onError(resp);
              }
            })
            .receive("timeout", async (resp) => {
              if (onTimeout) {
                onTimeout(resp);
              }
            });
      }
    },
    userDeviceChannelReceiveMessages: async function(receiveMessagesCallback) {
      if (!await _hasBinding(userDeviceChannel, "POST:messages")) {
        logger.info("Setting up receive messages");
        userDeviceChannel.on("POST:messages", async (response) => {
          receiveMessagesCallback(response);
        });
      }
    },
    userDeviceChannelReceiveMessagePackages: async function(receiveMessagePackagesCallback) {
      if (!await _hasBinding(userDeviceChannel, "POST:message_packages")) {
        logger.info("Setting up receive message packages");
        userDeviceChannel.on("POST:message_packages", async (response) => {
          receiveMessagePackagesCallback(response);
        });
      }
    },
    userChannelReceiveConnections: async function(receiveConnectionsCallback) {
      if (!await _hasBinding(userChannel, "POST:connections")) {
        logger.info("Setting up receive conections");
        userChannel.on("POST:connections", async (response) => {
          receiveConnectionsCallback(response);
        });
      }
    },
    updateUser: async function(userId, attributes) {
      await _waitForApiChannel();

      const payload = await jsonApiPayload("user", attributes)
      return _sendPush(apiChannel, `PATCH:users:${userId}`, payload);
    },
    messageDelivered: async function(messageId) {
      await _waitForApiChannel();

      const attributes = { delivered_at: "now" };
      const payload = await jsonApiPayload("message", attributes);

      return _sendPush(apiChannel, `PATCH:messages:${messageId}`, payload);
    },
    sendVerificationCode: async function(email, timeout) {
      await _waitForLoginChannel(timeout);
      const attributes = {email};
      const payload = await jsonApiPayload("email_verification", attributes)

      return _sendPush(loginChannel, "POST:email_verifications", payload);
    },
    sendIdentityKey: async function(publicKey, registrationId, timeout) {
      await _waitForApiChannel(timeout);

      const attributes = {public_key: publicKey, registration_id: registrationId}
      const payload = await jsonApiPayload("identity_key", attributes)
      return _sendPush(apiChannel, "POST:identity_keys", payload);
    },
    sendSignedPreKey: async function(publicKey, keyId, signature, timeout) {
      await _waitForApiChannel(timeout);

      const attributes = {public_key: publicKey, key_id: keyId, signature};
      const payload = await jsonApiPayload("signed_pre_key", attributes);
      return _sendPush(apiChannel, "POST:signed_pre_keys", payload);
    },
    sendPreKey: async function(publicKey, keyId, timeout) {
      await _waitForApiChannel(timeout);

      const attributes = {public_key: publicKey, key_id: keyId};
      const payload =  await jsonApiPayload("pre_key", attributes);
      return _sendPush(apiChannel, "POST:pre_keys", payload);
    },
    createConnection: async function(user, timeout) {
      await _waitForApiChannel(timeout);

      const attributes = {user_id: user.id};
      const payload =  await jsonApiPayload("connection", attributes);

      return _sendPush(apiChannel, "POST:connections", payload);
    },
    sendInvitation: async function(name, email, timeout) {
      await _waitForApiChannel(timeout);

      const attributes = {name, email};
      const payload =  await jsonApiPayload("invitation", attributes);

      return _sendPush(apiChannel, "POST:invitations", payload);
    },
    login: async function(email, code, timeout) {
      await _waitForLoginChannel(timeout);

      const attributes = {email, code};
      const payload =  await jsonApiPayload("session", attributes);

      return _sendPush(loginChannel, "POST:sessions", payload);
    },
    failedToJoin: async function(timeout) {
      await _waitForApiChannel(timeout);
      return !!(socket);
    },
    getUserById: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      const {status, resp} = await _sendPush(apiChannel, "GET:users", {id: userId});
      if (status === "ok") {
        return {status: "ok", resp: resp.payload.data[0]};
      } else {
        return {status, resp};
      }
    },
    getUserByEmail: async function(email, timeout) {
      await _waitForApiChannel(timeout);

      const {status, resp} = await _sendPush(apiChannel, "GET:users", {email: email});
      if (status === "ok") {
        return {status: "ok", resp: resp.payload.data[0]};
      } else {
        return {status, resp};
      }
    },
    getOrganizationMembershipByUserId: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      const {status, resp} = await _sendPush(apiChannel, "GET:organization_memberships", {user_id: userId});
      if (status === "ok") {
        return {status: "ok", resp: resp.payload.data[0]};
      } else {
        return {status, resp};
      }
    },
    getOrganizationById: async function(id, timeout) {
      await _waitForApiChannel(timeout);

      const {status, resp} = await _sendPush(apiChannel, "GET:organizations", {id: id});
      if (status === "ok") {
        return {status: "ok", resp: resp.payload.data[0]};
      } else {
        return {status, resp};
      }
    },
    getDevices: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      const {status, resp} = await _sendPush(apiChannel, "GET:devices", {user_id: userId});
      if (status === "ok") {
        const devices = resp.payload.data;

        return {status: "ok", resp: devices};
      } else {
        return {status, resp};
      }
    },
    createDevice: async function(userId, userSessionToken, name, osName, timeout) {
      await _waitForLoginChannel(timeout);

      const attributes = {user_session_token: userSessionToken, name: name, os_name: osName};
      const payload =  await jsonApiPayload("device", attributes);
      const {status, resp}= await _sendPush(loginChannel, "POST:devices", payload);

      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    getPreKeyStatus: async function() {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:pre_key_statuses", {});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    getIdentityKey: async function(deviceId) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:identity_keys", {"device_id": deviceId});
      if (status === "ok") {
        return {status, identityKey: resp.payload.data[0]};
      } else {
        return {status};
      }
    },
    getSignedPreKey: async function(deviceId) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:signed_pre_keys", {"device_id": deviceId});
      if (status === "ok") {
        return {status, signedPreKey: resp.payload.data[0]};
      } else {
        return {status};
      }
    },
    getPreKey: async function(deviceId) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:pre_keys", {"device_id": deviceId});
      if (status === "ok") {
        return {status, preKey: resp.payload.data[0]};
      } else {
        return {status};
      }
    },
    getMessages: async function() {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:messages", {});
      if (status === "ok") {
        return resp.payload.data;
      } else {
        return [];
      }
    },
    getDevicesByUserId: async function(userId) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:devices", {"user_id": userId});
      if (status === "ok") {
        return {status: "ok", devices: resp.payload.data};
      } else {
        return {status: "error"};
      }
    },
    sendEncryptedMessages: async function(encryptedMessages, senderDeviceId, senderUserId, receiverUserId, idempotencyKey) {
      const messages = [];
      for (const {message, deviceId} of encryptedMessages) {
        messages.push(
            {
              "type": "message",
              "attributes": {
                "type": message.type,
                "body": message.body,
                "device_id": deviceId,
                "sender_device_id": senderDeviceId,
                "sender_user_id": senderUserId,
                "receiver_user_id": receiverUserId,
                "idempotency_key": idempotencyKey,
              },
            },
        );
      }

      const attributes = {messages}
      const payload = await jsonApiPayload("messages", attributes);

      return _sendPush(apiChannel, "POST:messages", payload);
    },
    uploadFile: async function({encrypted, deviceId}) {
      const attributes = { "device_id": deviceId, "data": encrypted }
      const payload = await jsonApiPayload("file_upload", attributes);

      const {status, resp} = await _sendPush(apiChannel, "POST:file_uploads", payload, 120000);
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    uploadFileChunk: async function({data, filePackageId, index}) {
      const attributes = { "file_package_id": filePackageId, "index": index, "data": data}
      const payload = await jsonApiPayload("file_chunk", attributes);

      const {status, resp} = await _sendPush(apiChannel, "POST:file_chunks", payload);
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    uploadFilePackage: async function({numChunks, deviceId}) {
      const attributes = { "device_id": deviceId, "num_chunks": numChunks }
      const payload = await jsonApiPayload("file_package", attributes);

      const {status, resp} = await _sendPush(apiChannel, "POST:file_packages", payload);
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    getFilePackage: async function(filePackageId) {
      const {status, resp} = await _sendPush(apiChannel, "GET:file_packages", {"id": filePackageId});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    getFileChunk: async function(filePackageId, index) {
      const {status, resp} = await _sendPush(apiChannel, "GET:file_chunks", {"file_package_id": filePackageId, "index": index});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    getFileUpload: async function(fileUploadId) {
      const {status, resp} = await _sendPush(apiChannel, "GET:file_uploads", {"id": fileUploadId});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    connectedUsers: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      if (!userId) {
        throw new Error(`Cannot get connected users for an invalid userId ${userId}`);
      }

      const connections = [];

      const {status, resp: connectionsResp} = await _sendPush(apiChannel, "GET:connections", {});

      if (status === "ok") {
        const connectedUsers = await Promise.all(connectionsResp.payload.data.map(async (connection) => {
          connections.push(connection);

          const connectedUserId = connection.relationships.users.data[0].id === userId ? connection.relationships.users.data[1].id : connection.relationships.users.data[0].id;
          const {status, resp: usersResp} = await _sendPush(apiChannel, "GET:users", {"id": connectedUserId});
          if (status === "ok") {
            const usersById = await Promise.all(usersResp.payload.data.map((user) => {
              return user;
            }));
            return usersById[0];
          } else {
            return null;
          }
        }));

        return [connections, connectedUsers];
      } else {
        return null;
      }
    },
    uploadNotificationToken: async (token, timeout) => {
      await _waitForApiChannel(timeout);

      const attributes = {token}
      const payload = await jsonApiPayload("notification_token", attributes);

      return _sendPush(apiChannel, "PUT:notification_tokens", payload);
    }
  };
})();

export default api;
