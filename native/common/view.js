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
        return message.attributes.decryptedBody.data.basename
      } else {
        return message.attributes.decryptedBody.data
      }
    },
    messageHasLink: function(message) {
      if (message.attributes.decryptedBody.type === "fm") {
        return true;
      } else {
        return false;
      }
    }
  }
})()

export default view;
