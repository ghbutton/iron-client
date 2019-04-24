import utility from "./utility.js";
import config from "./config.js";
import logger from "./logger.js";
const { Socket } = require('phoenix-channels')

let api = (function() {
  let [socket, userDeviceChannel, apiChannel, loginChannel] = [null, null, null, null];
  let [apiChannelReady, loginChannelReady] = [false, false];
  let [failedToJoin] = [false];

  async function _sendPush(channel, topic, payload, timeout = 10000) {
    let [ready, results] = [false, null];

    channel.push(topic, payload, timeout).receive("ok", pushResults => {
      results = {status: "ok", resp: pushResults};
      ready = true;
    }).receive("error", resp => {
      results = {status: "error", resp: resp};
      ready = true;
    }).receive("timeout",
      () => {
        results = {status: "error", resp: JSON.parse(`{"message": "Server timeout, try again later"}`)};
        ready = true;
      }
    );

    while(true) {
      if (ready) {
        break;
      } else {
        await utility.sleep(10);
      }
    }

    return results;
  }

  async function waitForLoginChannel(_timeout) {
    while (true) {
      if (loginChannelReady || failedToJoin) {
        return true;
      } else {
        await utility.sleep(10);
      }
    }
  }

  async function _waitForApiChannel(_timeout) {
    while (true) {
      if  (apiChannelReady || failedToJoin) {
        return true;
      } else {
        await utility.sleep(10);
      }
    }
  }

  return {
    connect: async function(userId, userSessionToken, clientVersion, deviceId, deviceSecret) {
      let url = `${config.wsProtocol()}://${config.wsUrl()}`;

      let wsPort = config.wsPort();

      if (Number.isInteger(wsPort)) {
        url = url + `:${wsPort}`;
      }

      url = url + `/socket`;

      socket = new Socket(url,
        {
          params: {
            user_id: userId,
            session_token: userSessionToken,
            client_version: clientVersion,
            device_id: deviceId,
            device_secret: deviceSecret
          }
        }
      );

      userDeviceChannel = socket.channel(`device:connect:${deviceId}`, {})
      apiChannel = socket.channel("api:connect", {})
      loginChannel = socket.channel("login:connect", {})
      socket.connect();
    },
    reconnect: async function(userId, userSessionToken, clientVersion, deviceId, deviceSecret) {
      await socket.disconnect();
      return this.connect(userId, userSessionToken, clientVersion, deviceId, deviceSecret);
    },
    joinApiChannel: async function(apiChannelCallback){
      apiChannel.join()
        .receive("ok", async resp => {
          await apiChannelCallback(resp);
          apiChannelReady = true;
        })
      .receive("error", async resp => {
        logger.info("Unable to join api", resp)
        failedToJoin = true;
      })
      .receive("timeout", async resp  => {
        failedToJoin = true;
      })
    },
    joinUserDeviceChannel: async function(userDeviceChannelCallback) {
      await _waitForApiChannel(2000);
      userDeviceChannel.join()
        .receive("ok", async resp => {
          await userDeviceChannelCallback(resp);
        })
      .receive("error", async resp => {
        logger.info("Unable to join user", resp)
        failedToJoin = true;
      })
    },
    joinLoginChannel: async function(loginChannelCallback) {
      loginChannel.join()
        .receive("ok", async resp => {
          loginChannelReady = true;
          await loginChannelCallback(resp);
        })
        .receive("error", async resp => {
          logger.info("Unable to join", resp)
          failedToJoin = true;
        })
    },
    userDeviceChannelReceiveMessages: async function(receiveMessagesCallback){
      userDeviceChannel.on("POST:messages", async (response) => {
        receiveMessagesCallback(response);
      });
    },
    userDeviceChannelReceiveMessagePackages: async function(receiveMessagePackagesCallback){
      userDeviceChannel.on("POST:message_packages", async (response) => {
        receiveMessagePackagesCallback(response);
      });
    },
    updateUser: async function(userId, {name}) {
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

      return _sendPush(apiChannel, `PATCH:users:${userId}`, payload);
    },
    messageDelivered: async function(messageId) {
      await _waitForApiChannel();

      let payload = {
        payload: {
          data: {
            type: "message",
            attributes: {
              delivered_at: "now"
            }
          }
        }
      }

      return _sendPush(apiChannel, `PATCH:messages:${messageId}`, payload);
    },
    sendPreKeyBundle: async function(payload){
      return _sendPush(apiChannel, "POST:pre_key_bundles", payload);
    },
    sendVerificationCode: async function(email, timeout) {
      await waitForLoginChannel(timeout);

      return _sendPush(loginChannel, "POST:email_verifications", {email: email});
    },
    sendInvitation: async function(name, email, timeout) {
      await _waitForApiChannel(timeout);

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

      return _sendPush(apiChannel, "POST:invitations", payload);
    },
    login: async function(email, code, timeout) {
      await waitForLoginChannel(timeout);

      return _sendPush(loginChannel, "POST:sessions", {email: email, code: code});
    },
    failedToJoin: async function(timeout) {
      await _waitForApiChannel(timeout);
      return !!(socket) && failedToJoin
    },
    getUserById: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      let {status, resp} = await _sendPush(apiChannel, "GET:users", {id: userId});
      if (status === "ok") {
        let user = resp.payload.data[0];

        return {status: "ok", resp: user};
      } else {
        return {status, resp}
      }
    },
    getDevices: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      let {status, resp} = await _sendPush(apiChannel, "GET:devices", {user_id: userId});
      if (status === "ok") {
        let devices = resp.payload.data;

        return {status: "ok", resp: devices};
      } else {
        return {status, resp}
      }
    },
    createDevice: async function(userId, userSessionToken, name, osName, timeout) {
      await waitForLoginChannel(timeout);

      const {status, resp}= await _sendPush(loginChannel, "POST:devices", {user_session_token: userSessionToken, name: name, os_name: osName});
      if (status === "ok") {
        return resp.payload.data.devices[0];
      } else {
        return null;
      }
    },
    getPreKeyBundlesById: async function(id) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:pre_key_bundles", {"id": id});
      if (status === "ok") {
        return resp.payload.data[0]
      } else {
        return null;
      }
    },
    getMessages: async function() {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:messages", {});
      if (status === "ok") {
        return resp.payload.data
      } else {
        return null;
      }
    },
    getPreKeyBundlesByUserId: async function(userId) {
      await _waitForApiChannel();

      const {status, resp} = await _sendPush(apiChannel, "GET:pre_key_bundles", {"user_id": userId});
      if (status === "ok") {
        return resp.payload.data
      } else {
        return null;
      }
    },
    getUserByPreKeyBundleId: async function(preKeyBundleId){
      await _waitForApiChannel()

      const {status, resp}= await _sendPush(apiChannel, "GET:users", {pre_key_bundle_id: preKeyBundleId});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    sendEncryptedMessages: async function(encryptedMessages, senderDeviceId, senderUserId, receiverUserId, idempotencyKey) {
      let messages = [];
      for (let {message, deviceId} of encryptedMessages) {
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
              "idempotency_key": idempotencyKey
            }
          }
        )
      }

      let payload = {
        "payload" : {
          "data": messages
        }
      }

      return _sendPush(apiChannel, "POST:messages", payload);
    },
    uploadFile: async function({encrypted, deviceId}) {
      let payload = {
        "payload" : {
          "data": {
            "type": "file_upload",
            "attributes": {
              "device_id": deviceId,
              "data": encrypted
            }
          }
        }
      }

      let {status, resp} = await _sendPush(apiChannel, "POST:file_uploads", payload, 60000);
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    downloadFile: async function(fileUploadId) {
      const {status, resp} = await _sendPush(apiChannel, "GET:file_uploads", {"id": fileUploadId});
      if (status === "ok") {
        return resp.payload.data[0];
      } else {
        return null;
      }
    },
    connectedUsers: async function(timeout, userId){
      await _waitForApiChannel(timeout);
      let connections = [];

      const {status, resp: connectionsResp} = await _sendPush(apiChannel, "GET:connections", {});

      if (status === "ok") {
        const connectedUsers = await Promise.all(connectionsResp.payload.data.map(async (connection) => {
          connections.push(connection);

          let connectedUserId = connection.relationships.users.data[0].id === userId ? connection.relationships.users.data[1].id : connection.relationships.users.data[0].id;
          const {status, resp: usersResp} = await _sendPush(apiChannel, "GET:users", {"id": connectedUserId});
          if (status === "ok") {
            let usersById = await Promise.all(usersResp.payload.data.map((user) => {
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
    }
  }
})()

export default api;
