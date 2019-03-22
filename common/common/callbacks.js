let callbacks = (function() {
  return {
    newMessage: function() {
      window.apiCallbacks.newMessage();
    }
  }
})()

export default callbacks;
