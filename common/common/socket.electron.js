const {Socket} = require("phoenix-channels");

const socket = (function() {
  return {
    socket: function() {
      return Socket;
    },
  };
})();

export default socket;
