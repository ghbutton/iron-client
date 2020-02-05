import config from "./config.js";

const logger = (function() {
  return {
    info: function(...value) {
      console.log("[info] ", ...value);
    },
    debug: function(...value) {
      if (config.isDev()) {
        console.log("[debug]", ...value);
      }
    },
    error: function(...value) {
      console.log("[ERROR] ", ...value);
    },
  };
})();

export default logger;
