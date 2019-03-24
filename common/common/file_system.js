let fileSystem = (function() {
  return {
    readBytes: async function(path) {
      return window.fs.readFileSync(path, {encoding: "binary"});
    },
    writeBytes: async function(path, bytes) {
      return window.fs.writeFileSync(path, bytes, {encoding: "binary"});
    },
    basename: async function(path) {
      return window.path.basename(path);
    },
    showOpenDialog: async function() {
      return window.dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
    },
    showSaveDialog: async function(filename) {
      return window.dialog.showSaveDialog(null, {defaultPath: filename});
    }
  }
})()

export default fileSystem;
