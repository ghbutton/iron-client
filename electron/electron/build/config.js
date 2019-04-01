const isDev = require('electron-is-dev');

if (isDev) {
  var wsProtocol = process.env.IRON_WS_PROTOCOL;
  var wsUrl = process.env.IRON_WS_URL;
  var wsPort = parseInt(process.env.IRON_WS_PORT, 10);
// Hack for Prod
} else {
  var wsProtocol = `wss`;
  var wsUrl = `www.ironnotice.com`;
  var wsPort = null;
}
