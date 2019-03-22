const isDev = (process.env.NODE_ENV === "development");

let config = (function() {
  return {
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
    }
  }
})()

export default config;
