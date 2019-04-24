const os = window.os;

let deviceOS = (function() {
  return {
    deviceName: async function() {
      return os.hostname();
    },
    osName: async function() {
      return os.type();
    }
  }
})()

export default deviceOS;
