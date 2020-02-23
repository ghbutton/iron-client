import logger from "./logger.js";
import { NativeEventEmitter, NativeModules } from 'react-native';
const { EventManager } = NativeModules;

const callbacks = (function() {
  return {
    loadedNoUser: function() {
      const eventEmitter = new NativeEventEmitter(EventManager);
      logger.debug("Callback - Loaded no user event");
      // Dispatch the event.
      eventEmitter.emit("loaded_no_user", {foo: "bar"});
    },
  };
})();

export default callbacks;
