import logger from "./logger.js";

const callbacks = (function() {
  return {
    newMessage: function() {
      const event = new CustomEvent("new_message", {});
      logger.debug("Callback - New message event");
      // Dispatch the event.
      window.dispatchEvent(event);
    },
    newConnection: function() {
      const event = new CustomEvent("new_connection", {});
      logger.debug("Callback - New connection event");
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
    loadedNoUser: function() {
      const event = new CustomEvent("loaded_no_user", {});
      logger.debug("Callback - Loaded no user event");
      // Dispatch the event.
      window.dispatchEvent(event);
    },
    loadedWithUser: function() {
      const event = new CustomEvent("loaded_with_user", {});
      logger.debug("Callback - Loaded with user event");
      // Dispatch the event.
      window.dispatchEvent(event);
    }
  };
})();

export default callbacks;
