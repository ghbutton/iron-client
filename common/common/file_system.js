const fs = window.fs;
const fs_path = window.path;
const dialog = window.dialog;

let fileSystem = (function() {
  return {
    readBytes: async function(path) {
      return fs.readFileSync(path, {encoding: "binary"});
    },
    writeBytes: async function(path, bytes) {
      return fs.writeFileSync(path, bytes, {encoding: "binary"});
    },
    basename: async function(path) {
      return fs_path.basename(path);
    },
    showOpenDialog: async function() {
      return dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
    },
    showSaveDialog: async function(filename) {
      return dialog.showSaveDialog(null, {defaultPath: filename});
    }
  }
})()

export default fileSystem;
