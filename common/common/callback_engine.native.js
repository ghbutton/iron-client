import logger from "./logger.js";
import {NativeEventEmitter, NativeModules} from "react-native";
const {EventManager} = NativeModules;

const engine = (function() {
  return {
    updateNumUnread: function(numUnread) {
      // TODO set the badge for the app
    },
    dispatch: function(name, opts) {
      const eventEmitter = new NativeEventEmitter(EventManager);

      // Dispatch the event.
      eventEmitter.emit(name, opts);
    },
  };
})();

export default engine;
