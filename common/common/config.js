const isDev = (process.env.NODE_ENV === "development");
const os = window.os;
const API_VERSION = 2;

let config = (function() {
  return {
    isDev: function() {
      return isDev;
    },
    wsProtocol: function() {
      if (isDev) {
        return process.env.REACT_APP_IRON_WS_PROTOCOL;
      } else {
        return `wss`;
      }
    },
    wsUrl: function() {
      if (isDev) {
        return process.env.REACT_APP_IRON_WS_URL;
      } else {
        return `www.ironnotice.com`;
      }
    },
    wsPort: function() {
      if (isDev) {
        return parseInt(process.env.REACT_APP_IRON_WS_PORT, 10);
      } else {
        return null;
      }
    },
    basePath: function() {
      if (isDev) {
        if (window.localStorage.getItem("basePath")) {
          return window.localStorage.getItem("basePath");
        } else {
          return "/tmp/iron/storage";
        }
      } else {
        // TODO make this different for windows and os x
        return `${os.homedir()}/Library/Application Support/Iron/Storage`;
      }
    },
    apiVersion: function() {
      return API_VERSION;
    },
  }
})()

export default config;
