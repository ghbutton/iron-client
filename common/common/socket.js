import {Socket} from "phoenix";

const socket = (function() {
  return {
    socket: function() {
      return Socket;
    },
  };
})();

export default socket;
