// Preloading hack for electron + react....
// Fucking hate this shit
// https://electronjs.org/docs/api/process#event-loaded
window.dialog = require('electron').remote.dialog;
window.fs = require('fs');
window.path = require('path');
window.app = require("electron").remote.app;
window.shell = require("electron").shell;
window.os = require('os');
