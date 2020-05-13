import logger from "./logger.js";
import config from "./config.js";
import {NativeEventEmitter, NativeModules} from "react-native";
const {EventManager} = NativeModules;

import { Notifications } from 'react-native-notifications';

const engine = (function() {
  return {
    dispatch: function(name, opts) {
      const eventEmitter = new NativeEventEmitter(EventManager);

      // Dispatch the event.
      eventEmitter.emit(name, opts);
    },
    updateNumUnread: function(numUnread) {
      // dont do anything with num unread here
    },
    updateNumUnreceived: function(numUnreceived) {
      if (config.isIOS()) {
        Notifications.ios.setBadgeCount(numUnreceived);
      }
    },
  };
})();

export default engine;
