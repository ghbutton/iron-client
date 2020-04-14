const fs = window.fs;
const fs_path = window.path;
const dialog = window.dialog;
const app = window.app;
const shell = window.shell;

const fileSystem = (function() {
  return {
    openItem(path) {
      shell.openItem(path);
    },
    openExternal(webpage) {
      shell.openExternal(webpage);
    },
    readBase64: async function(path) {
      return fs.readFileSync(path, {encoding: "base64"});
    },
    writeBase64: async function(path, base64) {
      return fs.writeFileSync(path, base64, {encoding: "base64"});
    },
    basename: async function(path) {
      return fs_path.basename(path);
    },
    extname: async function(path) {
      return fs_path.extname(path);
    },
    selectDirectory: async function() {
      return dialog.showOpenDialog({properties: ["openDirectory"]});
    },
    selectFile: async function() {
      const file = await dialog.showOpenDialog({properties: ["openFile"]});
      if (file === undefined || file.length !== 1) {
        return null;
      }
      return file[0];
    },
    multiSelectFiles: async function() {
      const files = await dialog.showOpenDialog({properties: ["openFile", "multiSelections"]});
      if (files === undefined) {
        return [];
      }
      return files;
    },
    showSaveDialog: async function(filename) {
      return dialog.showSaveDialog(null, {defaultPath: filename});
    },
    fileDownloadPath: async function(directory, basename) {
      const fullPath = `${directory}/${basename}`;
      if (fs.existsSync(fullPath)) {
        const {name, ext} = fs_path.parse(basename);
        for (let i = 1; i < 100; i++) {
          const newBasename = `${name} (${i})${ext}`;
          const newFullpath = `${directory}/${newBasename}`;
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
  };
})();

export default fileSystem;
