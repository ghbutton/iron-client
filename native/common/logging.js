const logging = true
var logger = (function() {
  return {
    info: function(value) {
      if(logging){
        console.log(value);
      }
    },
    error: function(value) {
      console.log("ERROR: " + value);
    }
  }
})();

export default logger;
