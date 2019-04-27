// Preloading hack for electron + react....
// Fucking hate this shit
// https://stackoverflow.com/questions/53426331/open-file-dialog-from-react-component-using-electron
window.dialog = require('electron').remote.dialog;
window.fs = require('fs');
window.path = require('path');
window.app = require("electron").remote.app;
window.shell = require("electron").shell;
window.os = require('os');
