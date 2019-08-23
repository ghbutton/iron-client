import { Socket } from 'phoenix'

let socket = (function() {
  return {
    socket: function() {
      return Socket;
    }
  }
})()

export default socket;
