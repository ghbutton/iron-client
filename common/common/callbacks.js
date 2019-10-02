import logger from "./logger.js";

let callbacks = (function() {
  return {
    newMessage: function() {
      const event = new CustomEvent("new_message", {});
     logger.debug("Callback - New message event");
      // Dispatch the event.
      window.dispatchEvent(event);
    },
    newDownload: function() {
      const event = new CustomEvent("new_download", {});
      logger.debug("Callback - New download");
      // Dispatch the event.
      window.dispatchEvent(event);
    },
    forceUpgrade: function() {
      const event = new CustomEvent("force_upgrade", {});
      logger.debug("Callback - Force upgrade event");
      // Dispatch the event.
      window.dispatchEvent(event);
    },
  }
})()

export default callbacks;
