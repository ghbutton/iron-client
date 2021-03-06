import logger from "./logger.js";
import engine from "./callback_engine.js";

const callbacks = (function() {
  return {
    updateNumUnread: function(numUnread) {
      logger.debug(`Callback - Update num unread ${numUnread}`);
      engine.updateNumUnread(numUnread);
    },
    updateNumUnreceived: function(numUnreceived) {
      logger.debug(`Callback - Update num unreceived ${numUnreceived}`);
      engine.updateNumUnreceived(numUnreceived);
    },
    newMessage: function() {
      logger.debug("Callback - New message event");
      engine.dispatch("new_message", {});
    },
    newConnection: function() {
      logger.debug("Callback - New connection");
      engine.dispatch("new_connection", {});
    },
    newDownload: function() {
      logger.debug("Callback - New download");
      engine.dispatch("new_download", {});
    },
    forceUpgrade: function() {
      logger.debug("Callback - Force upgrade");
      engine.dispatch("force_upgrade", {});
    },
    loadedNoUser: function() {
      logger.debug("Callback - Loaded no user");
      engine.dispatch("loaded_no_user", {});
    },
    loadedWithUser: function() {
      logger.debug("Callback - Loaded with user");
      engine.dispatch("loaded_with_user", {});
    },
  };
})();

export default callbacks;
