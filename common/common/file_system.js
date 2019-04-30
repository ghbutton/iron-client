const fs = window.fs;
const fs_path = window.path;
const dialog = window.dialog;
const app = window.app;
const shell = window.shell;

let fileSystem = (function() {
  return {
    openItem(path) {
      shell.openItem(path);
    },
    openExternal(webpage) {
      shell.openExternal(webpage);
    },
    readBytes: async function(path) {
      return fs.readFileSync(path, {encoding: "binary"});
    },
    writeBytes: async function(path, bytes) {
      return fs.writeFileSync(path, bytes, {encoding: "binary"});
    },
    basename: async function(path) {
      return fs_path.basename(path);
    },
    selectDirectory: async function() {
      return dialog.showOpenDialog({properties: ["openDirectory"]});
    },
    multiSelectFiles: async function() {
      return dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
    },
    showSaveDialog: async function(filename) {
      return dialog.showSaveDialog(null, {defaultPath: filename});
    },
    defaultDownloadDirectory: async function() {
      const downloads = app.getPath("downloads");
      return downloads;
    },
    fileDownloadPath: async function(basename) {
      const downloads = app.getPath("downloads");
      const fullPath = `${downloads}/${basename}`;
      if (fs.existsSync(fullPath)) {
        const {name, ext} = fs_path.parse(basename);
        for (let i = 1; i < 100; i++) {
          const newBasename = `${name} (${i})${ext}`
          const newFullpath = `${downloads}/${newBasename}`
          if (!fs.existsSync(newFullpath)) {
            return {type: "ok", path: newFullpath};
          }
        }
        return {type: "error", path: null};
      } else {
        return {type: "ok", path: `${downloads}/${basename}`};
      }

    },
    downloadFinished: async function(path) {
      app.dock.downloadFinished(path);
    },
  }
})()

export default fileSystem;
