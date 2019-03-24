import utility from "./utility.js";
import config from "./config.js";
import logger from "./logger.js";
const { Socket } = require('phoenix-channels')

let api = (function() {
  let [socket, userDeviceChannel, apiChannel, loginChannel] = [null, null, null, null];
  let [apiChannelReady, loginChannelReady] = [false, false];
  let [failedToJoin] = [false];

  async function _sendPush(channel, event, options) {
    let [ready, results] = [false, null];

    channel.push(event, options).receive("ok", pushResults => {
      results = pushResults;
      ready = true;
    });

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
    connect: async function(userId, userSessionToken, clientVersion, deviceId) {
      let url = `${config.wsProtocol()}://${config.wsUrl()}`;

      let wsPort = config.wsPort();

      if (Number.isInteger(wsPort)) {
        url = url + `:${wsPort}`;
      }

      url = url + `/socket`;

      socket = new Socket(url,
        {
          params: {
            userId: userId,
            sessionToken: userSessionToken,
            clientVersion: clientVersion,
            deviceId: deviceId
          }
        }
      );

      userDeviceChannel = socket.channel(`device:connect:${deviceId}`, {})
      apiChannel = socket.channel("api:connect", {})
      loginChannel = socket.channel("login:connect", {})
      socket.connect();
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

      const updateResp = await _sendPush(apiChannel, `PATCH:users:${userId}`, payload);
      return updateResp;
    },
    sendPreKeyBundle: async function(payload){
      return _sendPush(apiChannel, "POST:pre_key_bundles", payload);
    },
    sendVerificationCode: async function(email, timeout) {
      await waitForLoginChannel(timeout);

      const resp = await _sendPush(loginChannel, "POST:email_verifications", {email: email});
      return resp;
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

      const resp = await _sendPush(loginChannel, "POST:sessions", {email: email, code: code});
      return resp;
    },
    failedToJoin: async function(timeout) {
      await _waitForApiChannel(timeout);
      return !!(socket) && failedToJoin
    },
    getUserById: async function(userId, timeout) {
      await _waitForApiChannel(timeout);

      let usersResp = await _sendPush(apiChannel, "GET:users", {id: userId});
      let user = usersResp.payload.data[0];

      return user;
    },
    getDeviceId: async function(userId, userSessionToken, timeout) {
      await waitForLoginChannel(timeout);

      const resp = await _sendPush(loginChannel, "POST:devices", {user_session_token: userSessionToken});
      return resp.payload.data.devices[0];
    },
    getPreKeyBundlesById: async function(id) {
      await _waitForApiChannel();

      const preKeyBundlesResp = await _sendPush(apiChannel, "GET:pre_key_bundles", {"id": id});
      return preKeyBundlesResp.payload.data[0]
    },
    getPreKeyBundlesByUserId: async function(userId) {
      await _waitForApiChannel();

      const preKeyBundlesResp = await _sendPush(apiChannel, "GET:pre_key_bundles", {"user_id": userId});
      return preKeyBundlesResp.payload.data
    },
    getUserByPreKeyBundleId: async function(preKeyBundleId){
      await _waitForApiChannel()

      const userResp = await _sendPush(apiChannel, "GET:users", {pre_key_bundle_id: preKeyBundleId});
      return userResp.payload.data[0];
    },
    sendEncryptedMessages: async function(encryptedMessages, senderPreKeyBundleId) {
      for (let {message, preKeyBundleId} of encryptedMessages) {
        let payload = {
          "payload" : {
            "data": {
              "type": "message",
              "attributes": {
                "type": message.type,
                "body": message.body,
                "pre_key_bundle_id": preKeyBundleId,
                "sender_pre_key_bundle_id": senderPreKeyBundleId
              }
            }
          }
        }

        await _sendPush(apiChannel, "POST:messages", payload);
      }
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

      let resp = await _sendPush(apiChannel, "POST:file_uploads", payload);
      return resp.payload.data[0];
    },
    downloadFile: async function(fileUploadId) {
      const resp = await _sendPush(apiChannel, "GET:file_uploads", {"id": fileUploadId});
      return resp.payload.data[0];
    },
    connectedUsers: async function(timeout, userId){
      await _waitForApiChannel(timeout);
      let connections = [];

      const connectionsResp = await _sendPush(apiChannel, "GET:connections", {});

      const connectedUsers = await Promise.all(connectionsResp.payload.data.map(async (connection) => {
        connections.push(connection);

        let connectedUserId = connection.relationships.users.data[0].id === userId ? connection.relationships.users.data[1].id : connection.relationships.users.data[0].id;
        const usersResp = await _sendPush(apiChannel, "GET:users", {"id": connectedUserId});
        let usersById = await Promise.all(usersResp.payload.data.map((user) => {
          return user;
        }));
        return usersById[0];
      }));

      return [connections, connectedUsers];
    }
  }
})()

export default api;
