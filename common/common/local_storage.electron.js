let localStorage = (function() {
  return {
    basePath: function() {
      return window.localStorage.getItem("basePath");
    }
  }
})()

export default localStorage;
