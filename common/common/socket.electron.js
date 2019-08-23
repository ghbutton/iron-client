const { Socket } = require('phoenix-channels')

let socket = (function() {
  return {
    socket: function() {
      return Socket;
    }
  }
})()

export default socket;
