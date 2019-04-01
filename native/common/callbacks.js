let callbacks = (function() {
  return {
    newMessage: function() {
      const event = new CustomEvent("new_message", {});
      // Dispatch the event.
      window.dispatchEvent(event);
    }
  }
})()

export default callbacks;
