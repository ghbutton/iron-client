let view = (function() {
  return {
    userDisplay: function(user) {
      let name = user.attributes.name;

      if (name === null || name === "") {
        return user.attributes.email;
      } else {
        return name
      }
    },
    messageDisplay: function(message) {
      if (message.attributes.decryptedBody.type === "fm") {
        return message.attributes.decryptedBody.data.basename;
      } else if (message.attributes.decryptedBody.type === "local_file_message_v1") {
        return `FILE - ${message.attributes.decryptedBody.data.basename}`;
        } else if (message.attributes.decryptedBody.type === "local_message_v1") {
        return message.attributes.decryptedBody.data;
      } else if (message.attributes.decryptedBody.type === "m") {
        return message.attributes.decryptedBody.data;
      }
    },
    messageTimestamp: function(message) {
      let date = null;
      const meta = message.meta || {};
      if (message.attributes.decryptedBody.type === "fm") {
        date = new Date(message.attributes.inserted_at + "Z");
      } else if (message.attributes.decryptedBody.type === "local_file_message_v1" && meta.sent_at) {
        date = new Date(meta.sent_at);
      } else if (message.attributes.decryptedBody.type === "local_message_v1" && meta.sent_at) {
        date = new Date(meta.sent_at);
      } else if (message.attributes.decryptedBody.type === "m") {
        date = new Date(message.attributes.inserted_at + "Z");
      }

      return date;
    },
    messageDisplayTimestamp: function(timestamp) {
      if (timestamp === null) {
        return null;
      } else {
        return `${timestamp.getHours().toString().padStart(2, '0')} ${timestamp.getMinutes().toString().padStart(2, '0')}`;
      }
    },
    timestampBreakDisplay: function(timestamp) {
      return `${timestamp.getMonth().toString().padStart(2, "0")}/${timestamp.getDate().toString().padStart(2, "0")}/${timestamp.getFullYear()}`
    },
    messageHasLink: function(message) {
      if (message.attributes.decryptedBody.type === "fm") {
        return true;
      } else {
        return false;
      }
    },
    deviceDisplay: function(device, deviceId) {
      let osDisplayName;
      if (device.os_name === "Darwin") {
        osDisplayName = "OS X";
      } else if (device.os_name === "Windows_NT") {
        osDisplayName = "Windows";
      }

      if (!device.os_name) {
        return "Unknown";
      } else {
        return `${osDisplayName} - ${device.name} ${device.id === deviceId ? "(this)" : ""}`
      }
    },
    currentUsersMessage: function(message, userId) {
      let senderId = null;
      if (message.relationships.sender) {
        senderId = message.relationships.sender.data.id;
      } else if (message.relationships.sender_user) {
        senderId = message.relationships.sender_user.data.id;
      }

      return (senderId === userId.toString());
    },
    messageState: function(message, userId) {
      const meta = message.meta || {};
      const fromMe = this.currentUsersMessage(message, userId);
      const fromThisDevice = (message.attributes.decryptedBody.type.startsWith("local"));
      const {downloading_at, downloaded_at, sent_at, delivered_at, errored_at, sending_at} = meta;
      const sent = !!sent_at;
      const delivered = !!delivered_at;
      const errored = !!errored_at || (!sent && (!sending_at || sending_at < Date.now() - 60000));
      const downloading = !!downloading_at && (downloading_at > Date.now() - 60000);

      // TODO, fix to query the server if something has been delievered or not
      if ((fromMe && delivered) || (fromMe && !fromThisDevice)) {
        return "delivered";
      } else if (fromMe && sent) {
        return "sent";
      } else if (fromMe && !fromThisDevice && errored) {
        return "errored";
      } else if (downloading) {
        return "downloading";
      } else if (downloaded_at) {
        return "donwloaded";
      } else if (fromMe && !sent && !delivered && !errored) {
        return "sending";
      } else {
        return null;
      }
    },
  }
})()

export default view;
