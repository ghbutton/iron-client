const isDev = (process.env.NODE_ENV === "development");
const app = window.app;
const API_VERSION = 6;

const config = (function() {
  return {
    isDev: function() {
      return isDev;
    },
    isElectron: function() {
      return true;
    },
    isReactNative: function() {
      return false;
    },
    wsProtocol: function() {
      if (isDev) {
        return process.env.REACT_APP_IRON_WS_PROTOCOL;
      } else {
        return "wss";
      }
    },
    wsUrl: function() {
      if (isDev) {
        return process.env.REACT_APP_IRON_WS_URL;
      } else {
        return "www.ironnotice.com";
      }
    },
    wsPort: function() {
      if (isDev) {
        return parseInt(process.env.REACT_APP_IRON_WS_PORT, 10);
      } else {
        return null;
      }
    },
    privateDataPath: function() {
      if (isDev) {
        if (window.localStorage.getItem("privateDataPath")) {
          // For debugging only, so you can have two electron instances on the same computer and
          // they will use different storage paths
          return `${window.localStorage.getItem("privateDataPath")}/storage`;
        } else {
          return "/tmp/iron/storage";
        }
      } else {
        return `${app.getPath("userData")}/storage`;
      }
    },
    defaultDownloadDirectory: function() {
      return app.getPath("downloads");
    },
    apiVersion: function() {
      return API_VERSION;
    },
  };
})();

export default config;
