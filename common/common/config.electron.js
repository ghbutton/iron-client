import localStorage from "./local_storage.js";

const isDev = (process.env.NODE_ENV === "development");
const app = window.app;
const API_VERSION = 5;

const config = (function() {
  return {
    isDev: function() {
      return isDev;
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
    basePath: function() {
      if (isDev) {
        if (localStorage.basePath()) {
          return localStorage.basePath();
        } else {
          return "/tmp/iron/storage";
        }
      } else {
        return `${app.getPath("userData")}/storage`;
      }
    },
    apiVersion: function() {
      return API_VERSION;
    },
  };
})();

export default config;
