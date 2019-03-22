let util = (function() {
  return {
    sleep: async function(milliseconds) {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
  }
})()

export default util;
