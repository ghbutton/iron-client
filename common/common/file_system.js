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
      const files = await dialog.showOpenDialog({properties: ['openFile', 'multiSelections']});
      if (files === undefined) {
        return [];
      }
      return files;
    },
    showSaveDialog: async function(filename) {
      return dialog.showSaveDialog(null, {defaultPath: filename});
    },
    defaultDownloadDirectory: async function() {
      return app.getPath("downloads");
    },
    fileDownloadPath: async function(directory, basename) {
      const fullPath = `${directory}/${basename}`;
      if (fs.existsSync(fullPath)) {
        const {name, ext} = fs_path.parse(basename);
        for (let i = 1; i < 100; i++) {
          const newBasename = `${name} (${i})${ext}`
          const newFullpath = `${directory}/${newBasename}`
          if (!fs.existsSync(newFullpath)) {
            return {type: "ok", path: newFullpath, basename: newBasename};
          }
        }
        return {type: "error", path: null};
      } else {
        return {type: "ok", path: `${directory}/${basename}`, basename: basename};
      }

    },
    downloadFinished: async function(path) {
      app.dock.downloadFinished(path);
    },
  }
})()

export default fileSystem;
