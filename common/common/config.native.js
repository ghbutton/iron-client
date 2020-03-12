const isDev = __DEV__;
const API_VERSION = 5;

const config = (function() {
  return {
    isDev: function() {
      return isDev;
    },
    wsProtocol: function() {
      if (isDev) {
        return "ws";
      } else {
        return "wss";
      }
    },
    wsUrl: function() {
      if (isDev) {
        return "localhost";
//        return "192.168.5.16";
      } else {
        return "www.ironnotice.com";
      }
    },
    wsPort: function() {
      if (isDev) {
        return 4000;
      } else {
        return null;
      }
    },
    basePath: function() {
      return "";
    },
    apiVersion: function() {
      return API_VERSION;
    },
  };
})();

export default config;
